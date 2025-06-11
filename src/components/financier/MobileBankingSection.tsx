
import React from "react";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { JalonFinancement } from "@/types/financier";
import { useAllTechnicienPhoneNumbers } from "@/hooks/useAllTechnicienPhoneNumbers";

interface MobileBankingSectionProps {
  jalon: JalonFinancement;
  numeroMobileBanking: string;
  setNumeroMobileBanking: (value: string) => void;
}

const MobileBankingSection: React.FC<MobileBankingSectionProps> = ({
  jalon,
  numeroMobileBanking,
  setNumeroMobileBanking
}) => {
  const { data: allPhoneNumbers, isLoading } = useAllTechnicienPhoneNumbers(jalon.id_technicien);

  if (isLoading) {
    return (
      <div className="space-y-2">
        <Label htmlFor="numeroMobileBanking">Numéro Mobile Banking</Label>
        <div className="text-sm text-muted-foreground">Chargement des numéros...</div>
      </div>
    );
  }

  if (!allPhoneNumbers || allPhoneNumbers.length === 0) {
    return (
      <div className="space-y-2">
        <Label htmlFor="numeroMobileBanking">Numéro Mobile Banking</Label>
        <div className="text-sm text-destructive">
          Aucun numéro de téléphone trouvé pour {jalon.technicien_nom} {jalon.technicien_prenoms}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <Label htmlFor="numeroMobileBanking">Numéro Mobile Banking</Label>
      <Select value={numeroMobileBanking} onValueChange={setNumeroMobileBanking}>
        <SelectTrigger>
          <SelectValue placeholder="Sélectionner un numéro" />
        </SelectTrigger>
        <SelectContent>
          {allPhoneNumbers.map((phone) => (
            <SelectItem key={phone.id_telephone} value={phone.numero}>
              {phone.numero} ({phone.type})
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};

export default MobileBankingSection;
