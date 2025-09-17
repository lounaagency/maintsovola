
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { formatCurrency } from '@/lib/utils';
import { Clock, CheckCircle, AlertCircle, CreditCard, Hourglass } from 'lucide-react';
import { toast } from 'sonner';
import { useTechnicienPaymentRequests } from '@/hooks/useTechnicienPaymentRequests';
import { useAuth } from '@/contexts/AuthContext';

interface PendingPayment {
  id_jalon_projet: number;
  projet_titre: string;
  jalon_nom: string;
  montant: number | null;
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
  const { requestPayment, loading } = useTechnicienPaymentRequests();
  const { user } = useAuth();

  const handlePaymentRequest = async (jalon: PendingPayment) => {
    if (!user?.id) {
      toast.error("Utilisateur non authentifié");
      return;
    }

    setRequestingPayment(jalon.id_jalon_projet);
    
    try {
      await requestPayment(jalon.id_jalon_projet, user.id);
      onPaymentRequest?.(jalon.id_jalon_projet);
      
      // Plus besoin de recharger la page - les données se mettront à jour automatiquement
      toast.success("Demande de paiement envoyée avec succès");
    } catch (error) {
      console.error('Error requesting payment:', error);
    } finally {
      setRequestingPayment(null);
    }
  };

  const getStatusBadge = (statut: string) => {
    switch (statut) {
      case 'Prévu':
        return (
          <Badge variant="outline" className="text-blue-600 border-blue-200">
            <Clock className="h-3 w-3 mr-1" />
            Prévu
          </Badge>
        );
      case 'En attente de paiement':
        return (
          <Badge variant="default" className="bg-orange-100 text-orange-700">
            <Hourglass className="h-3 w-3 mr-1" />
            En attente de paiement
          </Badge>
        );
      case 'Payé':
        return (
          <Badge variant="default" className="bg-green-100 text-green-700">
            <CheckCircle className="h-3 w-3 mr-1" />
            Payé
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="text-gray-600">
            <AlertCircle className="h-3 w-3 mr-1" />
            {statut}
          </Badge>
        );
    }
  };

  // Séparer les jalons par statut - conditions simplifiées
  const jalonsPrevus = pendingPayments.filter(payment => 
    payment.statut === 'Prévu'
  );

  const jalonsEnAttentePaiement = pendingPayments.filter(payment => 
    payment.statut === 'En attente de paiement'
  );

  const jalonsPayes = pendingPayments.filter(payment => 
    payment.statut === 'Payé'
  );

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Actions de Paiement</h3>
      
      {/* Jalons prêts pour demande de paiement */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Jalons Éligibles pour Demande de Paiement
          </CardTitle>
        </CardHeader>
        <CardContent>
          {jalonsPrevus.length === 0 ? (
            <div className="text-center text-muted-foreground py-4">
              <CreditCard className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>Aucun jalon éligible pour demande de paiement</p>
            </div>
          ) : (
            <div className="space-y-3">
              {jalonsPrevus.map((payment) => (
                <div 
                  key={payment.id_jalon_projet}
                  className="flex items-center justify-between p-3 rounded-lg border border-blue-200 bg-blue-50"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-medium">{payment.jalon_nom}</h4>
                      {getStatusBadge(payment.statut)}
                    </div>
                    
                    <div className="text-sm text-muted-foreground">
                      <p className="font-medium">{payment.projet_titre}</p>
                      <p>Prévu pour le {new Date(payment.date_previsionnelle).toLocaleDateString('fr-FR')}</p>
                    </div>
                  </div>
                  
                  <div className="text-right flex items-center gap-4">
                    <div>
                      {payment.montant && payment.montant > 0 ? (
                        <div className="text-lg font-semibold text-green-600">
                          {formatCurrency(payment.montant)}
                        </div>
                      ) : (
                        <Badge variant="outline" className="text-amber-600 border-amber-200">
                          Montant à définir
                        </Badge>
                      )}
                    </div>
                    
                    <Button
                      onClick={() => handlePaymentRequest(payment)}
                      disabled={requestingPayment === payment.id_jalon_projet || loading}
                      size="sm"
                      className="gap-2"
                      variant={payment.montant && payment.montant > 0 ? "default" : "outline"}
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
            </div>
          )}
        </CardContent>
      </Card>

      {/* Jalons en attente de paiement */}
      {jalonsEnAttentePaiement.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Hourglass className="h-5 w-5" />
              Demandes de Paiement en Cours
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {jalonsEnAttentePaiement.map((payment) => (
                <div 
                  key={payment.id_jalon_projet}
                  className="flex items-center justify-between p-3 rounded-lg border border-orange-200 bg-orange-50"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-medium">{payment.jalon_nom}</h4>
                      {getStatusBadge(payment.statut)}
                    </div>
                    
                    <div className="text-sm text-muted-foreground">
                      <p className="font-medium">{payment.projet_titre}</p>
                      <p>Demande en cours de traitement</p>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <div className="text-lg font-semibold text-orange-600">
                      {formatCurrency(payment.montant || 0)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Jalons payés */}
      {jalonsPayes.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <CheckCircle className="h-5 w-5" />
              Jalons Payés - Prêts à Démarrer
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {jalonsPayes.map((payment) => (
                <div 
                  key={payment.id_jalon_projet}
                  className="flex items-center justify-between p-3 rounded-lg border border-green-200 bg-green-50"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-medium">{payment.jalon_nom}</h4>
                      {getStatusBadge(payment.statut)}
                    </div>
                    
                    <div className="text-sm text-muted-foreground">
                      <p className="font-medium">{payment.projet_titre}</p>
                      <p>Paiement reçu - Vous pouvez commencer les activités</p>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <div className="text-lg font-semibold text-green-600">
                      {formatCurrency(payment.montant || 0)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
      
      <Separator className="my-4" />
      
      <div className="bg-blue-50 p-4 rounded-lg">
        <h4 className="font-medium text-blue-900 mb-2">Nouveau Processus de Paiement</h4>
        <p className="text-sm text-blue-700">
          1. <strong>Demandez le paiement</strong> pour tous les jalons prévus, même sans montant défini<br/>
          2. <strong>Attendez la validation</strong> du responsable financier<br/>
          3. <strong>Commencez les activités</strong> une fois le paiement reçu<br/>
          4. Les montants sont calculés automatiquement selon les coûts de référence et la surface
        </p>
      </div>
    </div>
  );
};

export default TechnicienPaymentActions;
