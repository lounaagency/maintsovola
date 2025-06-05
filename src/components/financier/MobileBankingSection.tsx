
import React from "react";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { TechnicienMobileBanking } from "@/types/financier";

interface MobileBankingSectionProps {
  mobileBankingNumbers: TechnicienMobileBanking[];
  numeroMobileBanking: string;
  setNumeroMobileBanking: (value: string) => void;
  saisieManuelle: boolean;
  setSaisieManuelle: (value: boolean) => void;
  numeroManuel: string;
  setNumeroManuel: (value: string) => void;
}

const MobileBankingSection: React.FC<MobileBankingSectionProps> = ({
  mobileBankingNumbers,
  numeroMobileBanking,
  setNumeroMobileBanking,
  saisieManuelle,
  setSaisieManuelle,
  numeroManuel,
  setNumeroManuel
}) => {
  return (
    <div className="space-y-3">
      <Label htmlFor="numeroMobileBanking">Numéro Mobile Banking</Label>
      
      {mobileBankingNumbers && mobileBankingNumbers.length > 0 && !saisieManuelle ? (
        <Select value={numeroMobileBanking} onValueChange={setNumeroMobileBanking}>
          <SelectTrigger>
            <SelectValue placeholder="Sélectionner un numéro" />
          </SelectTrigger>
          <SelectContent>
            {mobileBankingNumbers.map((phone) => (
              <SelectItem key={phone.id_telephone} value={phone.numero}>
                {phone.numero} ({phone.type})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      ) : null}

      {(mobileBankingNumbers.length === 0 || saisieManuelle) && (
        <div className="space-y-3">
          <div className="flex items-center space-x-2">
            <Checkbox 
              id="saisieManuelle" 
              checked={saisieManuelle}
              onCheckedChange={(checked) => setSaisieManuelle(checked as boolean)}
            />
            <Label htmlFor="saisieManuelle" className="text-sm">
              Saisir manuellement le numéro Mobile Banking
            </Label>
          </div>
          
          {(mobileBankingNumbers.length === 0 || saisieManuelle) && (
            <Input
              id="numeroManuel"
              value={numeroManuel}
              onChange={(e) => setNumeroManuel(e.target.value)}
              placeholder="Ex: +261 34 12 345 67"
              required
            />
          )}
        </div>
      )}

      {mobileBankingNumbers.length > 0 && !saisieManuelle && (
        <div className="flex items-center space-x-2 mt-2">
          <Checkbox 
            id="saisieManuelle" 
            checked={saisieManuelle}
            onCheckedChange={(checked) => setSaisieManuelle(checked as boolean)}
          />
          <Label htmlFor="saisieManuelle" className="text-sm">
            Saisir un autre numéro manuellement
          </Label>
        </div>
      )}
    </div>
  );
};

export default MobileBankingSection;
