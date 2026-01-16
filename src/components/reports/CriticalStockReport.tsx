import React from 'react';
import { useMaterials } from '@/hooks/useMaterials';
import { Material } from '@/types';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertTriangle, Package, Download, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';

const CriticalStockReport: React.FC = () => {
  const { data: materials = [], isLoading, error } = useMaterials();

  // Filtrar materiais críticos (quantidade atual <= quantidade mínima)
  const criticalMaterials = materials.filter(
    (m) => m.quantidade_atual <= m.quantidade_minima,
  );

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Erro ao carregar dados</AlertTitle>
        <AlertDescription>{error.message}</AlertDescription>
      </Alert>
    );
  }

  const handleExport = () => {
    // Lógica conceitual de exportação para CSV ou Excel
    console.log('Iniciando exportação do relatório de estoque crítico...');
    // Em um cenário real, você formataria criticalMaterials para CSV/Excel
    // e acionaria o download.
    alert('Simulação: Relatório de Estoque Crítico exportado com sucesso!');
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-semibold">
          Itens em Nível Crítico ({criticalMaterials.length})
        </h3>
        <Button onClick={handleExport} variant="outline" disabled={criticalMaterials.length === 0}>
          <Download className="mr-2 h-4 w-4" />
          Exportar CSV
        </Button>
      </div>

      {criticalMaterials.length === 0 ? (
        <div className="text-center p-10 border rounded-lg bg-green-50/50 dark:bg-green-900/10">
          <Package className="h-12 w-12 mx-auto text-green-600 mb-4" />
          <h3 className="text-xl font-semibold">Estoque Saudável</h3>
          <p className="text-muted-foreground">Nenhum material está abaixo ou no nível mínimo de estoque.</p>
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Código</TableHead>
              <TableHead>Nome</TableHead>
              <TableHead>Localização</TableHead>
              <TableHead className="text-center">Estoque Atual</TableHead>
              <TableHead className="text-center">Estoque Mínimo</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {criticalMaterials.map((material: Material) => (
              <TableRow key={material.id} className="bg-red-50/50 dark:bg-red-900/10">
                <TableCell className="font-medium">{material.codigo}</TableCell>
                <TableCell>{material.nome}</TableCell>
                <TableCell>{material.localizacao || 'N/A'}</TableCell>
                <TableCell className="text-center font-bold text-destructive">
                  {material.quantidade_atual} {material.unidade_medida}
                </TableCell>
                <TableCell className="text-center">
                  {material.quantidade_minima} {material.unidade_medida}
                </TableCell>
                <TableCell>
                  <Badge variant="destructive">
                    <AlertTriangle className="h-3 w-3 mr-1" /> Crítico
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
};

export default CriticalStockReport;