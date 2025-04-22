
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ProjetCulture } from "@/types/culture";
import { formatCurrency } from '@/lib/utils';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Calculator } from 'lucide-react';

interface FinancialDetailsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  projectCultures: ProjetCulture[];
  title?: string;
}

const FinancialDetailsDialog: React.FC<FinancialDetailsDialogProps> = ({
  isOpen,
  onClose,
  projectCultures,
  title = "Détails financiers par culture"
}) => {
  if (!projectCultures || projectCultures.length === 0) {
    return null;
  }
  
  const handleOpenChange = (open: boolean) => {
    if (!open) {
      onClose();
    }
  };
  
  const calculateEstimatedRevenue = (rendement: number | undefined, prix: number | undefined) => {
    if (rendement === undefined || prix === undefined) {
      return 0;
    }
    return rendement * prix;
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5" />
            {title}
          </DialogTitle>
        </DialogHeader>
        
        <div className="mt-4">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[150px]">Culture</TableHead>
                <TableHead className="text-right">Coût d'exploitation</TableHead>
                <TableHead className="text-right">Rendement prévu</TableHead>
                <TableHead className="text-right">Prix par tonne</TableHead>
                <TableHead className="text-right">Revenu estimé</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {projectCultures.map((projectCulture, index) => {
                const estimatedRevenue = calculateEstimatedRevenue(
                  projectCulture.rendement_previsionnel || projectCulture.culture?.rendement_ha,
                  projectCulture.culture?.prix_tonne
                );
                
                return (
                  <TableRow key={projectCulture.id_projet_culture || index}>
                    <TableCell className="font-medium">{projectCulture.culture?.nom_culture}</TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(projectCulture.cout_exploitation_previsionnel || projectCulture.culture?.cout_exploitation_ha || 0)}
                    </TableCell>
                    <TableCell className="text-right">
                      {projectCulture.rendement_previsionnel || projectCulture.culture?.rendement_ha || 0} t
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(projectCulture.culture?.prix_tonne || 0)}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(estimatedRevenue)}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default FinancialDetailsDialog;
