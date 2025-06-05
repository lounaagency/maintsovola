
import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar, User, MapPin, DollarSign, Phone, Receipt, CreditCard } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { JalonFinancement, PaiementTechnicien } from "@/types/financier";
import { PAYMENT_TYPES, PaymentType } from "@/types/paymentTypes";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { usePaymentActions } from "@/hooks/usePaymentActions";
import { useTechnicienPhoneNumbers } from "@/hooks/useTechnicienPhoneNumbers";
import ReceiptGenerator from "./ReceiptGenerator";

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
  const [typePaiement, setTypePaiement] = useState<PaymentType>(PAYMENT_TYPES.MOBILE_BANKING);
  const [numeroCheque, setNumeroCheque] = useState("");
  const [numeroMobileBanking, setNumeroMobileBanking] = useState("");
  
  const { sendPayment } = usePaymentActions();
  const { data: phoneNumbers } = useTechnicienPhoneNumbers(jalon?.id_technicien || '');

  React.useEffect(() => {
    if (jalon) {
      setMontant(jalon.montant_demande.toString());
      setReference(`PAY-${jalon.id_jalon_projet}-${Date.now()}`);
      setObservation("");
      setTypePaiement(PAYMENT_TYPES.MOBILE_BANKING);
      setNumeroCheque("");
      setNumeroMobileBanking("");
    }
  }, [jalon]);

  const handleReceiptGenerated = (pdfBlob: Blob) => {
    console.log('Receipt generated:', pdfBlob);
    // Ici on pourrait uploader le reçu vers Supabase Storage si nécessaire
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!jalon) return;

    // Validation selon le type de paiement
    if (typePaiement === PAYMENT_TYPES.MOBILE_BANKING && !numeroMobileBanking) {
      return;
    }
    if (typePaiement === PAYMENT_TYPES.CHEQUE && !numeroCheque) {
      return;
    }
    
    try {
      const paymentData: PaiementTechnicien = {
        id_jalon_projet: jalon.id_jalon_projet,
        montant: parseFloat(montant),
        reference_paiement: reference,
        observation: observation || undefined,
        date_limite: jalon.date_limite,
        type_paiement: typePaiement,
        numero_cheque: typePaiement === PAYMENT_TYPES.CHEQUE ? numeroCheque : undefined,
        numero_mobile_banking: typePaiement === PAYMENT_TYPES.MOBILE_BANKING ? numeroMobileBanking : undefined,
      };

      console.log('Submitting payment:', paymentData);
      await sendPayment.mutateAsync(paymentData);
      onClose();
    } catch (error) {
      console.error('Payment error:', error);
    }
  };

  if (!jalon) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
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
            <Label htmlFor="typePaiement">Type de règlement</Label>
            <Select value={typePaiement} onValueChange={(value: PaymentType) => setTypePaiement(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={PAYMENT_TYPES.MOBILE_BANKING}>
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4" />
                    Mobile Banking
                  </div>
                </SelectItem>
                <SelectItem value={PAYMENT_TYPES.CHEQUE}>
                  <div className="flex items-center gap-2">
                    <CreditCard className="h-4 w-4" />
                    Chèque de banque
                  </div>
                </SelectItem>
                <SelectItem value={PAYMENT_TYPES.CASH}>
                  <div className="flex items-center gap-2">
                    <Receipt className="h-4 w-4" />
                    Liquide
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Section Mobile Banking */}
          {typePaiement === PAYMENT_TYPES.MOBILE_BANKING && (
            <div className="space-y-2">
              <Label htmlFor="numeroMobileBanking">Numéro Mobile Banking</Label>
              {phoneNumbers && phoneNumbers.length > 0 ? (
                <Select value={numeroMobileBanking} onValueChange={setNumeroMobileBanking}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner un numéro" />
                  </SelectTrigger>
                  <SelectContent>
                    {phoneNumbers.map((phone) => (
                      <SelectItem key={phone.id_telephone} value={phone.numero}>
                        {phone.numero} ({phone.type})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <div className="text-sm text-amber-600 bg-amber-50 p-3 rounded-md">
                  Aucun numéro Mobile Banking trouvé pour ce technicien. 
                  Le technicien doit ajouter un numéro avec le type 'mobile_banking' dans ses paramètres.
                </div>
              )}
            </div>
          )}

          {/* Section Chèque */}
          {typePaiement === PAYMENT_TYPES.CHEQUE && (
            <div className="space-y-2">
              <Label htmlFor="numeroCheque">Numéro de chèque</Label>
              <Input
                id="numeroCheque"
                value={numeroCheque}
                onChange={(e) => setNumeroCheque(e.target.value)}
                required
                placeholder="Ex: CHQ-123456789"
              />
            </div>
          )}

          {/* Section Liquide */}
          {typePaiement === PAYMENT_TYPES.CASH && (
            <ReceiptGenerator
              receiptData={{
                montant: parseFloat(montant) || 0,
                technicien_nom: `${jalon.technicien_nom} ${jalon.technicien_prenoms}`,
                nom_projet: jalon.nom_projet,
                reference_paiement: reference,
                date_paiement: new Date().toISOString(),
              }}
              onReceiptGenerated={handleReceiptGenerated}
            />
          )}

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
              disabled={
                sendPayment.isPending || 
                (typePaiement === PAYMENT_TYPES.MOBILE_BANKING && (!phoneNumbers || phoneNumbers.length === 0))
              }
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
