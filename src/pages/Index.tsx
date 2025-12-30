import { MadeWithDyad } from "@/components/made-with-dyad";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { LogOut } from "lucide-react";
import { showError } from "@/utils/toast";

const Index = () => {
  const { profile, isLoading } = useAuth();

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      showError("Erro ao fazer logout: " + error.message);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        Carregando dados do usuário...
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 dark:bg-gray-900 p-4">
      <div className="text-center bg-white dark:bg-gray-800 p-8 rounded-lg shadow-xl max-w-lg w-full">
        <h1 className="text-3xl font-bold mb-4 text-gray-900 dark:text-white">
          Bem-vindo, {profile?.nome || profile?.email}!
        </h1>
        <p className="text-xl text-gray-600 dark:text-gray-400 mb-6">
          Seu perfil de acesso é:{" "}
          <span className="font-semibold capitalize text-primary">
            {profile?.perfil}
          </span>
        </p>
        <p className="text-md text-gray-500 dark:text-gray-500 mb-8">
          A estrutura do banco de dados e a autenticação foram configuradas.
          Próximo passo: Layout e Dashboard.
        </p>
        <Button onClick={handleLogout} variant="destructive" className="w-full">
          <LogOut className="mr-2 h-4 w-4" /> Sair
        </Button>
      </div>
      <MadeWithDyad />
    </div>
  );
};

export default Index;