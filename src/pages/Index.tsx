import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Package, ListChecks, AlertTriangle, TrendingUp, XCircle, ArrowLeftRight } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { usePendingRequests, useMovementsHistory, useMyPendingRequests } from "@/hooks/useMovements";
import { useMaterials } from "@/hooks/useMaterials";
import { 
  useCriticalMaterials, 
  useMovementTrend, 
  useZeroStockCount, 
  useTotalMovementsLast30Days 
} from "@/hooks/useDashboardData";
import MovementTable from "@/components/movements/MovementTable";
import DashboardChartCard from "@/components/dashboard/DashboardChartCard";
import TopMovingItemsCard from "@/components/dashboard/TopMovingItemsCard";
import { useTranslation } from "react-i18next";

const Index = () => {
  const { profile, isLoading } = useAuth();
  const { t } = useTranslation();
  
  const { data: adminPendingRequests = [], isLoading: isLoadingAdminRequests } = usePendingRequests();
  const { data: myPendingRequests = [], isLoading: isLoadingMyRequests } = useMyPendingRequests();
  const { data: materials = [], isLoading: isLoadingMaterials } = useMaterials();
  const { data: movements = [], isLoading: isLoadingMovements } = useMovementsHistory();
  const recentMovements = movements.slice(0, 5);

  const { data: criticalMaterialsData = [], isLoading: isLoadingCritical } = useCriticalMaterials();
  const { data: movementTrendData = [], isLoading: isLoadingTrend } = useMovementTrend();
  const { data: zeroStockCount = 0, isLoading: isLoadingZeroStock } = useZeroStockCount();
  const { data: totalMovements30Days = 0, isLoading: isLoadingTotalMovements } = useTotalMovementsLast30Days();

  if (isLoading) return <div>{t('common.loading')}</div>;
  if (!profile) return <div>Error</div>;

  const criticalMaterialsCount = materials.filter(m => m.quantidade_atual <= m.quantidade_minima).length;

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">
        {t('common.welcome', { name: profile.nome || profile.email })}
      </h1>
      <p className="text-lg text-muted-foreground">
        {profile.organization?.name} - <span className="capitalize">{profile.perfil}</span>
      </p>
      <Separator />
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('dashboard.total_materials')}</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{materials.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('dashboard.critical_stock')}</CardTitle>
            <AlertTriangle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{criticalMaterialsCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('dashboard.zero_stock')}</CardTitle>
            <XCircle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{zeroStockCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Movimentações (30d)</CardTitle>
            <ArrowLeftRight className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalMovements30Days}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <DashboardChartCard
          title="Tendência"
          icon={<TrendingUp className="h-5 w-5 mr-2" />}
          data={movementTrendData}
          dataKeys={[
            { key: 'entradas', color: 'hsl(142.1 76.2% 36.3%)', type: 'line' },
            { key: 'saidas', color: 'hsl(0 84.2% 60.2%)', type: 'line' },
          ]}
          isLoading={isLoadingTrend}
        />
        <TopMovingItemsCard />
      </div>

      <Separator />
      <h3 className="text-xl font-semibold">{t('dashboard.recent_movements')}</h3>
      <Card className="p-4">
        <MovementTable movements={recentMovements} isLoading={isLoadingMovements} />
      </Card>
    </div>
  );
};

export default Index;