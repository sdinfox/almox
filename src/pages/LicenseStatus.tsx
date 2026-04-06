// Página de Status da Licença
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { useLicense } from '@/license/LicenseManager';
import { useVersionInfo } from '@/utils/versionDetector';
import { 
  Shield, 
  Clock, 
  CheckCircle, 
  AlertTriangle, 
  Crown, 
  Zap, 
  Building,
  Calendar,
  Server,
  Database,
  CreditCard,
  RefreshCw,
  ExternalLink
} from 'lucide-react';

export default function LicenseStatus() {
  const { licenseInfo, isLoading } = useLicense();
  const versionInfo = useVersionInfo();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const getPlanIcon = (plan: string) => {
    switch (plan) {
      case 'basic': return <Shield className="w-5 h-5" />;
      case 'professional': return <Zap className="w-5 h-5" />;
      case 'enterprise': return <Crown className="w-5 h-5" />;
      default: return <Shield className="w-5 h-5" />;
    }
  };

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
    return isValid ? <CheckCircle className="w-5 h-5 text-green-600" /> : <AlertTriangle className="w-5 h-5 text-red-600" />;
  };

  const getStatusColor = (isValid: boolean) => {
    return isValid ? 'text-green-600' : 'text-red-600';
  };

  const formatDaysRemaining = (days: number) => {
    if (days > 30) return `${Math.floor(days / 30)} mês(es)`;
    if (days > 0) return `${days} dias`;
    return 'Expirado';
  };

  return (
    <div className="container mx-auto p-6 space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Status da Licença</h1>
          <p className="text-muted-foreground">Gerencie sua licença AlmoxPro</p>
        </div>
        <Button variant="outline" onClick={() => window.location.reload()}>
          <RefreshCw className="w-4 h-4 mr-2" />
          Atualizar
        </Button>
      </div>

      {/* Status Principal */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            {getStatusIcon(licenseInfo?.isValid || false)}
            Status da Licença
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Plano Atual</p>
              <div className="flex items-center gap-2 mt-1">
                {getPlanIcon(licenseInfo?.plan || 'trial')}
                <Badge className={getPlanColor(licenseInfo?.plan || 'trial')}>
                  {(licenseInfo?.plan || 'trial').toUpperCase()}
                </Badge>
              </div>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Validade</p>
              <p className={`text-lg font-semibold ${getStatusColor(licenseInfo?.isValid || false)}`}>
                {formatDaysRemaining(licenseInfo?.daysRemaining || 0)}
              </p>
            </div>
          </div>
          
          {licenseInfo?.expiry && (
            <div>
              <p className="text-sm text-muted-foreground">Data de Expiração</p>
              <p className="font-medium">
                {new Date(licenseInfo.expiry).toLocaleDateString('pt-BR', {
                  day: '2-digit',
                  month: 'long',
                  year: 'numeric'
                })}
              </p>
            </div>
          )}

          {!licenseInfo?.isValid && (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Sua licença expirou ou é inválida. Ative uma nova licença para continuar usando o sistema.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Informações do Sistema */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Server className="w-5 h-5" />
            Informações do Sistema
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Modo de Execução</p>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant={versionInfo.mode === 'vercel' ? 'secondary' : 'default'}>
                  {versionInfo.mode === 'vercel' ? '🌐 Servidor Nuvem' : '🏢 Servidor Local'}
                </Badge>
              </div>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Banco de Dados</p>
              <div className="flex items-center gap-2 mt-1">
                <Database className="w-4 h-4" />
                <span className="font-medium">
                  {versionInfo.database === 'supabase' ? 'Supabase' : 'PostgreSQL'}
                </span>
              </div>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Ambiente</p>
              <p className="font-medium capitalize">{versionInfo.environment}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Host</p>
              <p className="font-medium">{versionInfo.host}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Detalhes da Licença */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Detalhes da Licença
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm">ID da Máquina</span>
              <code className="text-xs bg-muted px-2 py-1 rounded">
                {licenseInfo?.machineId || 'Não identificado'}
              </code>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm">Chave da Licença</span>
              <code className="text-xs bg-muted px-2 py-1 rounded">
                {licenseInfo?.key || 'Trial'}
              </code>
            </div>
          </div>
          
          <Separator />
          
          <div>
            <p className="text-sm font-medium mb-2">Funcionalidades do Plano</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {getPlanFeatures(licenseInfo?.plan || 'trial').map((feature, index) => (
                <div key={index} className="flex items-center gap-2 text-sm">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  {feature}
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Ações */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="w-5 h-5" />
            Gerenciar Licença
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <Button 
              className="flex-1"
              onClick={() => window.open('/pricing', '_blank')}
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              Ver Planos e Preços
            </Button>
            <Button 
              variant="outline" 
              className="flex-1"
              onClick={() => window.open('mailto:suporte@almoxpro.com', '_blank')}
            >
              Contatar Suporte
            </Button>
          </div>
          
          <div className="text-sm text-muted-foreground">
            <p>Necessita de ajuda? Entre em contato conosco:</p>
            <p>Email: suporte@almoxpro.com</p>
            <p>Documentação: https://docs.almoxpro.com</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function getPlanFeatures(plan: string): string[] {
  const features = {
    trial: ['Usuários: 5', 'Materiais: 100', 'Relatórios básicos', 'Trial 15 dias'],
    basic: ['Usuários: 5', 'Materiais: 1.000', 'Relatórios básicos', 'Suporte por email'],
    professional: ['Usuários: 20', 'Materiais: 5.000', 'Relatórios avançados', 'API completa', 'Suporte prioritário'],
    enterprise: ['Usuários: ilimitados', 'Materiais: ilimitados', 'Multi-filial', 'API personalizada', 'Suporte dedicado', 'SLA garantido']
  };
  
  return features[plan as keyof typeof features] || features.trial;
}
