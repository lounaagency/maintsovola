
import React from "react";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Phone, CreditCard, Receipt } from "lucide-react";

interface PaymentTypeSelectorProps {
  typePaiement: 'Mobile Banking' | 'Chèque de banque' | 'Liquide';
  setTypePaiement: (value: 'Mobile Banking' | 'Chèque de banque' | 'Liquide') => void;
}

const PaymentTypeSelector: React.FC<PaymentTypeSelectorProps> = ({
  typePaiement,
  setTypePaiement
}) => {
  return (
    <div className="space-y-2">
      <Label htmlFor="typePaiement">Type de règlement</Label>
      <Select value={typePaiement} onValueChange={(value: any) => setTypePaiement(value)}>
        <SelectTrigger>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="Mobile Banking">
            <div className="flex items-center gap-2">
              <Phone className="h-4 w-4" />
              Mobile Banking
            </div>
          </SelectItem>
          <SelectItem value="Chèque de banque">
            <div className="flex items-center gap-2">
              <CreditCard className="h-4 w-4" />
              Chèque de banque
            </div>
          </SelectItem>
          <SelectItem value="Liquide">
            <div className="flex items-center gap-2">
              <Receipt className="h-4 w-4" />
              Liquide
            </div>
          </SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
};

export default PaymentTypeSelector;
