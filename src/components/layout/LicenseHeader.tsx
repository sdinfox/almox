// Componente Header com Status da Licença
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useLicense } from '@/license/LicenseManager';
import { useVersionInfo } from '@/utils/versionDetector';
import { Shield, AlertTriangle, CheckCircle, ExternalLink } from 'lucide-react';

export default function LicenseHeader() {
  const { licenseInfo, isLoading } = useLicense();
  const versionInfo = useVersionInfo();

  if (isLoading || !licenseInfo) {
    return null;
  }

  const getPlanColor = (plan: string) => {
    switch (plan) {
      case 'basic': return 'bg-blue-100 text-blue-800';
      case 'professional': return 'bg-purple-100 text-purple-800';
      case 'enterprise': return 'bg-orange-100 text-orange-800';
      case 'trial': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (isValid: boolean) => {
    return isValid ? <CheckCircle className="w-4 h-4 text-green-600" /> : <AlertTriangle className="w-4 h-4 text-red-600" />;
  };

  const formatDaysRemaining = (days: number) => {
    if (days > 30) return `${Math.floor(days / 30)}m`;
    if (days > 0) return `${days}d`;
    return 'Expirou';
  };

  return (
    <div className="flex items-center gap-3 p-2 bg-muted/50 rounded-lg">
      {/* Status da Licença */}
      <div className="flex items-center gap-2">
        {getStatusIcon(licenseInfo.isValid)}
        <Badge className={getPlanColor(licenseInfo.plan)}>
          {licenseInfo.plan.toUpperCase()}
        </Badge>
        <span className="text-sm font-medium">
          {formatDaysRemaining(licenseInfo.daysRemaining)}
        </span>
      </div>

      {/* Versão do Sistema */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <span>
          {versionInfo.mode === 'vercel' ? '🌐 Nuvem' : '🏢 Local'}
        </span>
        <span>•</span>
        <span>
          {versionInfo.database === 'supabase' ? 'Supabase' : 'PostgreSQL'}
        </span>
      </div>

      {/* Ações */}
      <Button 
        variant="ghost" 
        size="sm"
        onClick={() => window.open('/license-status', '_blank')}
        className="ml-auto"
      >
        <Shield className="w-4 h-4 mr-2" />
        Detalhes
      </Button>
    </div>
  );
}
