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
import { Download, Package, Warehouse } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';

const FullInventoryReport: React.FC = () => {
  const { data: materials = [], isLoading, error } = useMaterials();

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
        <Warehouse className="h-4 w-4" />
        <AlertTitle>Erro ao carregar inventário</AlertTitle>
        <AlertDescription>{error.message}</AlertDescription>
      </Alert>
    );
  }

  const formatMaterialForExport = (material: Material) => {
    return {
      Código: material.codigo,
      Nome: material.nome,
      Descrição: material.descricao || '',
      Categoria: material.categoria || '',
      'Unidade Medida': material.unidade_medida,
      'Estoque Atual': material.quantidade_atual,
      'Estoque Mínimo': material.quantidade_minima,
      Localização: material.localizacao || '',
      'Data Cadastro': format(new Date(material.created_at), 'dd/MM/yyyy'),
    };
  };

  const handleExport = () => {
    if (materials.length === 0) {
      alert('Não há materiais para exportar.');
      return;
    }

    // 1. Preparar os dados
    const dataToExport = materials.map(formatMaterialForExport);
    
    // 2. Gerar o conteúdo CSV (Conceitual)
    const headers = Object.keys(dataToExport[0]).join(';');
    const rows = dataToExport.map(row => Object.values(row).join(';'));
    const csvContent = [headers, ...rows].join('\n');

    // 3. Acionar o download (Conceitual)
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `inventario_completo_${format(new Date(), 'yyyyMMdd')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-semibold">
          Inventário Completo de Materiais ({materials.length})
        </h3>
        <Button onClick={handleExport} variant="outline" disabled={materials.length === 0}>
          <Download className="mr-2 h-4 w-4" />
          Exportar CSV
        </Button>
      </div>

      {materials.length === 0 ? (
        <div className="text-center p-10 border rounded-lg bg-muted/50">
          <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-xl font-semibold">Nenhum Material Cadastrado</h3>
          <p className="text-muted-foreground">O inventário está vazio.</p>
        </div>
      ) : (
        <div className="overflow-x-auto max-h-[400px]">
          <Table>
            <TableHeader className="sticky top-0 bg-background">
              <TableRow>
                <TableHead>Código</TableHead>
                <TableHead>Nome</TableHead>
                <TableHead>Categoria</TableHead>
                <TableHead className="text-center">Estoque Atual</TableHead>
                <TableHead className="text-center">Estoque Mínimo</TableHead>
                <TableHead>Localização</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {materials.slice(0, 50).map((material) => ( // Limita a 50 para visualização rápida
                <TableRow key={material.id}>
                  <TableCell className="font-medium">{material.codigo}</TableCell>
                  <TableCell>{material.nome}</TableCell>
                  <TableCell>{material.categoria || 'N/A'}</TableCell>
                  <TableCell className="text-center">
                    {material.quantidade_atual} {material.unidade_medida}
                  </TableCell>
                  <TableCell className="text-center">
                    {material.quantidade_minima} {material.unidade_medida}
                  </TableCell>
                  <TableCell>{material.localizacao || 'N/A'}</TableCell>
                </TableRow>
              ))}
              {materials.length > 50 && (
                <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground">
                        ... e mais {materials.length - 50} registros. Use o botão Exportar para ver todos.
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

export default FullInventoryReport;