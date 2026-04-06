// Componente para mostrar versão do sistema
import { Badge } from '@/components/ui/badge';
import { useVersionInfo, getVersionDisplay } from '@/utils/versionDetector';

export function VersionBadge() {
  const versionInfo = useVersionInfo();
  
  const getVariant = () => {
    switch (versionInfo.mode) {
      case 'local':
        return 'default';
      case 'vercel':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  const getIcon = () => {
    switch (versionInfo.mode) {
      case 'local':
        return '🏢';
      case 'vercel':
        return '🌐';
      default:
        return '❓';
    }
  };

  return (
    <Badge variant={getVariant()} className="text-xs">
      {getIcon()} {getVersionDisplay()}
    </Badge>
  );
}

// Componente para mostrar informações detalhadas
export function VersionInfo() {
  const versionInfo = useVersionInfo();
  
  return (
    <div className="space-y-2 text-sm">
      <div className="flex items-center justify-between">
        <span className="font-medium">Modo:</span>
        <span className="text-muted-foreground">{versionInfo.mode}</span>
      </div>
      <div className="flex items-center justify-between">
        <span className="font-medium">Banco:</span>
        <span className="text-muted-foreground">{versionInfo.database}</span>
      </div>
      <div className="flex items-center justify-between">
        <span className="font-medium">Ambiente:</span>
        <span className="text-muted-foreground">{versionInfo.environment}</span>
      </div>
      <div className="flex items-center justify-between">
        <span className="font-medium">Host:</span>
        <span className="text-muted-foreground">{versionInfo.host}</span>
      </div>
      {versionInfo.project && (
        <div className="flex items-center justify-between">
          <span className="font-medium">Projeto:</span>
          <span className="text-muted-foreground">{versionInfo.project}</span>
        </div>
      )}
    </div>
  );
}
