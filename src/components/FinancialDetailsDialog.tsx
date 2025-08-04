
import React, { useState, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ProjetCulture } from "@/types/culture";
import { formatCurrency, cn } from '@/lib/utils';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Calculator, TrendingUp, TrendingDown, DollarSign } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

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
  const [sortField, setSortField] = useState<string>('culture');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

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

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const sortedCultures = useMemo(() => {
    return [...projectCultures].sort((a, b) => {
      let aValue: any, bValue: any;
      
      switch (sortField) {
        case 'culture':
          aValue = a.culture?.nom_culture || '';
          bValue = b.culture?.nom_culture || '';
          break;
        case 'cout':
          aValue = a.cout_exploitation_previsionnel || a.culture?.cout_exploitation_ha || 0;
          bValue = b.cout_exploitation_previsionnel || b.culture?.cout_exploitation_ha || 0;
          break;
        case 'rendement':
          aValue = a.rendement_previsionnel || a.culture?.rendement_ha || 0;
          bValue = b.rendement_previsionnel || b.culture?.rendement_ha || 0;
          break;
        case 'prix':
          aValue = a.culture?.prix_tonne || 0;
          bValue = b.culture?.prix_tonne || 0;
          break;
        case 'revenu':
          aValue = calculateEstimatedRevenue(
            a.rendement_previsionnel || a.culture?.rendement_ha,
            a.culture?.prix_tonne
          );
          bValue = calculateEstimatedRevenue(
            b.rendement_previsionnel || b.culture?.rendement_ha,
            b.culture?.prix_tonne
          );
          break;
        default:
          return 0;
      }
      
      if (typeof aValue === 'string') {
        return sortDirection === 'asc' 
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      }
      
      return sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
    });
  }, [projectCultures, sortField, sortDirection]);

  const totals = useMemo(() => {
    return projectCultures.reduce((acc, culture) => {
      const cout = culture.cout_exploitation_previsionnel || culture.culture?.cout_exploitation_ha || 0;
      const revenu = calculateEstimatedRevenue(
        culture.rendement_previsionnel || culture.culture?.rendement_ha,
        culture.culture?.prix_tonne
      );
      
      return {
        cout: acc.cout + cout,
        revenu: acc.revenu + revenu,
        benefice: (acc.revenu + revenu) - (acc.cout + cout)
      };
    }, { cout: 0, revenu: 0, benefice: 0 });
  }, [projectCultures]);

  const getSortIcon = (field: string) => {
    if (sortField !== field) return null;
    return sortDirection === 'asc' ? '↑' : '↓';
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[900px] max-h-[80vh] overflow-y-auto">
        <DialogHeader className="space-y-4">
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Calculator className="h-6 w-6 text-primary" />
            {title}
          </DialogTitle>
          
          {/* Résumé financier */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="border-border/50">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Coût total</CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-destructive" />
                  <span className="text-lg font-bold text-destructive">
                    {formatCurrency(totals.cout)}
                  </span>
                </div>
              </CardContent>
            </Card>
            
            <Card className="border-border/50">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Revenu estimé</CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-primary" />
                  <span className="text-lg font-bold text-primary">
                    {formatCurrency(totals.revenu)}
                  </span>
                </div>
              </CardContent>
            </Card>
            
            <Card className="border-border/50">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Bénéfice net</CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="flex items-center gap-2">
                  {totals.benefice >= 0 ? (
                    <TrendingUp className="h-4 w-4 text-success" />
                  ) : (
                    <TrendingDown className="h-4 w-4 text-destructive" />
                  )}
                  <span className={cn(
                    "text-lg font-bold",
                    totals.benefice >= 0 ? "text-success" : "text-destructive"
                  )}>
                    {formatCurrency(totals.benefice)}
                  </span>
                </div>
                <Badge 
                  variant={totals.benefice >= 0 ? "default" : "destructive"}
                  className="mt-1 text-xs"
                >
                  {totals.benefice >= 0 ? "Rentable" : "Déficitaire"}
                </Badge>
              </CardContent>
            </Card>
          </div>
        </DialogHeader>
        
        <div className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Détails par culture</CardTitle>
              <CardDescription>
                Cliquez sur les en-têtes pour trier les données
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-muted/50">
                      <TableHead 
                        className="w-[180px] cursor-pointer hover:bg-muted/20 transition-colors"
                        onClick={() => handleSort('culture')}
                      >
                        <div className="flex items-center gap-2">
                          Culture
                          <span className="text-xs opacity-60">{getSortIcon('culture')}</span>
                        </div>
                      </TableHead>
                      <TableHead 
                        className="text-right cursor-pointer hover:bg-muted/20 transition-colors"
                        onClick={() => handleSort('cout')}
                      >
                        <div className="flex items-center justify-end gap-2">
                          Coût d'exploitation
                          <span className="text-xs opacity-60">{getSortIcon('cout')}</span>
                        </div>
                      </TableHead>
                      <TableHead 
                        className="text-right cursor-pointer hover:bg-muted/20 transition-colors"
                        onClick={() => handleSort('rendement')}
                      >
                        <div className="flex items-center justify-end gap-2">
                          Rendement prévu
                          <span className="text-xs opacity-60">{getSortIcon('rendement')}</span>
                        </div>
                      </TableHead>
                      <TableHead 
                        className="text-right cursor-pointer hover:bg-muted/20 transition-colors"
                        onClick={() => handleSort('prix')}
                      >
                        <div className="flex items-center justify-end gap-2">
                          Prix par tonne
                          <span className="text-xs opacity-60">{getSortIcon('prix')}</span>
                        </div>
                      </TableHead>
                      <TableHead 
                        className="text-right cursor-pointer hover:bg-muted/20 transition-colors"
                        onClick={() => handleSort('revenu')}
                      >
                        <div className="flex items-center justify-end gap-2">
                          Revenu estimé
                          <span className="text-xs opacity-60">{getSortIcon('revenu')}</span>
                        </div>
                      </TableHead>
                      <TableHead className="text-right">
                        Marge
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sortedCultures.map((projectCulture, index) => {
                      const cout = projectCulture.cout_exploitation_previsionnel || projectCulture.culture?.cout_exploitation_ha || 0;
                      const estimatedRevenue = calculateEstimatedRevenue(
                        projectCulture.rendement_previsionnel || projectCulture.culture?.rendement_ha,
                        projectCulture.culture?.prix_tonne
                      );
                      const marge = estimatedRevenue - cout;
                      const margePercent = cout > 0 ? ((marge / cout) * 100) : 0;
                      
                      return (
                        <TableRow 
                          key={projectCulture.id_projet_culture || index}
                          className="hover:bg-muted/30 transition-colors"
                        >
                          <TableCell className="font-medium">
                            <div className="flex items-center gap-2">
                              <div className="w-3 h-3 rounded-full bg-primary/20 border border-primary/40"></div>
                              {projectCulture.culture?.nom_culture}
                            </div>
                          </TableCell>
                          <TableCell className="text-right font-mono">
                            <span className="text-destructive font-medium">
                              {formatCurrency(cout)}
                            </span>
                          </TableCell>
                          <TableCell className="text-right">
                            <span className="font-medium">
                              {projectCulture.rendement_previsionnel || projectCulture.culture?.rendement_ha || 0}
                            </span>
                            <span className="text-muted-foreground text-sm ml-1">t</span>
                          </TableCell>
                          <TableCell className="text-right font-mono">
                            {formatCurrency(projectCulture.culture?.prix_tonne || 0)}
                          </TableCell>
                          <TableCell className="text-right font-mono">
                            <span className="text-primary font-medium">
                              {formatCurrency(estimatedRevenue)}
                            </span>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="space-y-1">
                              <div className={cn(
                                "font-mono font-medium",
                                marge >= 0 ? "text-success" : "text-destructive"
                              )}>
                                {formatCurrency(marge)}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {margePercent.toFixed(1)}%
                              </div>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default FinancialDetailsDialog;
