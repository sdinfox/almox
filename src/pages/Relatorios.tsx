import React from 'react';
import { BarChart3, AlertTriangle } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import CriticalStockReport from '@/components/reports/CriticalStockReport';
import { useAuth } from '@/contexts/AuthContext';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { ShieldAlert } from 'lucide-react';

const Relatorios = () => {
  const { profile } = useAuth();

  // Acesso permitido para Admin e Consulta
  if (profile?.perfil !== 'admin' && profile?.perfil !== 'consulta') {
    return (
      <Alert variant="destructive">
        <ShieldAlert className="h-4 w-4" />
        <AlertTitle>Acesso Negado</AlertTitle>
        <AlertDescription>
          Você não tem permissão para acessar a página de relatórios.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center space-x-3">
        <BarChart3 className="h-8 w-8 text-primary" />
        <h1 className="text-3xl font-bold">Relatórios e Análises</h1>
      </div>
      <p className="text-muted-foreground">Visualize dados importantes para a gestão do seu almoxarifado.</p>
      
      <Separator />

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-xl font-semibold flex items-center">
            <AlertTriangle className="h-5 w-5 mr-2 text-destructive" />
            Relatório de Estoque Crítico
          </CardTitle>
        </CardHeader>
        <CardContent>
          <CriticalStockReport />
        </CardContent>
      </Card>

      {/* Futuros relatórios podem ser adicionados aqui, como Histórico de Movimentações por Período, etc. */}
    </div>
  );
};

export default Relatorios;