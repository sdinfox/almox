import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Package, Users, ListChecks, AlertTriangle, TrendingUp, BarChart3 } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { usePendingRequests, useMovementsHistory, useMyPendingRequests } from "@/hooks/useMovements";
import { useMaterials } from "@/hooks/useMaterials";
import { useCriticalMaterials, useMovementTrend } from "@/hooks/useDashboardData";
import MovementTable from "@/components/movements/MovementTable";
import DashboardChartCard from "@/components/dashboard/DashboardChartCard";

const Index = () => {
  const { profile, isLoading } = useAuth();
  
  // Admin/Geral: Solicitações pendentes para aprovação
  const { data: adminPendingRequests = [], isLoading: isLoadingAdminRequests } = usePendingRequests();
  
  // Retirada: Minhas solicitações pendentes
  const { data: myPendingRequests = [], isLoading: isLoadingMyRequests } = useMyPendingRequests();

  const { data: materials = [], isLoading: isLoadingMaterials } = useMaterials();
  // Buscando as últimas 5 movimentações
  const { data: movements = [], isLoading: isLoadingMovements } = useMovementsHistory();
  const recentMovements = movements.slice(0, 5);

  // Novos Hooks para Dashboard Admin
  const { data: criticalMaterialsData = [], isLoading: isLoadingCritical } = useCriticalMaterials();
  const { data: movementTrendData = [], isLoading: isLoadingTrend } = useMovementTrend();

  if (isLoading) {
    // O ProtectedRoute já lida com o estado de carregamento, mas mantemos um fallback
    return <div>Carregando dados do usuário...</div>;
  }

  if (!profile) {
    return <div>Erro ao carregar perfil.</div>;
  }

  // Calculate critical materials count
  const criticalMaterialsCount = materials.filter(m => m.quantidade_atual <= m.quantidade_minima).length;

  // Conteúdo do Dashboard (será expandido nos próximos passos)
  const DashboardContent = () => {
    switch (profile.perfil) {
      case 'admin':
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold">Dashboard Administrativo</h2>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Total de Materiais
                  </CardTitle>
                  <Package className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{isLoadingMaterials ? '...' : materials.length}</div>
                  <p className="text-xs text-muted-foreground">
                    Itens cadastrados
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Materiais Críticos
                  </CardTitle>
                  <AlertTriangle className="h-4 w-4 text-destructive" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{isLoadingMaterials ? '...' : criticalMaterialsCount}</div>
                  <p className="text-xs text-muted-foreground">
                    Abaixo do estoque mínimo
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Solicitações Pendentes
                  </CardTitle>
                  <ListChecks className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{isLoadingAdminRequests ? '...' : adminPendingRequests.length}</div>
                  <p className="text-xs text-muted-foreground">
                    Aguardando aprovação
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Usuários Ativos
                  </CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">1+</div>
                  <p className="text-xs text-muted-foreground">
                    Gerencie em 'Usuários'
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Gráficos */}
            <div className="grid gap-6 lg:grid-cols-2">
              <DashboardChartCard
                title="Tendência de Movimentação (Últimos 30 Dias)"
                icon={<TrendingUp className="h-5 w-5 mr-2 text-primary" />}
                data={movementTrendData}
                dataKeys={[
                  { key: 'entradas', color: 'hsl(142.1 76.2% 36.3%)', type: 'line' }, // Verde
                  { key: 'saidas', color: 'hsl(0 84.2% 60.2%)', type: 'line' }, // Vermelho
                ]}
                isLoading={isLoadingTrend}
                description="Volume de entradas e saídas aprovadas por dia."
              />

              <DashboardChartCard
                title="Top 5 Materiais Mais Críticos"
                icon={<AlertTriangle className="h-5 w-5 mr-2 text-destructive" />}
                data={criticalMaterialsData.map(m => ({
                    name: m.codigo,
                    'Estoque Atual': m.quantidade_atual,
                    'Estoque Mínimo': m.quantidade_minima,
                }))}
                dataKeys={[
                  { key: 'Estoque Mínimo', color: 'hsl(210 40% 96.1%)', type: 'bar' }, // Cinza
                  { key: 'Estoque Atual', color: 'hsl(0 84.2% 60.2%)', type: 'bar' }, // Vermelho
                ]}
                isLoading={isLoadingCritical}
                description="Materiais com maior déficit em relação ao estoque mínimo."
              />
            </div>

            <Separator />
            <h3 className="text-xl font-semibold">Últimas 5 Movimentações</h3>
            <Card className="p-4">
              <MovementTable 
                movements={recentMovements} 
                isLoading={isLoadingMovements} 
              />
            </Card>
          </div>
        );
      case 'retirada':
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold">Dashboard de Retirada</h2>
            <Card className="p-6">
              <h3 className="text-xl font-semibold mb-4">Acesso Rápido</h3>
              <p>Você tem <span className="font-bold text-primary">{isLoadingMyRequests ? '...' : myPendingRequests.length}</span> solicitações pendentes. Acesse "Minhas Solicitações" para gerenciar.</p>
            </Card>
          </div>
        );
      case 'consulta':
      default:
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold">Dashboard de Consulta</h2>
            <Card className="p-6">
              <h3 className="text-xl font-semibold mb-4">Bem-vindo, {profile.nome || profile.email}!</h3>
              <p>Use o menu lateral para acessar a lista de materiais e o histórico de movimentações.</p>
            </Card>
          </div>
        );
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">
        Bem-vindo, {profile.nome || profile.email}!
      </h1>
      <p className="text-lg text-muted-foreground capitalize">
        Perfil: <span className="font-semibold text-primary">{profile.perfil}</span>
      </p>
      <Separator />
      <DashboardContent />
    </div>
  );
};

export default Index;