import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Movimentacao, MovimentacaoTipo } from '@/types';
import { showError, showSuccess } from '@/utils/toast';

const MOVEMENTS_QUERY_KEY = ['movements'];
const MATERIALS_QUERY_KEY = ['materials'];

interface ProcessMovementPayload {
  material_id: string;
  tipo: MovimentacaoTipo;
  quantidade: number;
  observacao?: string;
}

// URL da Edge Function (usando o Project ID fornecido)
const EDGE_FUNCTION_URL = 'https://xleljhiyuhtvzjlxzawy.supabase.co/functions/v1/process-movement';

const processMovement = async (payload: ProcessMovementPayload): Promise<Movimentacao> => {
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session) {
    throw new Error('Usuário não autenticado.');
  }

  const response = await fetch(EDGE_FUNCTION_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${session.access_token}`,
    },
    body: JSON.stringify({
      ...payload,
      user_id: session.user.id, // Adiciona user_id no payload para a Edge Function
    }),
  });

  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.error || 'Erro desconhecido ao processar movimentação.');
  }

  return result.movement[0] as Movimentacao;
};

export const useProcessMovement = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: processMovement,
    onSuccess: () => {
      // Invalida queries de Movimentações e Materiais para atualizar a UI
      queryClient.invalidateQueries({ queryKey: MOVEMENTS_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: MATERIALS_QUERY_KEY });
      showSuccess('Movimentação de estoque registrada e material atualizado com sucesso!');
    },
    onError: (error) => {
      showError('Erro ao registrar movimentação: ' + error.message);
    },
  });
};