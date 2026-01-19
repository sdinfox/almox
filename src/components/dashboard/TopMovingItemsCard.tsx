import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ListOrdered, Loader2, Package } from 'lucide-react';
import { useTopMovingItems } from '@/hooks/useDashboardData';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';

const TopMovingItemsCard: React.FC = () => {
  const { data: topItems = [], isLoading } = useTopMovingItems();

  return (
    <Card className="lg:col-span-2">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-lg font-semibold flex items-center">
          <ListOrdered className="h-5 w-5 mr-2 text-primary" />
          Top 5 Materiais Mais Movimentados (30 Dias)
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-4">
        {isLoading ? (
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-8 w-full" />
            ))}
          </div>
        ) : topItems.length === 0 ? (
          <div className="text-center p-4 text-muted-foreground">
            Nenhuma movimentação registrada nos últimos 30 dias.
          </div>
        ) : (
          <div className="space-y-3">
            {topItems.map((item, index) => (
              <div key={item.material_id} className="flex items-center justify-between border-b pb-2 last:border-b-0">
                <div className="flex items-center space-x-3">
                  <span className="text-xl font-bold text-primary/80 w-6 text-center">{index + 1}</span>
                  <div>
                    <p className="font-medium">{item.nome}</p>
                    <p className="text-xs text-muted-foreground">Cód: {item.codigo}</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="font-bold text-lg">{item.total_quantidade}</span>
                  <span className="text-sm text-muted-foreground ml-1">{item.unidade_medida}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default TopMovingItemsCard;