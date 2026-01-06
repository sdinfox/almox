import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { User, Mail, KeyRound, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { supabase } from '@/integrations/supabase/client';
import { showError, showSuccess } from '@/utils/toast';

// Esquema de validação para alteração de senha
const passwordSchema = z.object({
  password: z.string().min(6, 'A nova senha deve ter no mínimo 6 caracteres.'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'As senhas não coincidem.',
  path: ['confirmPassword'],
});

type PasswordFormValues = z.infer<typeof passwordSchema>;

const Profile = () => {
  const { user, profile, isLoading } = useAuth();
  const [isPasswordUpdating, setIsPasswordUpdating] = useState(false);

  const passwordForm = useForm<PasswordFormValues>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      password: '',
      confirmPassword: '',
    },
  });

  const handlePasswordUpdate = async (values: PasswordFormValues) => {
    if (!user) return;
    setIsPasswordUpdating(true);
    
    const { error } = await supabase.auth.updateUser({ password: values.password });

    if (error) {
      showError('Erro ao atualizar senha: ' + error.message);
    } else {
      showSuccess('Senha atualizada com sucesso! Você precisará fazer login novamente.');
      // Força o logout para que o usuário use a nova senha
      await supabase.auth.signOut();
    }
    
    setIsPasswordUpdating(false);
    passwordForm.reset();
  };

  if (isLoading) {
    return <div>Carregando perfil...</div>;
  }

  if (!user || !profile) {
    return <div>Erro: Usuário não encontrado.</div>;
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center space-x-3">
        <User className="h-8 w-8 text-primary" />
        <h1 className="text-3xl font-bold">Meu Perfil</h1>
      </div>
      <p className="text-muted-foreground">Gerencie suas informações de conta e segurança.</p>
      
      <Separator />

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Card de Informações Básicas */}
        <Card>
          <CardHeader>
            <CardTitle>Informações da Conta</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center space-x-3">
              <User className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Nome</p>
                <p className="text-lg font-semibold">{profile.nome || 'N/A'}</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Mail className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Email</p>
                <p className="text-lg font-semibold">{profile.email}</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <KeyRound className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Perfil de Acesso</p>
                <p className="text-lg font-semibold capitalize">{profile.perfil}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Card de Alteração de Senha */}
        <Card>
          <CardHeader>
            <CardTitle>Alterar Senha</CardTitle>
          </CardHeader>
          <CardContent>
            <Form {...passwordForm}>
              <form onSubmit={passwordForm.handleSubmit(handlePasswordUpdate)} className="space-y-4">
                <FormField
                  control={passwordForm.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nova Senha</FormLabel>
                      <FormControl>
                        <Input type="password" placeholder="Mínimo 6 caracteres" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={passwordForm.control}
                  name="confirmPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Confirmar Nova Senha</FormLabel>
                      <FormControl>
                        <Input type="password" placeholder="Repita a nova senha" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" disabled={isPasswordUpdating}>
                  {isPasswordUpdating ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Atualizando...
                    </>
                  ) : (
                    'Atualizar Senha'
                  )}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Profile;