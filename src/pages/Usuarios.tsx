import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useProfiles, useCreateUser, useUpdateFullProfile } from '@/hooks/useProfiles';
import UserTable from '@/components/users/UserTable';
import UserForm from '@/components/users/UserForm';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { ShieldAlert, UserPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { UserProfile } from '@/types';

const Usuarios = () => {
  const { user, profile } = useAuth();
  const { data: profiles = [], isLoading, error } = useProfiles();
  const createUserMutation = useCreateUser();
  const updateProfileMutation = useUpdateFullProfile();
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserProfile | undefined>(undefined);

  if (profile?.perfil !== 'admin') {
    return (
      <Alert variant="destructive">
        <ShieldAlert className="h-4 w-4" />
        <AlertTitle>Acesso Negado</AlertTitle>
        <AlertDescription>
          Você não tem permissão para acessar a gestão de usuários.
        </AlertDescription>
      </Alert>
    );
  }

  const handleOpenDialog = (userToEdit?: UserProfile) => {
    setEditingUser(userToEdit);
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingUser(undefined);
  };

  const handleSubmit = (values: any) => {
    if (editingUser) {
      // Edição
      updateProfileMutation.mutate({ ...values, id: editingUser.id }, {
        onSuccess: handleCloseDialog,
      });
    } else {
      // Criação
      createUserMutation.mutate(values, {
        onSuccess: handleCloseDialog,
      });
    }
  };

  const isPending = createUserMutation.isPending || updateProfileMutation.isPending;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Gerenciamento de Usuários</h1>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => handleOpenDialog()}>
              <UserPlus className="mr-2 h-4 w-4" />
              Novo Usuário
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[450px]">
            <DialogHeader>
              <DialogTitle>{editingUser ? 'Editar Usuário' : 'Criar Novo Usuário'}</DialogTitle>
            </DialogHeader>
            <UserForm 
              initialData={editingUser}
              onSubmit={handleSubmit} 
              isPending={isPending} 
            />
          </DialogContent>
        </Dialog>
      </div>
      
      <p className="text-muted-foreground">Visualize e gerencie os perfis de acesso dos usuários do sistema.</p>
      
      {error && (
        <Alert variant="destructive">
          <AlertTitle>Erro ao carregar usuários</AlertTitle>
          <AlertDescription>{error.message}</AlertDescription>
        </Alert>
      )}

      <UserTable 
        profiles={profiles} 
        isLoading={isLoading} 
        currentUserId={user?.id || ''}
        onEdit={handleOpenDialog}
      />
    </div>
  );
};

export default Usuarios;