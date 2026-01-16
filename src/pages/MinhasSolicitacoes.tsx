import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { PlusCircle, ListChecks, AlertTriangle, Check, Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useAuth } from '@/contexts/AuthContext';
import { useMaterials } from '@/hooks/useMaterials';
import { useCreateUserRequest, useMyPendingRequests, useAddSignatureToMovement } from '@/hooks/useMovements';
import UserMovementForm from '@/components/movements/UserMovementForm';
import MovementTable from '@/components/movements/MovementTable';
import SignaturePad, { SignaturePadRef } from '@/components/common/SignaturePad';
import { MovementWithDetails } from '@/types';
import { showError, showSuccess } from '@/utils/toast';

const MinhasSolicitacoes = () => {
  const { profile } = useAuth();
  const { data: materials = [], isLoading: isLoadingMaterials } = useMaterials();
  const { data: allMyRequests = [], isLoading: isLoadingRequests, refetch } = useMyPendingRequests(); 
  const createUserRequestMutation = useCreateUserRequest();
  const addSignatureMutation = useAddSignatureToMovement();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSignatureDialogOpen, setIsSignatureDialogOpen] = useState(false);
  const [movementToSign, setMovementToSign] = useState<MovementWithDetails | null>(null);
  const signaturePadRef = React.useRef<SignaturePadRef>(null);

  if (profile?.perfil !== 'retirada') {
    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Acesso Negado</AlertTitle>
        <AlertDescription>
          Você não tem permissão para acessar esta página.
        </AlertDescription>
      </Alert>
    );
  }

  const handleSubmit = (values: any) => {
    createUserRequestMutation.mutate(values, {
      onSuccess: () => {
        setIsDialogOpen(false);
      },
    });
  };

  const handleOpenSignatureDialog = (movement: MovementWithDetails) => {
    setMovementToSign(movement);
    setIsSignatureDialogOpen(true);
  };

  const handleSign = async () => {
    if (!movementToSign || !signaturePadRef.current) return;

    if (signaturePadRef.current.isEmpty()) {
      showError('Por favor, forneça sua assinatura digital.');
      return;
    }

    const signatureDataUrl = signaturePadRef.current.toDataURL();

    addSignatureMutation.mutate({
      movementId: movementToSign.id,
      signature: signatureDataUrl,
    }, {
      onSuccess: () => {
        setIsSignatureDialogOpen(false);
        setMovementToSign(null);
        signaturePadRef.current?.clear();
        // Refetch para atualizar o status da movimentação na tabela
        refetch(); 
      },
    });
  };

  // Filtra as solicitações: Pendentes e Aprovadas (que precisam de assinatura)
  const pendingRequests = allMyRequests.filter(r => r.status === 'pendente');
  const approvedWithdrawals = allMyRequests.filter(r => r.status === 'aprovada' && r.tipo === 'saida' && !r.assinatura_retirada);
  const completedMovements = allMyRequests.filter(r => r.status !== 'pendente' && (r.tipo !== 'saida' || r.assinatura_retirada));


  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Minhas Solicitações de Movimentação</h1>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <PlusCircle className="mr-2 h-4 w-4" />
              Nova Solicitação
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Solicitar Movimentação de Material</DialogTitle>
            </DialogHeader>
            {isLoadingMaterials ? (
              <div className="text-center p-4">Carregando materiais...</div>
            ) : materials.length === 0 ? (
              <Alert variant="default">
                <AlertTitle>Nenhum Material</AlertTitle>
                <AlertDescription>Nenhum material disponível para movimentação.</AlertDescription>
              </Alert>
            ) : (
              <UserMovementForm
                materials={materials}
                onSubmit={handleSubmit}
                isPending={createUserRequestMutation.isPending}
              />
            )}
          </DialogContent>
        </Dialog>
      </div>

      {/* Seção de Retiradas Aprovadas Aguardando Assinatura */}
      {approvedWithdrawals.length > 0 && (
        <Card className="border-l-4 border-green-500 bg-green-50 dark:bg-green-900/10">
          <CardHeader>
            <CardTitle className="text-xl font-semibold flex items-center text-green-700 dark:text-green-300">
              <Check className="h-5 w-5 mr-2" />
              Retiradas Aprovadas ({approvedWithdrawals.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Suas solicitações abaixo foram aprovadas. Por favor, assine para confirmar a retirada do material.
            </p>
            <MovementTable 
              movements={approvedWithdrawals} 
              isLoading={isLoadingRequests} 
            />
            <div className="mt-4 space-y-2">
              {approvedWithdrawals.map(movement => (
                <div key={movement.id} className="flex justify-between items-center p-3 border rounded-md bg-white dark:bg-gray-800">
                  <span className="font-medium text-sm">{movement.material.nome} ({movement.quantidade} {movement.material.unidade_medida})</span>
                  <Button 
                    size="sm" 
                    onClick={() => handleOpenSignatureDialog(movement)}
                  >
                    Assinar e Retirar
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Seção de Solicitações Pendentes */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-xl font-semibold">
            Solicitações Pendentes ({pendingRequests.length})
          </CardTitle>
          <ListChecks className="h-6 w-6 text-primary" />
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            Acompanhe o status das suas solicitações de entrada e retirada que aguardam aprovação.
          </p>
          <MovementTable 
            movements={pendingRequests} 
            isLoading={isLoadingRequests} 
          />
        </CardContent>
      </Card>
      
      {/* Seção de Movimentações Concluídas/Rejeitadas */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl font-semibold">
            Histórico Recente
          </CardTitle>
        </CardHeader>
        <CardContent>
          <MovementTable 
            movements={completedMovements.slice(0, 10)} 
            isLoading={isLoadingRequests} 
          />
        </CardContent>
      </Card>

      {/* Modal de Assinatura */}
      <Dialog open={isSignatureDialogOpen} onOpenChange={setIsSignatureDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Confirmar Retirada e Assinar</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Alert variant="default">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Atenção</AlertTitle>
              <AlertDescription>
                Ao assinar, você confirma a retirada de 
                <span className="font-semibold ml-1">{movementToSign?.quantidade} {movementToSign?.material.unidade_medida} de {movementToSign?.material.nome}</span>.
                Esta ação é irreversível.
              </AlertDescription>
            </Alert>
            <SignaturePad ref={signaturePadRef} />
            <Button 
              onClick={handleSign} 
              disabled={addSignatureMutation.isPending}
              className="w-full"
            >
              {addSignatureMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Registrando...
                </>
              ) : (
                'Confirmar Assinatura e Retirada'
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default MinhasSolicitacoes;