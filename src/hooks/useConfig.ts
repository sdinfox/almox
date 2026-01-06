import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { showError, showSuccess } from '@/utils/toast';

const CONFIG_QUERY_KEY = ['config', 'logo_url'];
const LOGO_BUCKET = 'logos';

// --- Fetch Logo URL ---
const fetchLogoUrl = async (): Promise<string | null> => {
  const { data, error } = await supabase
    .from('configuracoes')
    .select('valor')
    .eq('chave', 'logo_url')
    .single();

  if (error && error.code !== 'PGRST116') { // PGRST116 = No rows found
    // Se for um erro diferente de "nenhuma linha encontrada", lançamos o erro
    console.error("Erro ao buscar configuração do logo:", error.message);
    throw new Error(error.message);
  }
  
  const url = data?.valor;

  if (url) {
    // Gera a URL pública assinada para o arquivo
    const { data: publicUrlData } = supabase.storage
      .from(LOGO_BUCKET)
      .getPublicUrl(url);
      
    return publicUrlData.publicUrl;
  }

  return null;
};

export const useLogoUrl = () => {
  return useQuery({
    queryKey: CONFIG_QUERY_KEY,
    queryFn: fetchLogoUrl,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};

// --- Upload and Update Logo ---
const uploadLogo = async (file: File): Promise<string> => {
  const user = await supabase.auth.getUser();
  if (!user.data.user) throw new Error('Usuário não autenticado.');

  const fileExt = file.name.split('.').pop();
  const fileName = `logo-${Date.now()}.${fileExt}`;
  const filePath = fileName;

  // 1. Upload do arquivo
  const { error: uploadError } = await supabase.storage
    .from(LOGO_BUCKET)
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: false,
    });

  if (uploadError) {
    console.error('Upload Error:', uploadError); // LOG DE DEBUG
    throw new Error('Erro ao fazer upload do arquivo: ' + uploadError.message);
  }

  // 2. Atualizar o URL no banco de dados
  const { data: currentConfig, error: fetchError } = await supabase
    .from('configuracoes')
    .select('valor')
    .eq('chave', 'logo_url')
    .single();

  if (fetchError && fetchError.code !== 'PGRST116') {
    throw new Error('Erro ao buscar configuração atual: ' + fetchError.message);
  }

  // 3. Se houver um logo antigo, deletá-lo
  const oldFilePath = currentConfig?.valor;
  if (oldFilePath) {
    // Não precisamos esperar o delete, mas logamos se houver erro
    const { error: removeOldError } = await supabase.storage.from(LOGO_BUCKET).remove([oldFilePath]);
    if (removeOldError) {
      console.warn('Warning: Failed to remove old logo file:', removeOldError.message);
    }
  }

  // 4. Atualizar a tabela de configurações com o novo caminho
  const { error: updateError } = await supabase
    .from('configuracoes')
    .upsert({ chave: 'logo_url', valor: filePath }, { onConflict: 'chave' });

  if (updateError) {
    // Tenta reverter o upload se a atualização do DB falhar
    await supabase.storage.from(LOGO_BUCKET).remove([filePath]);
    throw new Error('Erro ao salvar URL do logo no banco de dados: ' + updateError.message);
  }

  return filePath;
};

export const useUploadLogo = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: uploadLogo,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CONFIG_QUERY_KEY });
      showSuccess('Logo da empresa atualizado com sucesso!');
    },
    onError: (error) => {
      showError('Falha ao atualizar o logo: ' + error.message);
    },
  });
};

// --- Remove Logo ---
const removeLogo = async (): Promise<void> => {
  // 1. Buscar o caminho do arquivo atual
  const { data: currentConfig, error: fetchError } = await supabase
    .from('configuracoes')
    .select('valor')
    .eq('chave', 'logo_url')
    .single();

  if (fetchError && fetchError.code !== 'PGRST116') {
    throw new Error('Erro ao buscar configuração atual: ' + fetchError.message);
  }

  const filePath = currentConfig?.valor;

  // 2. Remover do Storage, se existir
  if (filePath) {
    const { error: removeError } = await supabase.storage
      .from(LOGO_BUCKET)
      .remove([filePath]);

    if (removeError) {
      throw new Error('Erro ao remover arquivo do Storage: ' + removeError.message);
    }
  }

  // 3. Limpar o registro no banco de dados
  const { error: updateError } = await supabase
    .from('configuracoes')
    .update({ valor: null, updated_at: new Date().toISOString() })
    .eq('chave', 'logo_url');

  if (updateError) {
    throw new Error('Erro ao limpar URL do logo no banco de dados: ' + updateError.message);
  }
};

export const useRemoveLogo = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: removeLogo,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CONFIG_QUERY_KEY });
      showSuccess('Logo da empresa removido com sucesso!');
    },
    onError: (error) => {
      showError('Falha ao remover o logo: ' + error.message);
    },
  });
};