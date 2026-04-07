// Componente de diálogo de licença
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useLicenseManager } from '@/license/LicenseManager';
import { Shield, Zap, Crown, CheckCircle, AlertTriangle, Clock } from 'lucide-react';

interface LicenseDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onActivate: (licenseKey: string) => Promise<boolean>;
}

export function LicenseDialog({ isOpen, onClose, onActivate }: LicenseDialogProps) {
  const { licenseInfo, isLoading } = useLicense();
  const [licenseKey, setLicenseKey] = useState('');
  const [isActivating, setIsActivating] = useState(false);
  const [activationError, setActivationError] = useState('');

  const handleActivate = async () => {
    if (!licenseKey.trim()) {
      setActivationError('Por favor, digite uma chave de licença válida');
      return;
    }

    setIsActivating(true);
    setActivationError('');

    try {
      const success = await onActivate(licenseKey.trim());
      if (success) {
        onClose();
        setLicenseKey('');
      } else {
        setActivationError('Chave de licença inválida ou já utilizada');
      }
    } catch (error) {
      setActivationError('Erro ao ativar licença. Tente novamente.');
    } finally {
      setIsActivating(false);
    }
  };

  const getPlanIcon = (plan: string) => {
    switch (plan) {
      case 'basic': return React.createElement(Shield, { className: "w-5 h-5" });
      case 'professional': return React.createElement(Zap, { className: "w-5 h-5" });
      case 'enterprise': return React.createElement(Crown, { className: "w-5 h-5" });
      default: return React.createElement(Shield, { className: "w-5 h-5" });
    }
  };

  const getPlanColor = (plan: string) => {
    switch (plan) {
      case 'basic': return 'bg-blue-100 text-blue-800';
      case 'professional': return 'bg-purple-100 text-purple-800';
      case 'enterprise': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const plans = [
    {
      name: 'Basic',
      price: 'R$ 157/mês',
      icon: <Shield className="w-6 h-6" />,
      features: [
        'Até 5 usuários',
        React.createElement(Shield, { className: "w-6 h-6" }),
        '1000 materiais',
        'Relatórios básicos',
        'Suporte por email'
      ],
      color: 'border-blue-200 bg-blue-50'
    },
    {
      name: 'Professional',
      price: 'R$ 319/mês',
      icon: <Zap className="w-6 h-6" />,
      features: [
        'Até 20 usuários',
        '5000 materiais',
        'Relatórios avançados',
        'API completa',
        'Suporte prioritário'
      ],
      color: 'border-purple-200 bg-purple-50',
      popular: true
    },
    {
      name: 'Enterprise',
      price: 'R$ 535/mês',
      icon: <Crown className="w-6 h-6" />,
      features: [
        'Usuários ilimitados',
        'Materiais ilimitados',
        'Multi-filial',
        'API personalizada',
        'Suporte dedicado',
        'SLA garantido'
      ],
      color: 'border-orange-200 bg-orange-50'
    }
  ];

  if (isLoading) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-2xl">
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="w-6 h-6" />
            Gerenciar Licença AlmoxPro
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Status Atual */}
          {licenseInfo && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {licenseInfo.isValid ? (
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  ) : (
                    <AlertTriangle className="w-5 h-5 text-red-600" />
                  )}
                  Status da Licença
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Plano Atual</p>
                    <div className="flex items-center gap-2 mt-1">
                      {getPlanIcon(licenseInfo.plan)}
                      <Badge className={getPlanColor(licenseInfo.plan)}>
                        {licenseInfo.plan.toUpperCase()}
                      </Badge>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-600">Dias Restantes</p>
                    <p className="text-2xl font-bold text-blue-600">
                      {licenseInfo.daysRemaining}
                    </p>
                  </div>
                </div>
                
                {licenseInfo.expiry && (
                  <div className="text-sm text-gray-600">
                    <p>Data de Expiração: {new Date(licenseInfo.expiry).toLocaleDateString('pt-BR')}</p>
                    <p>ID da Máquina: {licenseInfo.machineId}</p>
                  </div>
                )}

                {!licenseInfo.isValid && (
                  <Alert>
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      Sua licença expirou ou é inválida. Ative uma nova licença para continuar usando o sistema.
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>
          )}

          {/* Ativação de Licença */}
          {!licenseInfo?.isValid && (
            <Card>
              <CardHeader>
                <CardTitle>Ativar Licença</CardTitle>
                <CardDescription>
                  Digite sua chave de licença para ativar o sistema
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Chave de Licença
                  </label>
                  <input
                    type="text"
                    value={licenseKey}
                    onChange={(e) => setLicenseKey(e.target.value)}
                    placeholder="ALMX-XXXXX-XXXX"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {activationError && (
                  <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>{activationError}</AlertDescription>
                  </Alert>
                )}

                <Button 
                  onClick={handleActivate}
                  disabled={isActivating || !licenseKey.trim()}
                  className="w-full"
                >
                  {isActivating ? 'Ativando...' : 'Ativar Licença'}
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Planos Disponíveis */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Escolha seu Plano</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {plans.map((plan) => (
                <Card key={plan.name} className={`${plan.color} ${plan.popular ? 'ring-2 ring-purple-500' : ''}`}>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {plan.icon}
                        {plan.name}
                      </div>
                      {plan.popular && (
                        <Badge className="bg-purple-600 text-white">Popular</Badge>
                      )}
                    </CardTitle>
                    <CardDescription className="text-lg font-bold">
                      {plan.price}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {plan.features.map((feature, index) => (
                        <li key={index} className="flex items-center gap-2 text-sm">
                          <CheckCircle className="w-4 h-4 text-green-600" />
                          {feature}
                        </li>
                      ))}
                    </ul>
                    <Button 
                      className="w-full mt-4"
                      variant={plan.popular ? "default" : "outline"}
                      onClick={() => window.open('/pricing', '_blank')}
                    >
                      {plan.popular ? 'Escolher Plano' : 'Mais Detalhes'}
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Trial Info */}
          {licenseInfo?.plan === 'trial' && licenseInfo.isValid && (
            <Alert>
              <Clock className="h-4 w-4" />
              <AlertDescription>
                Você está usando o período gratuito de 15 dias. 
                Escolha um plano para continuar usando o AlmoxPro após o trial.
              </AlertDescription>
            </Alert>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
