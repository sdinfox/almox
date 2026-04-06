// Guarda de licença para proteger o sistema
import { ReactNode, useEffect, useState } from 'react';
import { useLicense, LicenseManager } from '@/license/LicenseManager';
import { LicenseDialog } from './LicenseDialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Shield } from 'lucide-react';

interface LicenseGuardProps {
  children: ReactNode;
}

export function LicenseGuard({ children }: LicenseGuardProps) {
  const { licenseInfo, isLoading } = useLicense();
  const [showLicenseDialog, setShowLicenseDialog] = useState(false);
  const [gracePeriodUsed, setGracePeriodUsed] = useState(false);

  useEffect(() => {
    // Verificar licença a cada carregamento
    if (!isLoading && licenseInfo) {
      if (!licenseInfo.isValid) {
        // Se expirou, mostrar diálogo de licença
        setShowLicenseDialog(true);
      }
    }
  }, [licenseInfo, isLoading]);

  // Permitir acesso durante o carregamento
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center space-y-4">
          <Shield className="w-16 h-16 text-blue-600 mx-auto" />
          <h2 className="text-xl font-semibold">Verificando licença...</h2>
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
        </div>
      </div>
    );
  }

  // Se não há informação de licença, mostrar erro
  if (!licenseInfo) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <Alert className="max-w-md">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Erro ao verificar licença. Por favor, recarregue a página.
          </AlertDescription>
          <Button onClick={() => window.location.reload()} className="mt-4">
            Recarregar
          </Button>
        </Alert>
      </div>
    );
  }

  // Se licença é válida, permitir acesso
  if (licenseInfo.isValid) {
    return (
      <>
        {children}
        <LicenseDialog
          isOpen={showLicenseDialog}
          onClose={() => setShowLicenseDialog(false)}
          onActivate={async (licenseKey: string) => {
            const manager = LicenseManager.getInstance();
            return await manager.activateLicense(licenseKey);
          }}
        />
      </>
    );
  }

  // Se licença expirou, mostrar tela de bloqueio
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="max-w-md w-full mx-4 space-y-6">
        {/* Cabeçalho */}
        <div className="text-center space-y-4">
          <Shield className="w-16 h-16 text-blue-600 mx-auto" />
          <h1 className="text-2xl font-bold text-gray-900">AlmoxPro</h1>
          <p className="text-gray-600">
            Sistema de Gerenciamento de Almoxarifado
          </p>
        </div>

        {/* Mensagem de bloqueio */}
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Sua licença do AlmoxPro expirou. Para continuar usando o sistema, 
            por favor, ative uma nova licença.
          </AlertDescription>
        </Alert>

        {/* Informações da licença */}
        <div className="bg-white p-4 rounded-lg border space-y-2">
          <h3 className="font-semibold">Informações da Licença</h3>
          <div className="text-sm text-gray-600 space-y-1">
            <p><strong>Plano:</strong> {licenseInfo.plan.toUpperCase()}</p>
            <p><strong>Status:</strong> Expirado</p>
            <p><strong>ID da Máquina:</strong> {licenseInfo.machineId}</p>
            {licenseInfo.expiry && (
              <p>
                <strong>Expirou em:</strong> {new Date(licenseInfo.expiry).toLocaleDateString('pt-BR')}
              </p>
            )}
          </div>
        </div>

        {/* Botões de ação */}
        <div className="space-y-3">
          <Button 
            onClick={() => setShowLicenseDialog(true)}
            className="w-full"
            size="lg"
          >
            Ativar Nova Licença
          </Button>
          
          <Button 
            variant="outline" 
            onClick={() => window.open('/pricing', '_blank')}
            className="w-full"
          >
            Ver Planos e Preços
          </Button>
        </div>

        {/* Informações de suporte */}
        <div className="text-center text-sm text-gray-500">
          <p>Precisa de ajuda?</p>
          <p>
            <a href="mailto:suporte@almoxpro.com" className="text-blue-600 hover:underline">
              suporte@almoxpro.com
            </a>
          </p>
        </div>
      </div>

      {/* Diálogo de licença */}
      <LicenseDialog
        isOpen={showLicenseDialog}
        onClose={() => setShowLicenseDialog(false)}
        onActivate={async (licenseKey: string) => {
          const manager = LicenseManager.getInstance();
          const success = await manager.activateLicense(licenseKey);
          if (success) {
            setShowLicenseDialog(false);
            window.location.reload(); // Recarregar para aplicar a licença
          }
          return success;
        }}
      />
    </div>
  );
}
