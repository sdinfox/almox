import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { showSuccess, showError } from '@/utils/toast';

const AuthConfirmation = () => {
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [confirmed, setConfirmed] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const confirmEmail = async () => {
      try {
        // Verificar se há parâmetros de confirmação
        const accessToken = searchParams.get('access_token');
        const refreshToken = searchParams.get('refresh_token');
        
        if (accessToken && refreshToken) {
          // Usuário acabou de confirmar o email
          const { error: confirmError } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });

          if (confirmError) {
            setError('Erro ao confirmar email: ' + confirmError.message);
          } else {
            setConfirmed(true);
            showSuccess('Email confirmado com sucesso!');
            
            // Redirecionar para login após 2 segundos
            setTimeout(() => {
              navigate('/login');
            }, 2000);
          }
        } else {
          // Verificar se usuário já está logado (confirmou anteriormente)
          const { data: { session } } = await supabase.auth.getSession();
          
          if (session) {
            setConfirmed(true);
            showSuccess('Email já foi confirmado anteriormente!');
            
            setTimeout(() => {
              navigate('/login');
            }, 2000);
          } else {
            setError('Link de confirmação inválido ou expirado.');
          }
        }
        
        setLoading(false);
      } catch (err) {
        setError('Erro inesperado: ' + (err as Error).message);
        setLoading(false);
      }
    };

    confirmEmail();
  }, [searchParams, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle>Confirmando Email</CardTitle>
            <CardDescription>Aguarde enquanto confirmamos seu email...</CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center p-6">
            <Loader2 className="h-8 w-8 animate-spin" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <CardTitle className="text-red-600">Erro na Confirmação</CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              O link de confirmação pode ter expirado ou já foi utilizado.
            </p>
            <div className="space-y-2">
              <Button onClick={() => window.location.href = '/signup'} className="w-full">
                Tentar Novo Cadastro
              </Button>
              <Button variant="outline" onClick={() => window.location.href = '/login'} className="w-full">
                Fazer Login
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (confirmed) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
            <CardTitle className="text-green-600">Email Confirmado!</CardTitle>
            <CardDescription>
              Sua conta foi ativada com sucesso.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Você será redirecionado para a página de login em instantes...
            </p>
            <Button onClick={() => navigate('/login')} className="w-full">
              Ir para Login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return null;
};

export default AuthConfirmation;
