
import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DollarSign } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { JalonFinancement, PaiementTechnicien } from "@/types/financier";
import { usePaymentActions } from "@/hooks/usePaymentActions";
import { useTechnicienPhoneNumbers } from "@/hooks/useTechnicienPhoneNumbers";
import ReceiptGenerator from "./ReceiptGenerator";
import JalonInfoCard from "./JalonInfoCard";
import PaymentDetailsForm from "./PaymentDetailsForm";
import PaymentTypeSelector from "./PaymentTypeSelector";
import MobileBankingSection from "./MobileBankingSection";

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
  const [typePaiement, setTypePaiement] = useState<'Mobile Banking' | 'Chèque de banque' | 'Liquide'>('Mobile Banking');
  const [numeroCheque, setNumeroCheque] = useState("");
  const [numeroMobileBanking, setNumeroMobileBanking] = useState("");
  const [saisieManuelle, setSaisieManuelle] = useState(false);
  const [numeroManuel, setNumeroManuel] = useState("");
  
  const { sendPayment } = usePaymentActions();
  const { data: phoneData } = useTechnicienPhoneNumbers(jalon?.id_technicien || '');

  const mobileBankingNumbers = phoneData?.mobileBankingNumbers || [];
  const allNumbers = phoneData?.allNumbers || [];
  const defaultNumber = allNumbers.find(phone => phone.type === 'principal')?.numero || 
                       allNumbers[0]?.numero || '';

  React.useEffect(() => {
    if (jalon) {
      setMontant(jalon.montant_demande.toString());
      setReference(`PAY-${jalon.id_jalon_projet}-${Date.now()}`);
      setObservation("");
      setTypePaiement('Mobile Banking');
      setNumeroCheque("");
      setNumeroMobileBanking("");
      setSaisieManuelle(false);
      setNumeroManuel(defaultNumber);
    }
  }, [jalon, defaultNumber]);

  const handleReceiptGenerated = (pdfBlob: Blob) => {
    console.log('Receipt generated:', pdfBlob);
    // Ici on pourrait uploader le reçu vers Supabase Storage si nécessaire
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!jalon) return;

    // Validation selon le type de paiement
    if (typePaiement === 'Mobile Banking') {
      const numeroFinal = saisieManuelle ? numeroManuel : numeroMobileBanking;
      if (!numeroFinal) {
        return;
      }
    }
    if (typePaiement === 'Chèque de banque' && !numeroCheque) {
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
        numero_cheque: typePaiement === 'Chèque de banque' ? numeroCheque : undefined,
        numero_mobile_banking: typePaiement === 'Mobile Banking' ? (saisieManuelle ? numeroManuel : numeroMobileBanking) : undefined,
      };

      await sendPayment.mutateAsync(paymentData);
      onClose();
    } catch (error) {
      console.error('Payment error:', error);
    }
  };

  if (!jalon) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent 
        className="sm:max-w-lg max-h-[90vh] overflow-y-auto"
        aria-describedby="id-element-description"
      >
        <DialogHeader>
          <DialogTitle>Envoyer Paiement - {jalon.nom_jalon}</DialogTitle>
          <div id="id-element-description" className="sr-only">
            Formulaire de paiement pour envoyer des fonds à un technicien dans le cadre d'un jalon de projet agricole. Vous pouvez sélectionner le type de paiement et saisir les détails nécessaires.
          </div>
        </DialogHeader>

        <JalonInfoCard jalon={jalon} />

        <form onSubmit={handleSubmit} className="space-y-4">
          <PaymentDetailsForm
            montant={montant}
            setMontant={setMontant}
            reference={reference}
            setReference={setReference}
            observation={observation}
            setObservation={setObservation}
          />

          <PaymentTypeSelector
            typePaiement={typePaiement}
            setTypePaiement={setTypePaiement}
          />

          {/* Section Mobile Banking */}
          {typePaiement === 'Mobile Banking' && (
            <MobileBankingSection
              mobileBankingNumbers={mobileBankingNumbers}
              numeroMobileBanking={numeroMobileBanking}
              setNumeroMobileBanking={setNumeroMobileBanking}
              saisieManuelle={saisieManuelle}
              setSaisieManuelle={setSaisieManuelle}
              numeroManuel={numeroManuel}
              setNumeroManuel={setNumeroManuel}
            />
          )}

          {/* Section Chèque */}
          {typePaiement === 'Chèque de banque' && (
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
          {typePaiement === 'Liquide' && (
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
