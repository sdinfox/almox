import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Upload, Loader2, FileText } from 'lucide-react';
import { useBulkUpdateStock } from '@/hooks/useMaterials';
import { showError } from '@/utils/toast';

interface BulkUploadDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

// Estrutura de dados esperada (conceitual)
interface BulkItem {
  codigo: string;
  nome: string;
  unidade_medida: string;
  quantidade: number;
  descricao?: string;
  categoria?: string;
  quantidade_minima?: number;
  localizacao?: string;
}

const BulkUploadDialog: React.FC<BulkUploadDialogProps> = ({ isOpen, onOpenChange }) => {
  const [file, setFile] = useState<File | null>(null);
  const bulkMutation = useBulkUpdateStock();

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      // Em um ambiente real, você verificaria o tipo (CSV/XLSX)
      setFile(selectedFile);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      showError('Por favor, selecione um arquivo para upload.');
      return;
    }

    // Simulação da leitura e conversão do arquivo (CSV/XLSX -> JSON Array)
    // Na implementação real, você usaria uma biblioteca como PapaParse (para CSV) ou SheetJS (para XLSX)
    
    // Exemplo de dados simulados que seriam gerados após a leitura do arquivo:
    const simulatedData: BulkItem[] = [
      { codigo: 'P-1001', nome: 'Parafuso M8', unidade_medida: 'UN', quantidade: 50, quantidade_minima: 10 }, // Item existente (atualiza estoque)
      { codigo: 'C-2005', nome: 'Cabo de Força', unidade_medida: 'MT', quantidade: 100, categoria: 'Elétrica' }, // Item novo (cria)
    ];

    try {
      await bulkMutation.mutateAsync(simulatedData);
      onOpenChange(false);
      setFile(null);
    } catch (e) {
      // O erro já é tratado no hook, mas mantemos o bloco
    }
  };

  const isPending = bulkMutation.isPending;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Carga de Estoque em Massa</Dialogeração</DialogTitle>
          <DialogDescription>
            Faça o upload de um arquivo (CSV/Excel) para cadastrar novos materiais ou atualizar o estoque de itens existentes.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <Alert variant="default">
            <FileText className="h-4 w-4" />
            <AlertTitle>Formato Esperado</AlertTitle>
            <AlertDescription>
              O arquivo deve conter colunas para: Código, Nome, Unidade de Medida, Quantidade, e opcionalmente: Descrição, Categoria, Estoque Mínimo, Localização.
            </AlertDescription>
          </Alert>
          <Input 
            type="file" 
            accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel"
            onChange={handleFileChange}
            disabled={isPending}
          />
          <Button 
            onClick={handleUpload} 
            disabled={!file || isPending}
            className="w-full"
          >
            {isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processando Carga...
              </>
            ) : (
              <>
                <Upload className="mr-2 h-4 w-4" />
                Iniciar Carga em Massa
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default BulkUploadDialog;