
import React from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Phone, CreditCard, Receipt } from "lucide-react";
import { PAYMENT_TYPES, PaymentType } from "@/types/paymentTypes";

interface PaymentFormFieldsProps {
  montant: string;
  setMontant: (value: string) => void;
  reference: string;
  setReference: (value: string) => void;
  typePaiement: PaymentType;
  setTypePaiement: (value: PaymentType) => void;
  observation: string;
  setObservation: (value: string) => void;
}

const PaymentFormFields: React.FC<PaymentFormFieldsProps> = ({
  montant,
  setMontant,
  reference,
  setReference,
  typePaiement,
  setTypePaiement,
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

export default PaymentFormFields;
