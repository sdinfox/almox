import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Content-Type': 'application/json',
};

// Tipos de dados esperados
interface MovementPayload {
  material_id: string;
  user_id: string;
  tipo: 'entrada' | 'saida' | 'ajuste';
  quantidade: number;
  observacao?: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  let supabaseClient;
  try {
    // Manual authentication handling
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized: Missing Authorization header' }), {
        status: 401,
        headers: corsHeaders,
      });
    }

    // Create Supabase client with the user's JWT
    supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: authHeader },
        },
      }
    );

    const { data: { user } } = await supabaseClient.auth.getUser();
    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorized: Invalid token' }), {
        status: 401,
        headers: corsHeaders,
      });
    }

    const body: MovementPayload = await req.json();
    const { material_id, tipo, quantidade, observacao } = body;
    const user_id = user.id;

    if (!material_id || !tipo || typeof quantidade !== 'number' || quantidade <= 0) {
      return new Response(JSON.stringify({ error: 'Dados de movimentação inválidos.' }), {
        status: 400,
        headers: corsHeaders,
      });
    }

    // 1. Buscar o material atual para obter a quantidade_anterior
    const { data: material, error: fetchError } = await supabaseClient
      .from('materiais')
      .select('quantidade_atual')
      .eq('id', material_id)
      .single();

    if (fetchError || !material) {
      console.error('Erro ao buscar material:', fetchError?.message);
      return new Response(JSON.stringify({ error: 'Material não encontrado ou erro ao buscar dados.' }), {
        status: 404,
        headers: corsHeaders,
      });
    }

    const quantidade_anterior = material.quantidade_atual;
    let quantidade_nova = quantidade_anterior;
    let status = 'aprovada'; // Movimentações de Entrada/Ajuste feitas pelo Admin são aprovadas automaticamente

    // Calcular a nova quantidade
    if (tipo === 'entrada' || tipo === 'ajuste') {
      quantidade_nova = quantidade_anterior + quantidade;
    } else if (tipo === 'saida') {
      // Saídas feitas pelo Admin (ajuste negativo)
      quantidade_nova = quantidade_anterior - quantidade;
      if (quantidade_nova < 0) {
        return new Response(JSON.stringify({ error: 'Estoque insuficiente para esta movimentação de saída/ajuste.' }), {
          status: 400,
          headers: corsHeaders,
        });
      }
    } else {
      return new Response(JSON.stringify({ error: 'Tipo de movimentação inválido.' }), {
        status: 400,
        headers: corsHeaders,
      });
    }

    // 2. Executar a transação: Inserir Movimentação e Atualizar Material
    const { data: movementData, error: movementError } = await supabaseClient.rpc('process_stock_movement', {
      p_material_id: material_id,
      p_user_id: user_id,
      p_tipo: tipo,
      p_quantidade: quantidade,
      p_quantidade_anterior: quantidade_anterior,
      p_quantidade_nova: quantidade_nova,
      p_observacao: observacao,
      p_status: status,
      p_aprovado_por: user_id,
    });

    if (movementError) {
      console.error('Erro na transação do banco de dados:', movementError.message);
      return new Response(JSON.stringify({ error: 'Erro ao processar a movimentação de estoque.' }), {
        status: 500,
        headers: corsHeaders,
      });
    }

    return new Response(JSON.stringify({ success: true, movement: movementData }), {
      status: 200,
      headers: corsHeaders,
    });

  } catch (error) {
    console.error('Erro geral na Edge Function:', error);
    return new Response(JSON.stringify({ error: 'Erro interno do servidor.' }), {
      status: 500,
      headers: corsHeaders,
    });
  }
});