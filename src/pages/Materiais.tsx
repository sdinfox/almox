import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { PlusCircle, Upload } from 'lucide-react';
import { Material } from '@/types';
import { useMaterials, useMaterialMutations } from '@/hooks/useMaterials';
import MaterialTable from '@/components/materials/MaterialTable';
import MaterialForm from '@/components/materials/MaterialForm';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import BulkUploadDialog from '@/components/materials/BulkUploadDialog';
import { useAuth } from '@/contexts/AuthContext';

const Materiais = () => {
  const { profile } = useAuth();
  const { data: materials = [], isLoading } = useMaterials();
  const { createMutation, updateMutation } = useMaterialMutations();
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isBulkUploadOpen, setIsBulkUploadOpen] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState<Material | undefined>(undefined);

  const handleOpenDialog = (material?: Material) => {
    setEditingMaterial(material);
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingMaterial(undefined);
  };

  const handleSubmit = (values: any) => {
    if (editingMaterial) {
      // Edição
      updateMutation.mutate({ ...editingMaterial, ...values }, {
        onSuccess: handleCloseDialog,
      });
    } else {
      // Criação
      createMutation.mutate(values, {
        onSuccess: handleCloseDialog,
      });
    }
  };

  const isAdmin = profile?.perfil === 'admin';

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Gestão de Materiais</h1>
        <div className="flex space-x-2">
          {isAdmin && (
            <Button variant="outline" onClick={() => setIsBulkUploadOpen(true)}>
              <Upload className="mr-2 h-4 w-4" />
              Carga em Massa
            </Button>
          )}
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => handleOpenDialog()}>
                <PlusCircle className="mr-2 h-4 w-4" />
                Novo Material
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px]">
              <DialogHeader>
                <DialogTitle>{editingMaterial ? 'Editar Material' : 'Cadastrar Novo Material'}</DialogTitle>
              </DialogHeader>
              <MaterialForm 
                initialData={editingMaterial} 
                onSubmit={handleSubmit} 
                isPending={createMutation.isPending || updateMutation.isPending}
              />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <MaterialTable 
        materials={materials} 
        isLoading={isLoading} 
        onEdit={handleOpenDialog} 
      />

      {/* Diálogo de Carga em Massa (Apenas para Admin) */}
      {isAdmin && (
        <BulkUploadDialog 
          isOpen={isBulkUploadOpen} 
          onOpenChange={setIsBulkUploadOpen} 
        />
      )}
    </div>
  );
};

export default Materiais;