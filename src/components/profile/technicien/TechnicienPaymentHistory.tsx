
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { formatCurrency } from '@/lib/utils';
import { Calendar, FileText, Download } from 'lucide-react';

interface ReceivedPayment {
  id_historique_paiement: number;
  montant: number;
  date_paiement: string;
  reference_paiement: string;
  type_paiement: string;
  nom_projet: string;
  statut_justificatif: string;
}

interface TechnicienPaymentHistoryProps {
  receivedPayments: ReceivedPayment[];
}

const TechnicienPaymentHistory: React.FC<TechnicienPaymentHistoryProps> = ({ receivedPayments }) => {
  const [filterPeriod, setFilterPeriod] = useState<string>('all');
  const [filterProject, setFilterProject] = useState<string>('all');

  const getStatusBadge = (statut: string) => {
    switch (statut) {
      case 'validé':
        return <Badge variant="default" className="bg-green-100 text-green-700">Validé</Badge>;
      case 'en_attente':
        return <Badge variant="outline" className="text-orange-600">En attente</Badge>;
      case 'rejeté':
        return <Badge variant="destructive">Rejeté</Badge>;
      default:
        return <Badge variant="secondary">{statut}</Badge>;
    }
  };

  const getPaymentMethodBadge = (type: string) => {
    switch (type) {
      case 'Mobile Banking':
        return <Badge variant="outline" className="text-blue-600">Mobile Banking</Badge>;
      case 'Chèque de banque':
        return <Badge variant="outline" className="text-purple-600">Chèque</Badge>;
      case 'Liquide':
        return <Badge variant="outline" className="text-green-600">Liquide</Badge>;
      default:
        return <Badge variant="outline">{type}</Badge>;
    }
  };

  // Filtrer les paiements
  const filteredPayments = receivedPayments.filter(payment => {
    const paymentDate = new Date(payment.date_paiement);
    const now = new Date();
    
    let periodMatch = true;
    if (filterPeriod === '30days') {
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      periodMatch = paymentDate >= thirtyDaysAgo;
    } else if (filterPeriod === '3months') {
      const threeMonthsAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
      periodMatch = paymentDate >= threeMonthsAgo;
    } else if (filterPeriod === 'thisyear') {
      periodMatch = paymentDate.getFullYear() === now.getFullYear();
    }
    
    const projectMatch = filterProject === 'all' || payment.nom_projet === filterProject;
    
    return periodMatch && projectMatch;
  });

  // Obtenir la liste des projets uniques
  const uniqueProjects = Array.from(new Set(receivedPayments.map(p => p.nom_projet)));

  const handleExport = () => {
    console.log('Export payment history for technician');
    // TODO: Implémenter l'export
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Historique des Paiements Reçus</h3>
        <Button onClick={handleExport} variant="outline" size="sm" className="gap-2">
          <Download className="h-4 w-4" />
          Exporter
        </Button>
      </div>
      
      {/* Filtres */}
      <div className="flex gap-4">
        <div className="flex-1">
          <Select value={filterPeriod} onValueChange={setFilterPeriod}>
            <SelectTrigger>
              <SelectValue placeholder="Filtrer par période" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toutes les périodes</SelectItem>
              <SelectItem value="30days">30 derniers jours</SelectItem>
              <SelectItem value="3months">3 derniers mois</SelectItem>
              <SelectItem value="thisyear">Cette année</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div className="flex-1">
          <Select value={filterProject} onValueChange={setFilterProject}>
            <SelectTrigger>
              <SelectValue placeholder="Filtrer par projet" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les projets</SelectItem>
              {uniqueProjects.map(project => (
                <SelectItem key={project} value={project}>{project}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            Paiements Reçus ({filteredPayments.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filteredPayments.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Aucun paiement trouvé pour les critères sélectionnés</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredPayments.map((payment) => (
                <div 
                  key={payment.id_historique_paiement}
                  className="flex items-center justify-between p-4 rounded-lg border border-gray-200 bg-gray-50"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h4 className="font-medium">Ref: {payment.reference_paiement}</h4>
                      {getStatusBadge(payment.statut_justificatif)}
                      {getPaymentMethodBadge(payment.type_paiement)}
                    </div>
                    
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <FileText className="h-4 w-4" />
                        <span>{payment.nom_projet}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        <span>
                          {new Date(payment.date_paiement).toLocaleDateString('fr-FR', {
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric'
                          })}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <div className="text-lg font-semibold text-green-600">
                      {formatCurrency(payment.montant)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default TechnicienPaymentHistory;
