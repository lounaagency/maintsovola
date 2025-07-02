
import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { DollarSign } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { JalonFinancement, PaiementTechnicien } from "@/types/financier";
import { PAYMENT_TYPES, PaymentType } from "@/types/paymentTypes";
import { usePaymentActions } from "@/hooks/usePaymentActions";
import PaymentSummaryCard from "./PaymentSummaryCard";
import PaymentFormFields from "./PaymentFormFields";
import MobileBankingSection from "./MobileBankingSection";
import ChequeSection from "./ChequeSection";
import CashSection from "./CashSection";
import useMvola from "@/hooks/use-mvola";

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
  const { sendPaymentToMvola, loading: isMvolaLoading } = useMvola();
  const { toast } = useToast();

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
    console.log("Reçu généré:", pdfBlob);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!jalon) return;

    if (typePaiement === PAYMENT_TYPES.MOBILE_BANKING && !numeroMobileBanking) {
      toast({ title: "Erreur", description: "Veuillez sélectionner un numéro Mobile Banking." });
      return;
    }
    if (typePaiement === PAYMENT_TYPES.CHEQUE && !numeroCheque) {
      toast({ title: "Erreur", description: "Veuillez entrer un numéro de chèque." });
      return;
    }
    
    try {
      // Si Mobile Banking, appeler MVola
      if (typePaiement === PAYMENT_TYPES.MOBILE_BANKING) {
        const response = await sendPaymentToMvola({
          amount: montant,
          phoneNumber: numeroMobileBanking,
          description: `Paiement - ${jalon.nom_jalon}`,
          merchantId: import.meta.env.VITE_MERCHANT_ID,
          investmentId: jalon.id_jalon_projet,
        });

        if (!response || response.status !== 200) {
          throw new Error("Échec de l'envoi via MVola");
        }
      }

      // Toujours enregistrer dans Supabase après succès MVola
      const paymentData: PaiementTechnicien = {
        id_jalon_projet: jalon.id_jalon_projet,
        montant: parseFloat(montant),
        reference_paiement: reference,
        observation: observation || undefined,
        date_previsionnelle: jalon.date_previsionnelle,
        type_paiement: typePaiement,
        numero_cheque: typePaiement === PAYMENT_TYPES.CHEQUE ? numeroCheque : undefined,
        numero_mobile_banking: typePaiement === PAYMENT_TYPES.MOBILE_BANKING ? numeroMobileBanking : undefined,
      };

      console.log("Envoi du paiement :", paymentData);
      await sendPayment.mutateAsync(paymentData);
      toast({ title: "Succès", description: "Paiement effectué et enregistré." });
      onClose();
    } catch (error: any) {
      console.error("Erreur lors du paiement :", error);
      toast({
        title: "Erreur",
        description: error.message || "Impossible de traiter le paiement.",
      });
    }
  };

  if (!jalon) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Envoyer Paiement - {jalon.nom_jalon}</DialogTitle>
        </DialogHeader>

        <PaymentSummaryCard jalon={jalon} />

        <form onSubmit={handleSubmit} className="space-y-4">
          <PaymentFormFields
            montant={montant}
            setMontant={setMontant}
            reference={reference}
            setReference={setReference}
            typePaiement={typePaiement}
            setTypePaiement={setTypePaiement}
            observation={observation}
            setObservation={setObservation}
          />

          {typePaiement === PAYMENT_TYPES.MOBILE_BANKING && (
            <MobileBankingSection
              technicienEmail={jalon.technicien_nom || ''}
              selectedNumber={numeroMobileBanking}
              setSelectedNumber={setNumeroMobileBanking}
            />
          )}

          {typePaiement === PAYMENT_TYPES.CHEQUE && (
            <ChequeSection
              numeroCheque={numeroCheque}
              setNumeroCheque={setNumeroCheque}
            />
          )}

          {typePaiement === PAYMENT_TYPES.CASH && (
            <CashSection
              jalon={jalon}
              montant={montant}
              reference={reference}
              onReceiptGenerated={handleReceiptGenerated}
            />
          )}

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Annuler
            </Button>
            <Button 
              type="submit" 
              disabled={sendPayment.isPending || isMvolaLoading}
              className="gap-2"
            >
              {sendPayment.isPending || isMvolaLoading ? (
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
