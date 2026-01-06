import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Content-Type': 'application/json',
};

interface DeleteUserPayload {
  userId: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // 1. Autenticação do Admin (Verificar se quem chama é um Admin)
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

    // Verificar se o usuário chamador é Admin (requer consulta ao perfil)
    const { data: profile, error: profileError } = await userClient
      .from('profiles')
      .select('perfil')
      .eq('id', callingUser.id)
      .single();

    if (profileError || profile?.perfil !== 'admin') {
      return new Response(JSON.stringify({ error: 'Forbidden: Only administrators can delete users.' }), {
        status: 403,
        headers: corsHeaders,
      });
    }

    // 2. Processar Payload
    const body: DeleteUserPayload = await req.json();
    const { userId } = body;

    if (!userId) {
      return new Response(JSON.stringify({ error: 'ID do usuário é obrigatório.' }), {
        status: 400,
        headers: corsHeaders,
      });
    }
    
    if (userId === callingUser.id) {
        return new Response(JSON.stringify({ error: 'Não é possível excluir seu próprio usuário.' }), {
            status: 403,
            headers: corsHeaders,
        });
    }

    // 3. Criar Cliente com Service Role Key
    const serviceRoleClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // 4. Excluir o Usuário no Auth
    // A exclusão no auth.users acionará o CASCADE DELETE no public.profiles
    const { error: authError } = await serviceRoleClient.auth.admin.deleteUser(userId);

    if (authError) {
      console.error('Erro ao excluir usuário no Auth:', authError.message);
      return new Response(JSON.stringify({ error: 'Erro ao excluir usuário: ' + authError.message }), {
        status: 500,
        headers: corsHeaders,
      });
    }

    return new Response(JSON.stringify({ success: true }), {
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