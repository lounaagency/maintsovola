
import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Calendar, User, MapPin, DollarSign } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { JalonFinancement } from "@/types/financier";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { usePaymentActions } from "@/hooks/usePaymentActions";

interface SendPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  jalon: JalonFinancement | null;
}

const SendPaymentModal: React.FC<SendPaymentModalProps> = ({
  isOpen,
  onClose,
  jalon
}) => {
  const [montant, setMontant] = useState("");
  const [reference, setReference] = useState("");
  const [observation, setObservation] = useState("");
  
  const { sendPayment } = usePaymentActions();

  React.useEffect(() => {
    if (jalon) {
      setMontant(jalon.montant_demande.toString());
      setReference(`PAY-${jalon.id_jalon_projet}-${Date.now()}`);
      setObservation("");
    }
  }, [jalon]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!jalon) return;
    
    try {
      await sendPayment.mutateAsync({
        id_jalon_projet: jalon.id_jalon_projet,
        montant: parseFloat(montant),
        reference_paiement: reference,
        observation: observation || undefined,
        date_limite: jalon.date_limite,
      });
      
      onClose();
    } catch (error) {
      // L'erreur est gérée dans le hook
      console.error('Payment error:', error);
    }
  };

  if (!jalon) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Envoyer Paiement - {jalon.nom_jalon}</DialogTitle>
        </DialogHeader>

        <Card className="mb-4">
          <CardContent className="pt-4 space-y-3">
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">
                {jalon.technicien_nom} {jalon.technicien_prenoms}
              </span>
            </div>
            
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              <span>{jalon.nom_projet} ({jalon.surface_ha} ha)</span>
            </div>
            
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span>
                Échéance: {format(new Date(jalon.date_limite), 'dd MMMM yyyy', { locale: fr })}
              </span>
            </div>
            
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-muted-foreground" />
              <span className="font-bold text-green-600">
                Montant demandé: {formatCurrency(jalon.montant_demande)}
              </span>
            </div>
          </CardContent>
        </Card>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="montant">Montant à envoyer</Label>
            <Input
              id="montant"
              type="number"
              step="0.01"
              value={montant}
              onChange={(e) => setMontant(e.target.value)}
              required
              min="0"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="reference">Référence de paiement</Label>
            <Input
              id="reference"
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              required
              placeholder="REF-PAYMENT-..."
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="observation">Observation (optionnel)</Label>
            <Textarea
              id="observation"
              value={observation}
              onChange={(e) => setObservation(e.target.value)}
              placeholder="Notes ou commentaires sur ce paiement..."
              rows={3}
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Annuler
            </Button>
            <Button 
              type="submit" 
              disabled={sendPayment.isPending}
              className="gap-2"
            >
              {sendPayment.isPending ? (
                "Envoi en cours..."
              ) : (
                <>
                  <DollarSign className="h-4 w-4" />
                  Envoyer {formatCurrency(parseFloat(montant) || 0)}
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default SendPaymentModal;
