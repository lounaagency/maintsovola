
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
  console.log('🏦 MobileBankingSection - Jalon data:', jalon);
  console.log('🏦 MobileBankingSection - Technicien ID from jalon:', jalon.id_technicien);
  
  const { data: allPhoneNumbers, isLoading } = useAllTechnicienPhoneNumbers(jalon.id_technicien);
  
  console.log('🏦 MobileBankingSection - Phone numbers received:', allPhoneNumbers);

  if (isLoading) {
    return (
      <div className="space-y-2">
        <Label htmlFor="numeroMobileBanking">Numéro Mobile Banking</Label>
        <div className="text-sm text-muted-foreground">Chargement des numéros...</div>
      </div>
    );
  }

  // Filtrer pour ne garder que les numéros Mobile Banking
  const mobileBankingNumbers = allPhoneNumbers?.filter(phone => {
    const isMobileBanking = phone.est_mobile_banking === true || (
      phone.type === PHONE_TYPES.MVOLA ||
      phone.type === PHONE_TYPES.ORANGE_MONEY ||
      phone.type === PHONE_TYPES.AIRTEL_MONEY ||
      phone.type === PHONE_TYPES.MOBILE_BANKING
    );
    
    console.log(`📱 Phone ${phone.numero} (type: ${phone.type}, est_mobile_banking: ${phone.est_mobile_banking}) - Is mobile banking: ${isMobileBanking}`);
    
    return isMobileBanking;
  }) || [];
  
  console.log('🏦 Filtered mobile banking numbers:', mobileBankingNumbers);

  if (mobileBankingNumbers.length === 0) {
    return (
      <div className="space-y-2">
        <Label htmlFor="numeroMobileBanking">Numéro Mobile Banking</Label>
        <div className="text-sm text-destructive">
          Aucun numéro Mobile Banking trouvé pour {jalon.technicien_nom} {jalon.technicien_prenoms} (ID: {jalon.id_technicien})
        </div>
      </div>
    );
  }

  const getDisplayType = (type: string) => {
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
              {phone.numero} ({getDisplayType(phone.type)})
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};

export default MobileBankingSection;
