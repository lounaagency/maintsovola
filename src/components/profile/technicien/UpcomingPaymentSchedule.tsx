
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatCurrency } from '@/lib/utils';
import { Calendar, MapPin } from 'lucide-react';

interface UpcomingPayment {
  id_jalon_projet: number;
  projet_titre: string;
  jalon_nom: string;
  date_previsionnelle: string;
  montant: number;
  statut: string;
}

interface UpcomingPaymentScheduleProps {
  upcomingPayments: UpcomingPayment[];
}

const UpcomingPaymentSchedule: React.FC<UpcomingPaymentScheduleProps> = ({ upcomingPayments }) => {
  const getStatusBadge = (statut: string) => {
    switch (statut) {
      case 'Prévu':
        return <Badge variant="outline" className="text-blue-600">Prévu</Badge>;
      case 'En cours':
        return <Badge variant="default" className="bg-orange-100 text-orange-700">En cours</Badge>;
      default:
        return <Badge variant="secondary">{statut}</Badge>;
    }
  };

  const isThisWeek = (date: string) => {
    const paymentDate = new Date(date);
    const now = new Date();
    const oneWeekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    return paymentDate <= oneWeekFromNow;
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Planning des Paiements Prévus</h3>
      
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Prochains Jalons de Paiement</CardTitle>
        </CardHeader>
        <CardContent>
          {upcomingPayments.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Aucun paiement prévu pour le moment</p>
            </div>
          ) : (
            <div className="space-y-4">
              {upcomingPayments.slice(0, 10).map((payment) => (
                <div 
                  key={payment.id_jalon_projet}
                  className={`flex items-center justify-between p-4 rounded-lg border ${
                    isThisWeek(payment.date_previsionnelle) 
                      ? 'border-blue-200 bg-blue-50' 
                      : 'border-gray-200 bg-gray-50'
                  }`}
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h4 className="font-medium">{payment.jalon_nom}</h4>
                      {getStatusBadge(payment.statut)}
                      {isThisWeek(payment.date_previsionnelle) && (
                        <Badge variant="default" className="bg-blue-100 text-blue-700">
                          Cette semaine
                        </Badge>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <MapPin className="h-4 w-4" />
                        <span>{payment.projet_titre}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        <span>
                          {new Date(payment.date_previsionnelle).toLocaleDateString('fr-FR', {
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
              
              {upcomingPayments.length > 10 && (
                <div className="text-center text-sm text-muted-foreground pt-4">
                  +{upcomingPayments.length - 10} autres paiements prévus
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default UpcomingPaymentSchedule;
