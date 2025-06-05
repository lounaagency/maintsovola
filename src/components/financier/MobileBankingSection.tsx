
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

  return (
    <div className="space-y-2">
      <Label htmlFor="numeroMobileBanking">Numéro Mobile Banking</Label>
      <Select value={numeroMobileBanking} onValueChange={setNumeroMobileBanking}>
        <SelectTrigger>
          <SelectValue placeholder={
            isLoading 
              ? "Chargement..." 
              : allPhoneNumbers && allPhoneNumbers.length > 0 
                ? "Sélectionner un numéro" 
                : "Aucun numéro disponible"
          } />
        </SelectTrigger>
        <SelectContent>
          {allPhoneNumbers && allPhoneNumbers.length > 0 ? (
            allPhoneNumbers.map((phone) => (
              <SelectItem key={phone.id_telephone} value={phone.numero}>
                {phone.numero} ({phone.type})
              </SelectItem>
            ))
          ) : (
            <SelectItem value="" disabled>
              Aucun numéro de téléphone trouvé pour {jalon.technicien_nom} {jalon.technicien_prenoms}
            </SelectItem>
          )}
        </SelectContent>
      </Select>
    </div>
  );
};

export default MobileBankingSection;
