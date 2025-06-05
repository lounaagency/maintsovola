
import React from "react";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TechnicienMobileBanking, JalonFinancement } from "@/types/financier";

interface MobileBankingSectionProps {
  jalon: JalonFinancement;
  phoneNumbers: TechnicienMobileBanking[] | undefined;
  numeroMobileBanking: string;
  setNumeroMobileBanking: (value: string) => void;
}

const MobileBankingSection: React.FC<MobileBankingSectionProps> = ({
  jalon,
  phoneNumbers,
  numeroMobileBanking,
  setNumeroMobileBanking
}) => {
  return (
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
          Aucun numéro Mobile Banking trouvé pour le technicien {jalon.technicien_nom} {jalon.technicien_prenoms}. 
          Ce dernier doit ajouter un numéro avec le type 'mobile_banking' dans ses paramètres.
        </div>
      )}
    </div>
  );
};

export default MobileBankingSection;
