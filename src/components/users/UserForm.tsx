import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { UserProfile } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2 } from 'lucide-react';

// Esquema base
const baseUserSchema = z.object({
  nome: z.string().min(1, 'O nome é obrigatório.'),
  email: z.string().email('Email inválido.'),
  perfil: z.enum(['admin', 'consulta', 'retirada'], {
    required_error: 'O perfil é obrigatório.',
  }),
});

// Esquema para Criação (senha obrigatória)
const createUserSchema = baseUserSchema.extend({
  password: z.string().min(6, 'A senha deve ter no mínimo 6 caracteres.'),
});

// Esquema para Edição (senha opcional, mas se preenchida, deve ter min 6)
const editUserSchema = baseUserSchema.extend({
  password: z.string().min(6, 'A senha deve ter no mínimo 6 caracteres.').optional().or(z.literal('')),
});

type UserFormValues = z.infer<typeof createUserSchema>;
type EditUserFormValues = z.infer<typeof editUserSchema>;

interface UserFormProps {
  initialData?: UserProfile;
  onSubmit: (data: UserFormValues | EditUserFormValues) => void;
  isPending: boolean;
}

const roleMap: Record<UserProfile['perfil'], string> = {
  admin: 'Administrador',
  consulta: 'Consulta',
  retirada: 'Retirada',
};

const UserForm: React.FC<UserFormProps> = ({ initialData, onSubmit, isPending }) => {
  const isEditing = !!initialData;
  
  const form = useForm<UserFormValues | EditUserFormValues>({
    resolver: zodResolver(isEditing ? editUserSchema : createUserSchema),
    defaultValues: {
      nome: initialData?.nome || '',
      email: initialData?.email || '',
      password: '',
      perfil: initialData?.perfil || 'consulta',
    },
  });

  const handleSubmit = (values: UserFormValues | EditUserFormValues) => {
    // Se estiver editando e a senha estiver vazia, remove do payload para não tentar atualizar
    const payload = {
        ...values,
        password: isEditing && !values.password ? undefined : values.password,
    };
    onSubmit(payload);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="nome"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nome Completo</FormLabel>
              <FormControl>
                <Input placeholder="Nome do Usuário" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input 
                    placeholder="email@empresa.com" 
                    {...field} 
                    disabled={isEditing} // Não permite editar o email
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{isEditing ? 'Nova Senha (Opcional)' : 'Senha'}</FormLabel>
              <FormControl>
                <Input 
                    type="password" 
                    placeholder={isEditing ? 'Deixe em branco para manter a senha atual' : 'Defina uma senha temporária'} 
                    {...field} 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="perfil"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Perfil de Acesso</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o Perfil" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {Object.entries(roleMap).map(([key, label]) => (
                    <SelectItem key={key} value={key}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" disabled={isPending}>
          {isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {isEditing ? 'Salvando...' : 'Criando Usuário...'}
            </>
          ) : (
            isEditing ? 'Salvar Alterações' : 'Criar Usuário'
          )}
        </Button>
      </form>
    </Form>
  );
};

export default UserForm;