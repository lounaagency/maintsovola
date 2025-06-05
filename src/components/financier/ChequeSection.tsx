
import React from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

interface ChequeSectionProps {
  numeroCheque: string;
  setNumeroCheque: (value: string) => void;
}

const ChequeSection: React.FC<ChequeSectionProps> = ({
  numeroCheque,
  setNumeroCheque
}) => {
  return (
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
  );
};

export default ChequeSection;
