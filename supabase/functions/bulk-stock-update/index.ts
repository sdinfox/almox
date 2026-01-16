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

  try {
    // 1. Autenticação e Verificação de Admin
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      console.error("[bulk-stock-update] Unauthorized: Missing Authorization header");
      return new Response(JSON.stringify({ error: 'Unauthorized: Missing Authorization header' }), {
        status: 401,
        headers: corsHeaders,
      });
    }

    // Criar cliente Supabase com o JWT do usuário chamador
    const userClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: authHeader },
        },
      }
    );

    const { data: { user: callingUser } } = await userClient.auth.getUser();
    if (!callingUser) {
      console.error("[bulk-stock-update] Unauthorized: Invalid token");
      return new Response(JSON.stringify({ error: 'Unauthorized: Invalid token' }), {
        status: 401,
        headers: corsHeaders,
      });
    }

    // Verificar se o usuário chamador é Admin (requer consulta ao perfil)
    const { data: profile, error: profileError } = await userClient
      .from('profiles')
      .select('perfil')
      .eq('id', callingUser.id)
      .single();

    if (profileError || profile?.perfil !== 'admin') {
      console.error("[bulk-stock-update] Forbidden: Only administrators can perform bulk updates.");
      return new Response(JSON.stringify({ error: 'Forbidden: Only administrators can perform bulk updates.' }), {
        status: 403,
        headers: corsHeaders,
      });
    }

    // 2. Processar Payload
    const body: { items: BulkItem[] } = await req.json();
    const { items } = body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      console.error("[bulk-stock-update] Payload inválido ou vazio.");
      return new Response(JSON.stringify({ error: 'Payload inválido ou vazio.' }), {
        status: 400,
        headers: corsHeaders,
      });
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
        // Validação básica dos campos obrigatórios
        if (!item.codigo || !item.nome || !item.unidade_medida || typeof item.quantidade !== 'number' || item.quantidade <= 0) {
            throw new Error('Dados obrigatórios ausentes ou quantidade inválida.');
        }

        // A. Tentar encontrar o material existente pelo código
        const { data: existingMaterial, error: fetchError } = await serviceRoleClient
          .from('materiais')
          .select('id, quantidade_atual')
          .eq('codigo', item.codigo)
          .single();

        if (fetchError && fetchError.code !== 'PGRST116') {
          throw new Error('Database fetch error: ' + fetchError.message);
        }

        const quantidade_a_adicionar = item.quantidade;
        
        if (existingMaterial) {
          // B. Se existe: Atualizar estoque e registrar movimentação
          const quantidade_anterior = existingMaterial.quantidade_atual;
          const quantidade_nova = quantidade_anterior + quantidade_a_adicionar;

          // Usar a função RPC process_stock_movement para garantir atomicidade
          const { error: rpcError } = await serviceRoleClient.rpc('process_stock_movement', {
            p_material_id: existingMaterial.id,
            p_user_id: callingUser.id, // ID do Admin
            p_tipo: 'entrada', 
            p_quantidade: quantidade_a_adicionar,
            p_quantidade_anterior: quantidade_anterior,
            p_quantidade_nova: quantidade_nova,
            p_observacao: 'Carga de estoque em massa (Atualização)',
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
          };

          const { data: newMaterial, error: insertError } = await serviceRoleClient
            .from('materiais')
            .insert(newMaterialPayload)
            .select('id')
            .single();

          if (insertError) {
            throw new Error('Insert error: ' + insertError.message);
          }
          
          // Registrar a movimentação inicial
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
    return new Response(JSON.stringify({ 
      success: true, 
      createdCount, 
      updatedCount, 
      errors 
    }), {
      status: 200,
      headers: corsHeaders,
    });

  } catch (error) {
    console.error('[bulk-stock-update] Erro geral na Edge Function:', error);
    return new Response(JSON.stringify({ error: 'Erro interno do servidor.' }), {
      status: 500,
      headers: corsHeaders,
    });
  }
});