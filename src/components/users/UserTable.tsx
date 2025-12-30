import React from 'react';
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
import { useUpdateProfileRole } from '@/hooks/useProfiles';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2, User } from 'lucide-react';

interface UserTableProps {
  profiles: UserProfile[];
  isLoading: boolean;
  currentUserId: string;
}

const roleMap: Record<UserProfile['perfil'], string> = {
  admin: 'Administrador',
  consulta: 'Consulta',
  retirada: 'Retirada',
};

const UserTable: React.FC<UserTableProps> = ({ profiles, isLoading, currentUserId }) => {
  const updateRoleMutation = useUpdateProfileRole();

  const handleRoleChange = (userId: string, newPerfil: UserProfile['perfil']) => {
    updateRoleMutation.mutate({ id: userId, perfil: newPerfil });
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
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Nome</TableHead>
          <TableHead>Email</TableHead>
          <TableHead className="w-[200px]">Perfil</TableHead>
          <TableHead className="text-right">Status</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {profiles.map((profile) => {
          const isCurrentUser = profile.id === currentUserId;
          const isUpdating = updateRoleMutation.isPending && updateRoleMutation.variables?.id === profile.id;

          return (
            <TableRow key={profile.id}>
              <TableCell className="font-medium">{profile.nome || 'N/A'}</TableCell>
              <TableCell>{profile.email}</TableCell>
              <TableCell>
                <Select
                  value={profile.perfil}
                  onValueChange={(value: UserProfile['perfil']) => handleRoleChange(profile.id, value)}
                  disabled={isCurrentUser || isUpdating}
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
              <TableCell className="text-right">
                {isUpdating ? (
                  <Loader2 className="h-4 w-4 animate-spin text-primary inline-block" />
                ) : isCurrentUser ? (
                  <Badge variant="secondary">Você</Badge>
                ) : (
                  <Badge variant="outline">{roleMap[profile.perfil]}</Badge>
                )}
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
};

export default UserTable;