import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import { supabase } from '@/integrations/supabase/client';
import { Navigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import Footer from '@/components/layout/Footer';

const Login = () => {
  const { session, isLoading } = useAuth();

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center">Carregando...</div>;
  }

  if (session) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-900">
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md p-8 space-y-6 bg-white dark:bg-gray-800 shadow-lg rounded-lg">
          <h2 className="text-2xl font-bold text-center text-gray-900 dark:text-white">
            Controle de Almoxarifado
          </h2>
          <Auth
            supabaseClient={supabase}
            providers={[]}
            appearance={{
              theme: ThemeSupa,
              variables: {
                default: {
                  colors: {
                    brand: 'hsl(var(--primary))',
                    brandAccent: 'hsl(var(--primary-foreground))',
                  },
                },
              },
            }}
            theme="light"
            view="sign_in"
            showLinks={false} // Esconde os links padrão para usarmos os nossos customizados
            redirectTo={window.location.origin}
            localization={{
              variables: {
                sign_in: {
                  email_label: 'Email',
                  password_label: 'Senha',
                  button_label: 'Entrar',
                }
              },
            }}
          />
          
          <div className="flex flex-col items-center space-y-4 text-sm border-t pt-4">
            <Link
              to="/signup"
              className="text-primary hover:underline font-semibold"
            >
              Não tem uma conta? Cadastre-se
            </Link>
            <Link
              to="/login" // Placeholder ou rota de recuperação se existir
              className="text-muted-foreground hover:underline"
              onClick={(e) => {
                e.preventDefault();
                showSuccess("Funcionalidade de recuperação de senha em breve.");
              }}
            >
              Esqueceu sua senha?
            </Link>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default Login;