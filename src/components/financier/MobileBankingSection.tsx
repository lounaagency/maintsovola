
import React from "react";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { JalonFinancement } from "@/types/financier";
import { useAllTechnicienPhoneNumbers } from "@/hooks/useAllTechnicienPhoneNumbers";
import { PHONE_TYPES } from "@/types/paymentTypes";

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

  console.log('All phone numbers for technicien:', allPhoneNumbers);

  // Filtrer pour ne garder que les numéros Mobile Banking
  // Utiliser un OU logique : est_mobile_banking === true OU type spécifique mobile banking
  const mobileBankingNumbers = allPhoneNumbers?.filter(phone => {
    const isMarkedAsMobileBanking = phone.est_mobile_banking === true;
    const isSpecificMobileBankingType = phone.type === PHONE_TYPES.MVOLA ||
                                       phone.type === PHONE_TYPES.ORANGE_MONEY ||
                                       phone.type === PHONE_TYPES.AIRTEL_MONEY ||
                                       phone.type === PHONE_TYPES.MOBILE_BANKING;
    
    const isValidMobileBanking = isMarkedAsMobileBanking || isSpecificMobileBankingType;
    
    console.log(`Phone ${phone.numero}: est_mobile_banking=${phone.est_mobile_banking}, type=${phone.type}, isValid=${isValidMobileBanking}`);
    
    return isValidMobileBanking;
  }) || [];

  console.log('Filtered mobile banking numbers:', mobileBankingNumbers);

  if (mobileBankingNumbers.length === 0) {
    return (
      <div className="space-y-2">
        <Label htmlFor="numeroMobileBanking">Numéro Mobile Banking</Label>
        <div className="text-sm text-destructive">
          Aucun numéro Mobile Banking trouvé pour {jalon.technicien_nom} {jalon.technicien_prenoms}
        </div>
      </div>
    );
  }

  // Fonction pour formater l'affichage du type
  const formatPhoneType = (type: string) => {
    switch (type) {
      case PHONE_TYPES.MVOLA:
        return 'MVola';
      case PHONE_TYPES.ORANGE_MONEY:
        return 'Orange Money';
      case PHONE_TYPES.AIRTEL_MONEY:
        return 'Airtel Money';
      case PHONE_TYPES.MOBILE_BANKING:
        return 'Mobile Banking';
      default:
        return type;
    }
  };

  return (
    <div className="space-y-2">
      <Label htmlFor="numeroMobileBanking">Numéro Mobile Banking</Label>
      <Select value={numeroMobileBanking} onValueChange={setNumeroMobileBanking}>
        <SelectTrigger>
          <SelectValue placeholder="Sélectionner un numéro" />
        </SelectTrigger>
        <SelectContent>
          {mobileBankingNumbers.map((phone) => (
            <SelectItem key={phone.id_telephone} value={phone.numero}>
              {phone.numero} ({formatPhoneType(phone.type)})
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};

export default MobileBankingSection;
