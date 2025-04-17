
import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Culture } from "@/types/culture";
import { formatCurrency } from '@/lib/utils';

interface CultureFinancialData {
  id_culture: number;
  nom_culture: string;
  surface_ha: number;
  cout_exploitation_ha?: number;
  cout_exploitation_previsionnel?: number;
  rendement_ha?: number;
  rendement_previsionnel?: number;
  prix_tonne?: number;
  rendement_financier_previsionnel?: number;
}

interface FinancialDetailsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
  cultures: CultureFinancialData[];
  projectTitle: string;
}

const FinancialDetailsDialog: React.FC<FinancialDetailsDialogProps> = ({
  isOpen,
  onClose,
  projectId,
  cultures,
  projectTitle
}) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Détails financiers du projet</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <h3 className="text-sm font-medium">{projectTitle}</h3>
          
          <div className="border rounded-md">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-muted">
                  <th className="p-2 text-left">Culture</th>
                  <th className="p-2 text-right">Surface (ha)</th>
                  <th className="p-2 text-right">Coût/ha</th>
                  <th className="p-2 text-right">Coût total</th>
                  <th className="p-2 text-right">Rendement (t)</th>
                  <th className="p-2 text-right">Prix/tonne</th>
                  <th className="p-2 text-right">Revenu prévu</th>
                </tr>
              </thead>
              <tbody>
                {cultures.length > 0 ? (
                  cultures.map((culture) => (
                    <tr key={culture.id_culture} className="border-t">
                      <td className="p-2">{culture.nom_culture}</td>
                      <td className="p-2 text-right">{culture.surface_ha.toFixed(2)}</td>
                      <td className="p-2 text-right">{formatCurrency(culture.cout_exploitation_ha || 0)}</td>
                      <td className="p-2 text-right">{formatCurrency(culture.cout_exploitation_previsionnel || 0)}</td>
                      <td className="p-2 text-right">{culture.rendement_previsionnel?.toFixed(2) || '0.00'} t</td>
                      <td className="p-2 text-right">{formatCurrency(culture.prix_tonne || 0)}</td>
                      <td className="p-2 text-right">{formatCurrency(culture.rendement_financier_previsionnel || 0)}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="p-4 text-center text-muted-foreground">
                      Aucune données financières disponibles
                    </td>
                  </tr>
                )}
              </tbody>
              <tfoot>
                <tr className="border-t bg-muted">
                  <td colSpan={3} className="p-2 font-medium">Total</td>
                  <td className="p-2 text-right font-medium">
                    {formatCurrency(cultures.reduce((sum, c) => sum + (c.cout_exploitation_previsionnel || 0), 0))}
                  </td>
                  <td className="p-2 text-right font-medium">
                    {cultures.reduce((sum, c) => sum + (c.rendement_previsionnel || 0), 0).toFixed(2)} t
                  </td>
                  <td className="p-2"></td>
                  <td className="p-2 text-right font-medium">
                    {formatCurrency(cultures.reduce((sum, c) => sum + (c.rendement_financier_previsionnel || 0), 0))}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
          
          <div className="text-xs text-muted-foreground mt-2">
            <p>Ces données sont basées sur les projections initiales du projet. Les résultats réels peuvent varier en fonction des conditions agricoles et économiques.</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default FinancialDetailsDialog;
