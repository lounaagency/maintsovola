import React, { useState, useEffect } from "react";
import {
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui";
import { useTechnicienMobileBanking } from "@/hooks/useTechnicienMobileBanking";

interface MobileBankingSectionProps {
  technicienEmail: string;
  selectedNumber: string;
  setSelectedNumber: (value: string) => void;
}

const MobileBankingSection: React.FC<MobileBankingSectionProps> = ({
  technicienEmail,
  selectedNumber,
  setSelectedNumber
}) => {
  const {
    data: numbers,
    isLoading,
    isError,
  } = useTechnicienMobileBanking(technicienEmail);

  // Si chargement
  if (isLoading) {
    return (
      <div className="space-y-2">
        <Label htmlFor="numeroMobileBanking">Numéro Mobile Banking</Label>
        <p className="text-sm text-muted-foreground">Chargement des numéros...</p>
      </div>
    );
  }

  // Si erreur ou aucun numéro trouvé
  if (isError || !numbers || numbers.length === 0) {
    return (
      <div className="space-y-2">
        <Label htmlFor="numeroMobileBanking">Numéro Mobile Banking</Label>
        <p className="text-sm text-destructive">
          Aucun numéro Mobile Banking trouvé pour {technicienEmail}
        </p>
      </div>
    );
  }

  // Si un seul numéro, on le sélectionne automatiquement
  useEffect(() => {
    if (numbers && numbers.length === 1) {
      setSelectedNumber(numbers[0]);
    }
  }, [numbers, setSelectedNumber]);

  return (
    <div className="space-y-2">
      <Label htmlFor="numeroMobileBanking">Numéro Mobile Banking</Label>
      <Select value={selectedNumber} onValueChange={setSelectedNumber}>
        <SelectTrigger id="numeroMobileBanking">
          <SelectValue placeholder="Sélectionner un numéro" />
        </SelectTrigger>
        <SelectContent>
          {numbers.map((num, index) => (
            <SelectItem key={index} value={num}>
              {num}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <p className="text-xs text-muted-foreground">
        Sélectionnez le numéro à utiliser pour le paiement
      </p>
    </div>
  );
};

export default MobileBankingSection;
