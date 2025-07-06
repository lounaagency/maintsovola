
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { formatCurrency } from '@/lib/utils';
import { Clock, CheckCircle, AlertCircle, CreditCard } from 'lucide-react';
import { toast } from 'sonner';

interface PendingPayment {
  id_jalon_projet: number;
  projet_titre: string;
  jalon_nom: string;
  montant: number;
  date_previsionnelle: string;
  statut: string;
}

interface TechnicienPaymentActionsProps {
  pendingPayments: PendingPayment[];
  onPaymentRequest?: (jalonId: number) => void;
}

const TechnicienPaymentActions: React.FC<TechnicienPaymentActionsProps> = ({ 
  pendingPayments,
  onPaymentRequest 
}) => {
  const [requestingPayment, setRequestingPayment] = useState<number | null>(null);

  const handlePaymentRequest = async (jalon: PendingPayment) => {
    setRequestingPayment(jalon.id_jalon_projet);
    
    try {
      // Simulation d'une demande de paiement
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      toast.success(`Demande de paiement envoyée pour ${jalon.jalon_nom}`, {
        description: "Le responsable financier a été notifié de votre demande"
      });
      
      onPaymentRequest?.(jalon.id_jalon_projet);
    } catch (error) {
      toast.error("Erreur lors de l'envoi de la demande de paiement");
    } finally {
      setRequestingPayment(null);
    }
  };

  const getStatusBadge = (statut: string) => {
    switch (statut) {
      case 'Terminé':
        return (
          <Badge variant="default" className="bg-green-100 text-green-700">
            <CheckCircle className="h-3 w-3 mr-1" />
            Terminé
          </Badge>
        );
      case 'En cours':
        return (
          <Badge variant="default" className="bg-blue-100 text-blue-700">
            <Clock className="h-3 w-3 mr-1" />
            En cours
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="text-orange-600">
            <AlertCircle className="h-3 w-3 mr-1" />
            {statut}
          </Badge>
        );
    }
  };

  const eligiblePayments = pendingPayments.filter(payment => 
    payment.statut === 'Terminé' && payment.montant > 0
  );

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Actions de Paiement</h3>
      
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Demandes de Paiement Disponibles
          </CardTitle>
        </CardHeader>
        <CardContent>
          {eligiblePayments.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              <CreditCard className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Aucune demande de paiement disponible</p>
              <p className="text-sm mt-2">
                Terminez vos jalons pour pouvoir demander des paiements
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {eligiblePayments.map((payment) => (
                <div 
                  key={payment.id_jalon_projet}
                  className="flex items-center justify-between p-4 rounded-lg border border-gray-200 bg-gray-50"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h4 className="font-medium">{payment.jalon_nom}</h4>
                      {getStatusBadge(payment.statut)}
                    </div>
                    
                    <div className="text-sm text-muted-foreground">
                      <p className="font-medium">{payment.projet_titre}</p>
                      <p>
                        Terminé le {new Date(payment.date_previsionnelle).toLocaleDateString('fr-FR')}
                      </p>
                    </div>
                  </div>
                  
                  <div className="text-right flex items-center gap-4">
                    <div>
                      <div className="text-lg font-semibold text-green-600">
                        {formatCurrency(payment.montant)}
                      </div>
                    </div>
                    
                    <Button
                      onClick={() => handlePaymentRequest(payment)}
                      disabled={requestingPayment === payment.id_jalon_projet}
                      size="sm"
                      className="gap-2"
                    >
                      {requestingPayment === payment.id_jalon_projet ? (
                        <>
                          <Clock className="h-4 w-4 animate-spin" />
                          Demande...
                        </>
                      ) : (
                        <>
                          <CreditCard className="h-4 w-4" />
                          Demander le paiement
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              ))}
              
              <Separator className="my-4" />
              
              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="font-medium text-blue-900 mb-2">Information</h4>
                <p className="text-sm text-blue-700">
                  Vous pouvez demander le paiement uniquement pour les jalons terminés. 
                  Une fois votre demande envoyée, le responsable financier traitera votre paiement 
                  dans les plus brefs délais.
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default TechnicienPaymentActions;
