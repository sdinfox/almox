import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { ShieldAlert, Settings } from 'lucide-react';
import LogoSettings from '@/components/admin/LogoSettings';
import { Separator } from '@/components/ui/separator';

const Configuracoes = () => {
  const { profile } = useAuth();

  if (profile?.perfil !== 'admin') {
    return (
      <Alert variant="destructive">
        <ShieldAlert className="h-4 w-4" />
        <AlertTitle>Acesso Negado</AlertTitle>
        <AlertDescription>
          Você não tem permissão para acessar as configurações do sistema.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center space-x-3">
        <Settings className="h-8 w-8 text-primary" />
        <h1 className="text-3xl font-bold">Configurações do Sistema</h1>
      </div>
      <p className="text-muted-foreground">Gerencie as configurações globais e administrativas do sistema de almoxarifado.</p>
      
      <Separator />

      <div className="grid gap-6 lg:grid-cols-2">
        <LogoSettings />
        {/* Outras configurações futuras podem ser adicionadas aqui */}
      </div>
    </div>
  );
};

export default Configuracoes;