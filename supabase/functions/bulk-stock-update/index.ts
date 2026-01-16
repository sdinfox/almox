import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Content-Type': 'application/json',
};

// Define a estrutura esperada para cada item na carga
interface BulkItem {
  codigo: string;
  nome: string;
  unidade_medida: string;
  quantidade: number;
  descricao?: string;
  categoria?: string;
  quantidade_minima?: number;
  localizacao?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // 1. Autenticação e Verificação de Admin
  // ... (Lógica de autenticação e verificação de perfil 'admin' similar a 'create-user')

  // 2. Processar Payload
  const body: { items: BulkItem[] } = await req.json();
  const { items } = body;

  if (!items || !Array.isArray(items) || items.length === 0) {
    // ... (Retorno de erro 400)
  }

  // 3. Criar Cliente com Service Role Key (necessário para operações de admin)
  const serviceRoleClient = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  );

  let createdCount = 0;
  let updatedCount = 0;
  const errors: { item: BulkItem, message: string }[] = [];

  for (const item of items) {
    try {
      // A. Tentar encontrar o material existente pelo código
      const { data: existingMaterial, error: fetchError } = await serviceRoleClient
        .from('materiais')
        .select('id, quantidade_atual')
        .eq('codigo', item.codigo)
        .single();

      if (fetchError && fetchError.code !== 'PGRST116') {
        throw new Error('Database fetch error: ' + fetchError.message);
      }

      const quantidade_a_adicionar = item.quantidade || 0;
      
      if (existingMaterial) {
        // B. Se existe: Atualizar estoque e registrar movimentação
        const quantidade_anterior = existingMaterial.quantidade_atual;
        const quantidade_nova = quantidade_anterior + quantidade_a_adicionar;

        // Usar a função RPC process_stock_movement para garantir atomicidade
        const { error: rpcError } = await serviceRoleClient.rpc('process_stock_movement', {
          p_material_id: existingMaterial.id,
          p_user_id: callingUser.id, // ID do Admin
          p_tipo: 'entrada', // Ou 'ajuste', dependendo da convenção
          p_quantidade: quantidade_a_adicionar,
          p_quantidade_anterior: quantidade_anterior,
          p_quantidade_nova: quantidade_nova,
          p_observacao: 'Carga de estoque em massa',
          p_status: 'aprovada',
          p_aprovado_por: callingUser.id,
        });

        if (rpcError) {
          throw new Error('RPC error: ' + rpcError.message);
        }
        updatedCount++;

      } else {
        // C. Se não existe: Criar novo material e registrar movimentação inicial
        const newMaterialPayload = {
          codigo: item.codigo,
          nome: item.nome,
          descricao: item.descricao || null,
          categoria: item.categoria || null,
          unidade_medida: item.unidade_medida,
          quantidade_minima: item.quantidade_minima || 0,
          quantidade_atual: quantidade_a_adicionar, // Estoque inicial
          localizacao: item.localizacao || null,
          // foto_url é ignorado na carga em massa
        };

        const { data: newMaterial, error: insertError } = await serviceRoleClient
          .from('materiais')
          .insert(newMaterialPayload)
          .select('id')
          .single();

        if (insertError) {
          throw new Error('Insert error: ' + insertError.message);
        }
        
        // Registrar a movimentação inicial (opcional, mas recomendado para histórico completo)
        await serviceRoleClient.rpc('process_stock_movement', {
          p_material_id: newMaterial.id,
          p_user_id: callingUser.id,
          p_tipo: 'entrada',
          p_quantidade: quantidade_a_adicionar,
          p_quantidade_anterior: 0,
          p_quantidade_nova: quantidade_a_adicionar,
          p_observacao: 'Cadastro inicial via carga em massa',
          p_status: 'aprovada',
          p_aprovado_por: callingUser.id,
        });

        createdCount++;
      }
    } catch (e) {
      console.error(`[bulk-stock-update] Error processing item ${item.codigo}:`, e.message);
      errors.push({ item, message: e.message });
    }
  }

  // 4. Retorno do Resultado
  // ... (Retorno de sucesso com resumo e erros)
});