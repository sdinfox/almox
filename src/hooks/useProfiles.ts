import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { UserProfile } from '@/types';
import { showError, showSuccess } from '@/utils/toast';

const PROFILES_QUERY_KEY = ['profiles'];

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