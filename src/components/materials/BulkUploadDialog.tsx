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
import { Upload, Loader2, FileText, AlertTriangle, Download } from 'lucide-react';
import { useBulkUpdateStock } from '@/hooks/useMaterials';
import { showError, showSuccess } from '@/utils/toast';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { format } from 'date-fns';

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
  const [parsingError, setParsingError] = useState<string | null>(null);
  const bulkMutation = useBulkUpdateStock();

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    setParsingError(null);
    if (selectedFile) {
      const validTypes = [
        'text/csv', 
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
        'application/vnd.ms-excel' // .xls
      ];
      if (!validTypes.includes(selectedFile.type) && !selectedFile.name.endsWith('.csv')) {
        showError('Formato de arquivo inválido. Use CSV ou Excel (.xlsx).');
        setFile(null);
        return;
      }
      setFile(selectedFile);
    } else {
      setFile(null);
    }
  };

  // Função para gerar e baixar o arquivo modelo CSV
  const handleDownloadTemplate = () => {
    const headers = [
      'codigo (OBRIGATÓRIO)', 
      'nome (OBRIGATÓRIO)', 
      'unidade_medida (OBRIGATÓRIO)', 
      'quantidade (OBRIGATÓRIO)', 
      'descricao', 
      'categoria', 
      'quantidade_minima', 
      'localizacao'
    ];
    
    // Exemplo de linha para guiar o usuário
    const exampleRow = [
      'P-1001', 
      'Parafuso M8', 
      'UN', 
      '50', 
      'Parafuso sextavado de aço', 
      'Fixadores', 
      '10', 
      'Prateleira A1'
    ];

    const csvContent = [
      headers.join(';'),
      exampleRow.join(';')
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `modelo_carga_massa_materiais_${format(new Date(), 'yyyyMMdd')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Função placeholder para simular a leitura e conversão do arquivo
  const parseFile = async (file: File): Promise<BulkItem[]> => {
    // -------------------------------------------------------------------
    // ATENÇÃO: ESTE É UM PLACEHOLDER. 
    // Em um ambiente real, você usaria uma biblioteca como 'xlsx' (SheetJS) 
    // ou 'papaparse' (para CSV) para ler o arquivo e converter para JSON.
    // -------------------------------------------------------------------
    
    console.log(`Simulando leitura do arquivo: ${file.name}`);

    // Simulação de dados que seriam gerados após a leitura do arquivo:
    const simulatedData: BulkItem[] = [
      { codigo: 'P-1001', nome: 'Parafuso M8', unidade_medida: 'UN', quantidade: 50, quantidade_minima: 10 }, 
      { codigo: 'C-2005', nome: 'Cabo de Força', unidade_medida: 'MT', quantidade: 100, categoria: 'Elétrica' }, 
      { codigo: 'F-3000', nome: 'Fita Isolante', unidade_medida: 'UN', quantidade: 20, localizacao: 'B2' },
    ];

    // Simulação de validação básica
    if (simulatedData.some(item => !item.codigo || !item.nome || !item.unidade_medida || item.quantidade <= 0)) {
        throw new Error("Dados inválidos encontrados na planilha simulada.");
    }

    return simulatedData;
  };

  const handleUpload = async () => {
    if (!file) return;

    try {
      // 1. Parse do arquivo (simulado)
      const itemsToUpload = await parseFile(file);
      
      if (itemsToUpload.length === 0) {
        showError('O arquivo não contém dados válidos para upload.');
        return;
      }

      // 2. Execução da mutação
      const result = await bulkMutation.mutateAsync(itemsToUpload);
      
      // 3. Feedback detalhado
      let summary = `Carga concluída: ${result.createdCount} novos materiais, ${result.updatedCount} estoques atualizados.`;
      
      if (result.errors.length > 0) {
        summary += ` ${result.errors.length} falhas.`;
        showError(summary);
        // Em um cenário real, você mostraria os detalhes dos erros em um modal separado
      } else {
        showSuccess(summary);
      }

      onOpenChange(false);
      setFile(null);
    } catch (e) {
      setParsingError(e instanceof Error ? e.message : 'Erro desconhecido durante o processamento do arquivo.');
      // A mutação já trata erros de backend via toast
    }
  };

  const isPending = bulkMutation.isPending;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Carga de Estoque em Massa</DialogTitle>
          <DialogDescription>
            Faça o upload de um arquivo CSV ou Excel para cadastrar novos materiais ou atualizar o estoque de itens existentes.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <Alert variant="default">
            <FileText className="h-4 w-4" />
            <AlertTitle>Formato Esperado</AlertTitle>
            <AlertDescription>
              O arquivo deve conter colunas para: 
              <span className="font-semibold"> Código, Nome, Unidade de Medida, Quantidade</span>, 
              e opcionalmente: Descrição, Categoria, Estoque Mínimo, Localização.
            </AlertDescription>
          </Alert>
          
          <Button 
            onClick={handleDownloadTemplate} 
            variant="outline" 
            className="w-full"
            disabled={isPending}
          >
            <Download className="mr-2 h-4 w-4" />
            Baixar Arquivo Modelo CSV
          </Button>

          {parsingError && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Erro de Processamento</AlertTitle>
              <AlertDescription>{parsingError}</AlertDescription>
            </Alert>
          )}

          <Input 
            type="file" 
            accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel"
            onChange={handleFileChange}
            disabled={isPending}
          />
          
          {file && (
            <p className="text-sm text-muted-foreground">Arquivo selecionado: {file.name}</p>
          )}

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