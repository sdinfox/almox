import React, { useRef, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Image, Upload, Trash2, Loader2 } from 'lucide-react';
import { useLogoUrl, useUploadLogo, useRemoveLogo } from '@/hooks/useConfig';
import { cn } from '@/lib/utils';
import { showError } from '@/utils/toast';

const LogoSettings: React.FC = () => {
  const { data: logoUrl, isLoading: isLoadingLogo } = useLogoUrl();
  const uploadMutation = useUploadLogo();
  const removeMutation = useRemoveLogo();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        showError('Por favor, selecione um arquivo de imagem válido.');
        setSelectedFile(null);
        return;
      }
      setSelectedFile(file);
    }
  };

  const handleUpload = () => {
    if (selectedFile) {
      uploadMutation.mutate(selectedFile, {
        onSuccess: () => setSelectedFile(null),
      });
    } else {
      showError('Nenhum arquivo selecionado.');
    }
  };

  const handleRemove = () => {
    removeMutation.mutate();
  };

  const isPending = uploadMutation.isPending || removeMutation.isPending;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Logo da Empresa</CardTitle>
        <CardDescription>Gerencie o logo que será exibido no cabeçalho do sistema.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center space-x-4">
          <div 
            className={cn(
              "w-24 h-24 flex items-center justify-center rounded-lg border-2 border-dashed",
              logoUrl ? "border-transparent p-0" : "border-muted-foreground/50 p-4"
            )}
          >
            {isLoadingLogo ? (
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            ) : logoUrl ? (
              <img src={logoUrl} alt="Logo da Empresa" className="max-w-full max-h-full object-contain" />
            ) : (
              <Image className="h-8 w-8 text-muted-foreground" />
            )}
          </div>
          <div>
            <p className="text-sm font-medium">Status Atual:</p>
            <p className="text-xs text-muted-foreground">
              {logoUrl ? 'Logo carregado' : 'Nenhum logo definido'}
            </p>
          </div>
        </div>

        <div className="space-y-2">
          <Input 
            type="file" 
            accept="image/*" 
            ref={fileInputRef} 
            onChange={handleFileChange} 
            disabled={isPending}
          />
          {selectedFile && (
            <p className="text-sm text-muted-foreground">Arquivo selecionado: {selectedFile.name}</p>
          )}
        </div>

        <div className="flex space-x-2">
          <Button 
            onClick={handleUpload} 
            disabled={!selectedFile || isPending}
          >
            {uploadMutation.isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Upload className="mr-2 h-4 w-4" />
            )}
            {logoUrl ? 'Substituir Logo' : 'Fazer Upload'}
          </Button>
          {logoUrl && (
            <Button 
              variant="destructive" 
              onClick={handleRemove} 
              disabled={isPending}
            >
              {removeMutation.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="mr-2 h-4 w-4" />
              )}
              Remover Logo
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default LogoSettings;