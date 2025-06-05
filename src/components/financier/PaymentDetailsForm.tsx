
import React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface PaymentDetailsFormProps {
  montant: string;
  setMontant: (value: string) => void;
  reference: string;
  setReference: (value: string) => void;
  observation: string;
  setObservation: (value: string) => void;
}

const PaymentDetailsForm: React.FC<PaymentDetailsFormProps> = ({
  montant,
  setMontant,
  reference,
  setReference,
  observation,
  setObservation
}) => {
  return (
    <>
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
    </>
  );
};

export default PaymentDetailsForm;
