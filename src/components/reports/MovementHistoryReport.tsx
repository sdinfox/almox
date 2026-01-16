import React from 'react';
import { useMovementsHistory } from '@/hooks/useMovements';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Download, Loader2, History, Package } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { MovementWithDetails } from '@/types';

const MovementHistoryReport: React.FC = () => {
  const { data: movements = [], isLoading, error } = useMovementsHistory();

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(5)].map((_, i) => (
          <Skeleton key={i} className="h-10 w-full" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <History className="h-4 w-4" />
        <AlertTitle>Erro ao carregar histórico</AlertTitle>
        <AlertDescription>{error.message}</AlertDescription>
      </Alert>
    );
  }

  const formatMovementForExport = (movement: MovementWithDetails) => {
    const formattedDate = format(new Date(movement.created_at), 'dd/MM/yyyy HH:mm', { locale: ptBR });
    const userName = movement.user?.nome || movement.user?.email || 'Desconhecido';
    const approverName = movement.approver?.nome || movement.approver?.email || 'N/A';

    return {
      Data: formattedDate,
      Tipo: movement.tipo.toUpperCase(),
      Status: movement.status.toUpperCase(),
      'Cód. Material': movement.material.codigo,
      'Nome Material': movement.material.nome,
      Quantidade: movement.quantidade,
      'Unidade Medida': movement.material.unidade_medida,
      'Estoque Anterior': movement.quantidade_anterior,
      'Estoque Novo': movement.quantidade_nova,
      Solicitante: userName,
      'Aprovado Por': movement.status === 'aprovada' ? approverName : 'N/A',
      Observacao: movement.observacao || '',
    };
  };

  const handleExport = () => {
    if (movements.length === 0) {
      alert('Não há dados para exportar.');
      return;
    }

    // 1. Preparar os dados
    const dataToExport = movements.map(formatMovementForExport);
    
    // 2. Gerar o conteúdo CSV (Conceitual)
    // Em um ambiente real, você usaria uma biblioteca para garantir a formatação correta, 
    // especialmente para lidar com vírgulas e caracteres especiais.
    const headers = Object.keys(dataToExport[0]).join(';');
    const rows = dataToExport.map(row => Object.values(row).join(';'));
    const csvContent = [headers, ...rows].join('\n');

    // 3. Acionar o download (Conceitual)
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `historico_movimentacoes_${format(new Date(), 'yyyyMMdd')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-semibold">
          Histórico Completo de Movimentações ({movements.length})
        </h3>
        <Button onClick={handleExport} variant="outline" disabled={movements.length === 0}>
          <Download className="mr-2 h-4 w-4" />
          Exportar CSV
        </Button>
      </div>

      {movements.length === 0 ? (
        <div className="text-center p-10 border rounded-lg bg-muted/50">
          <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-xl font-semibold">Nenhum Registro</h3>
          <p className="text-muted-foreground">O histórico de movimentações está vazio.</p>
        </div>
      ) : (
        <div className="overflow-x-auto max-h-[400px]">
          <Table>
            <TableHeader className="sticky top-0 bg-background">
              <TableRow>
                <TableHead>Data</TableHead>
                <TableHead>Material</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead className="text-right">Qtd</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Solicitante</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {movements.slice(0, 50).map((movement) => { // Limita a 50 para visualização rápida
                const formattedDate = format(new Date(movement.created_at), 'dd/MM/yyyy HH:mm', { locale: ptBR });
                const userName = movement.user?.nome || movement.user?.email || 'Desconhecido';

                return (
                  <TableRow key={movement.id}>
                    <TableCell className="text-xs text-muted-foreground">{formattedDate}</TableCell>
                    <TableCell>
                      <div className="font-medium">{movement.material.nome}</div>
                      <div className="text-xs text-muted-foreground">{movement.material.codigo}</div>
                    </TableCell>
                    <TableCell className="capitalize">{movement.tipo}</TableCell>
                    <TableCell className="text-right">{movement.quantidade} {movement.material.unidade_medida}</TableCell>
                    <TableCell className="capitalize">{movement.status}</TableCell>
                    <TableCell>{userName}</TableCell>
                  </TableRow>
                );
              })}
              {movements.length > 50 && (
                <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground">
                        ... e mais {movements.length - 50} registros. Use o botão Exportar para ver todos.
                    </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
};

export default MovementHistoryReport;