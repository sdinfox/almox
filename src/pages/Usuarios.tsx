import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useProfiles } from '@/hooks/useProfiles';
import UserTable from '@/components/users/UserTable';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { ShieldAlert } from 'lucide-react';

const Usuarios = () => {
  const { user, profile } = useAuth();
  const { data: profiles = [], isLoading, error } = useProfiles();

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

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Gerenciamento de Usuários</h1>
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
      />
    </div>
  );
};

export default Usuarios;