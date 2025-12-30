import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Content-Type': 'application/json',
};

interface CreateUserPayload {
  email: string;
  password?: string;
  nome: string;
  perfil: 'admin' | 'consulta' | 'retirada';
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  let supabaseClient;
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
      return new Response(JSON.stringify({ error: 'Forbidden: Only administrators can create users.' }), {
        status: 403,
        headers: corsHeaders,
      });
    }

    // 2. Processar Payload
    const body: CreateUserPayload = await req.json();
    const { email, password, nome, perfil } = body;

    if (!email || !nome || !perfil) {
      return new Response(JSON.stringify({ error: 'Dados obrigatórios (email, nome, perfil) ausentes.' }), {
        status: 400,
        headers: corsHeaders,
      });
    }

    // 3. Criar Cliente com Service Role Key
    const serviceRoleClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // 4. Criar o Usuário no Auth
    const { data: newUser, error: authError } = await serviceRoleClient.auth.admin.createUser({
      email: email,
      password: password, // Se a senha for fornecida, cria o usuário. Se não, envia um convite.
      email_confirm: true, // Confirma o email automaticamente
      user_metadata: {
        nome: nome,
      },
    });

    if (authError) {
      console.error('Erro ao criar usuário no Auth:', authError.message);
      return new Response(JSON.stringify({ error: 'Erro ao criar usuário: ' + authError.message }), {
        status: 500,
        headers: corsHeaders,
      });
    }

    // 5. Atualizar o Perfil (para definir o perfil de acesso)
    // O trigger handle_new_user já criou o perfil com o nome. Agora atualizamos o perfil.
    const { data: updatedProfile, error: profileUpdateError } = await serviceRoleClient
      .from('profiles')
      .update({ perfil: perfil, updated_at: new Date().toISOString() })
      .eq('id', newUser.user.id)
      .select()
      .single();

    if (profileUpdateError) {
      console.error('Erro ao atualizar perfil:', profileUpdateError.message);
      // Se falhar, o usuário foi criado, mas o perfil está incorreto.
      return new Response(JSON.stringify({ error: 'Usuário criado, mas erro ao definir perfil: ' + profileUpdateError.message }), {
        status: 500,
        headers: corsHeaders,
      });
    }

    return new Response(JSON.stringify({ success: true, user: updatedProfile }), {
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