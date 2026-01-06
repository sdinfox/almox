import React, { useState } from 'react';
import { UserProfile } from '@/types';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useUpdateProfileRole, useDeleteUser } from '@/hooks/useProfiles';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2, User, Edit, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface UserTableProps {
  profiles: UserProfile[];
  isLoading: boolean;
  currentUserId: string;
  onEdit: (profile: UserProfile) => void;
}

const roleMap: Record<UserProfile['perfil'], string> = {
  admin: 'Administrador',
  consulta: 'Consulta',
  retirada: 'Retirada',
};

const UserTable: React.FC<UserTableProps> = ({ profiles, isLoading, currentUserId, onEdit }) => {
  const updateRoleMutation = useUpdateProfileRole();
  const deleteUserMutation = useDeleteUser();
  const [userToDelete, setUserToDelete] = useState<UserProfile | null>(null);

  const handleRoleChange = (userId: string, newPerfil: UserProfile['perfil']) => {
    updateRoleMutation.mutate({ id: userId, perfil: newPerfil });
  };

  const handleDelete = (userId: string) => {
    deleteUserMutation.mutate(userId);
    setUserToDelete(null);
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(5)].map((_, i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    );
  }

  if (profiles.length === 0) {
    return (
      <div className="text-center p-10 border rounded-lg bg-muted/50">
        <User className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
        <h3 className="text-xl font-semibold">Nenhum Usuário Encontrado</h3>
        <p className="text-muted-foreground">Verifique se o RLS está configurado corretamente para permitir a leitura de todos os perfis pelo Admin.</p>
      </div>
    );
  }

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nome</TableHead>
            <TableHead>Email</TableHead>
            <TableHead className="w-[200px]">Perfil</TableHead>
            <TableHead className="text-right w-[150px]">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {profiles.map((profile) => {
            const isCurrentUser = profile.id === currentUserId;
            const isUpdating = updateRoleMutation.isPending && updateRoleMutation.variables?.id === profile.id;
            const isDeleting = deleteUserMutation.isPending && deleteUserMutation.variables === profile.id;

            return (
              <TableRow key={profile.id}>
                <TableCell className="font-medium">{profile.nome || 'N/A'}</TableCell>
                <TableCell>{profile.email}</TableCell>
                <TableCell>
                  <Select
                    value={profile.perfil}
                    onValueChange={(value: UserProfile['perfil']) => handleRoleChange(profile.id, value)}
                    disabled={isCurrentUser || isUpdating || isDeleting}
                  >
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Selecione o Perfil" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(roleMap).map(([key, label]) => (
                        <SelectItem key={key} value={key}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </TableCell>
                <TableCell className="text-right space-x-2">
                  {isCurrentUser ? (
                    <Badge variant="secondary">Você</Badge>
                  ) : (
                    <>
                      <Button 
                        variant="outline" 
                        size="icon" 
                        onClick={() => onEdit(profile)}
                        disabled={isUpdating || isDeleting}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="destructive" 
                        size="icon" 
                        onClick={() => setUserToDelete(profile)}
                        disabled={isUpdating || isDeleting}
                      >
                        {isDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                      </Button>
                    </>
                  )}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>

      {/* Modal de Confirmação de Exclusão */}
      <AlertDialog open={!!userToDelete} onOpenChange={() => setUserToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Tem certeza que deseja excluir este usuário?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação é irreversível. O usuário 
              <span className="font-semibold ml-1">{userToDelete?.nome || userToDelete?.email}</span> 
              será permanentemente removido do sistema.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteUserMutation.isPending}>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => handleDelete(userToDelete!.id)}
              disabled={deleteUserMutation.isPending}
              className="bg-destructive hover:bg-destructive/90"
            >
              {deleteUserMutation.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                'Excluir Usuário'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default UserTable;