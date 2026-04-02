import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Content-Type': 'application/json',
};

interface ResetDatabasePayload {
  adminEmail: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // 1. Autenticação do Admin
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
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
      return new Response(JSON.stringify({ error: 'Unauthorized: Invalid token' }), {
        status: 401,
        headers: corsHeaders,
      });
    }

    // Verificar se o usuário chamador é Admin
    const { data: profile, error: profileError } = await userClient
      .from('profiles')
      .select('perfil, email')
      .eq('id', callingUser.id)
      .single();

    if (profileError || profile?.perfil !== 'admin') {
      return new Response(JSON.stringify({ error: 'Forbidden: Only administrators can reset the database.' }), {
        status: 403,
        headers: corsHeaders,
      });
    }

    // Verificar se é o admin específico
    const body: ResetDatabasePayload = await req.json();
    const { adminEmail } = body;

    if (profile.email !== adminEmail) {
      return new Response(JSON.stringify({ error: 'Forbidden: Only the specified admin can perform this action.' }), {
        status: 403,
        headers: corsHeaders,
      });
    }

    // 2. RESET COMPLETO DO BANCO (ORDEM IMPORTANTE PARA EVITAR CONFLICTS)
    console.log('Iniciando reset completo do banco de dados...');

    // Criar cliente serviceRole para operações administrativas
    const serviceRoleClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // 2.1. Deletar movimentações (primeiro para evitar foreign key conflicts)
    const { error: movError } = await serviceRoleClient
      .from('movimentacoes')
      .delete()
      .neq('user_id', callingUser.id); // Não deletar movimentações do admin

    if (movError) {
      console.error('Erro ao deletar movimentações:', movError.message);
      throw new Error('Erro ao deletar movimentações: ' + movError.message);
    }

    // 2.2. Deletar materiais
    const { error: matError } = await serviceRoleClient
      .from('materiais')
      .delete()
      .neq('created_by', callingUser.id); // Não deletar materiais criados pelo admin

    if (matError) {
      console.error('Erro ao deletar materiais:', matError.message);
      throw new Error('Erro ao deletar materiais: ' + matError.message);
    }

    // 2.3. Deletar usuários (exceto o admin atual)
    const { error: usersError } = await serviceRoleClient
      .from('profiles')
      .delete()
      .neq('id', callingUser.id);

    if (usersError) {
      console.error('Erro ao deletar usuários:', usersError.message);
      throw new Error('Erro ao deletar usuários: ' + usersError.message);
    }

    // 2.4. Resetar sequências (opcional, para IDs começarem do 1 novamente)
    try {
      await serviceRoleClient.rpc('reset_sequences');
    } catch (seqError) {
      console.log('Aviso: Não foi possível resetar sequências (função pode não existir)');
    }

    console.log('Reset completo do banco concluído com sucesso!');

    return new Response(JSON.stringify({ 
      success: true, 
      message: 'Banco de dados resetado com sucesso. Apenas o admin foi mantido.',
      timestamp: new Date().toISOString()
    }), {
      status: 200,
      headers: corsHeaders,
    });

  } catch (error) {
    console.error('Erro geral na Edge Function de Reset:', error);
    return new Response(JSON.stringify({ error: 'Erro interno do servidor: ' + error.message }), {
      status: 500,
      headers: corsHeaders,
    });
  }
});
