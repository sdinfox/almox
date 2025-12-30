import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { UserProfile } from '@/types';
import { showError, showSuccess } from '@/utils/toast';

const PROFILES_QUERY_KEY = ['profiles'];
const CREATE_USER_FUNCTION_URL = 'https://xleljhiyuhtvzjlxzawy.supabase.co/functions/v1/create-user';

// --- Fetch All Profiles ---
const fetchProfiles = async (): Promise<UserProfile[]> => {
  // Nota: Esta query depende da política RLS 'profiles_select_all' permitir que admins leiam todos os perfis.
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .order('nome', { ascending: true });

  if (error) {
    throw new Error(error.message);
  }
  return data as UserProfile[];
};

export const useProfiles = () => {
  return useQuery({
    queryKey: PROFILES_QUERY_KEY,
    queryFn: fetchProfiles,
  });
};

// --- Update Profile Role ---
type UpdateProfilePayload = {
  id: string;
  perfil: UserProfile['perfil'];
};

const updateProfileRole = async ({ id, perfil }: UpdateProfilePayload): Promise<UserProfile> => {
  const { data, error } = await supabase
    .from('profiles')
    .update({ perfil, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }
  return data as UserProfile;
};

export const useUpdateProfileRole = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateProfileRole,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PROFILES_QUERY_KEY });
      showSuccess('Perfil de usuário atualizado com sucesso!');
    },
    onError: (error) => {
      showError('Erro ao atualizar perfil: ' + error.message);
    },
  });
};

// --- Create New User (Admin only) ---
interface CreateUserPayload {
  email: string;
  password?: string;
  nome: string;
  perfil: UserProfile['perfil'];
}

const createUser = async (payload: CreateUserPayload): Promise<UserProfile> => {
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session) {
    throw new Error('Usuário não autenticado.');
  }

  const response = await fetch(CREATE_USER_FUNCTION_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${session.access_token}`,
    },
    body: JSON.stringify(payload),
  });

  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.error || 'Erro desconhecido ao criar usuário.');
  }

  return result.user as UserProfile;
};

export const useCreateUser = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PROFILES_QUERY_KEY });
      showSuccess('Novo usuário criado com sucesso!');
    },
    onError: (error) => {
      showError('Erro ao criar usuário: ' + error.message);
    },
  });
};