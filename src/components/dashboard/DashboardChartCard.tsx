import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
} from 'recharts';
import { Loader2 } from 'lucide-react';

interface ChartData {
  name: string;
  [key: string]: string | number;
}

interface DashboardChartCardProps {
  title: string;
  icon: React.ReactNode;
  data: ChartData[];
  dataKeys: { key: string; color: string; type: 'bar' | 'line' }[];
  isLoading: boolean;
  description?: string;
}

const DashboardChartCard: React.FC<DashboardChartCardProps> = ({
  title,
  icon,
  data,
  dataKeys,
  isLoading,
  description,
}) => {
  const ChartComponent = dataKeys.some(k => k.type === 'line') ? LineChart : BarChart;
  const isLineChart = ChartComponent === LineChart;

  if (isLoading) {
    return (
      <Card className="h-96 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </Card>
    );
  }

  return (
    <Card className="h-96">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-lg font-semibold flex items-center">
          {icon}
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="h-[calc(100%-60px)] pt-4">
        {description && <p className="text-sm text-muted-foreground mb-4">{description}</p>}
        {data.length === 0 ? (
          <div className="h-full flex items-center justify-center text-muted-foreground">
            Nenhum dado disponível para este período.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <ChartComponent
              data={data}
              margin={{ top: 5, right: 20, left: -20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="name" stroke="hsl(var(--foreground))" tickLine={false} axisLine={false} />
              <YAxis stroke="hsl(var(--foreground))" tickLine={false} axisLine={false} />
              <Tooltip
                contentStyle={{ 
                  backgroundColor: 'hsl(var(--card))', 
                  border: '1px solid hsl(var(--border))', 
                  borderRadius: '0.5rem' 
                }}
              />
              <Legend />
              {dataKeys.map(({ key, color, type }) =>
                type === 'bar' ? (
                  <Bar key={key} dataKey={key} fill={color} radius={[4, 4, 0, 0]} />
                ) : (
                  <Line 
                    key={key} 
                    type="monotone" 
                    dataKey={key} 
                    stroke={color} 
                    strokeWidth={2} 
                    dot={false}
                  />
                )
              )}
            </ChartComponent>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
};

export default DashboardChartCard;