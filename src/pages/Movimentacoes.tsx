import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import MovementTable from '@/components/movements/MovementTable';
import { useMaterials } from '@/hooks/useMaterials';
import { useProcessMovement, useMovementsHistory, useCreateUserRequest } from '@/hooks/useMovements';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useAuth } from '@/contexts/AuthContext';
import { ShieldAlert } from 'lucide-react';
import AdminMovementForm from '@/components/movements/AdminMovementForm';

const Movimentacoes = () => {
  const { profile } = useAuth();
  const { data: materials = [], isLoading: isLoadingMaterials } = useMaterials();
  const { data: movements = [], isLoading: isLoadingMovements } = useMovementsHistory();
  
  // Mutations
  const processMovementMutation = useProcessMovement(); // Para Entrada/Ajuste (direto)
  const requestWithdrawalMutation = useCreateUserRequest(); // Para Solicitação de Saída (pendente)

  const [isDialogOpen, setIsDialogOpen] = useState(false);

  if (profile?.perfil !== 'admin' && profile?.perfil !== 'consulta') {
    return (
      <Alert variant="destructive">
        <ShieldAlert className="h-4 w-4" />
        <AlertTitle>Acesso Negado</AlertTitle>
        <AlertDescription>
          Você não tem permissão para acessar esta página.
        </AlertDescription>
      </Alert>
    );
  }

  const handleSubmit = (values: any) => {
    const { tipo, ...payload } = values;

    if (tipo === 'solicitacao_saida') {
      // Cria uma solicitação de retirada (status: pendente)
      requestWithdrawalMutation.mutate(payload, {
        onSuccess: () => {
          setIsDialogOpen(false);
        },
      });
    } else {
      // Processa movimentação direta (entrada ou ajuste)
      // Se for 'ajuste' ou 'entrada', usamos processMovementMutation.
      processMovementMutation.mutate({ ...payload, tipo: tipo === 'ajuste' ? 'ajuste' : 'entrada' }, {
        onSuccess: () => {
          setIsDialogOpen(false);
        },
      });
    }
  };

  // Apenas administradores podem registrar movimentações ou solicitações
  const canRegisterMovement = profile?.perfil === 'admin';
  const isPending = processMovementMutation.isPending || requestWithdrawalMutation.isPending;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Histórico de Movimentações</h1>
        {canRegisterMovement && (
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <PlusCircle className="mr-2 h-4 w-4" />
                Nova Movimentação/Solicitação
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px]">
              <DialogHeader>
                <DialogTitle>Registrar Ação de Estoque</DialogTitle>
              </DialogHeader>
              {isLoadingMaterials ? (
                <div className="text-center p-4">Carregando materiais...</div>
              ) : materials.length === 0 ? (
                <Alert variant="default">
                  <AlertTitle>Nenhum Material</AlertTitle>
                  <AlertDescription>Cadastre materiais antes de registrar movimentações.</AlertDescription>
                </Alert>
              ) : (
                <AdminMovementForm
                  materials={materials}
                  onSubmit={handleSubmit}
                  isPending={isPending}
                />
              )}
            </DialogContent>
          </Dialog>
        )}
      </div>

      <MovementTable 
        movements={movements} 
        isLoading={isLoadingMovements} 
      />
    </div>
  );
};

export default Movimentacoes;