
import React from "react";
import { JalonFinancement } from "@/types/financier";
import ReceiptGenerator from "./ReceiptGenerator";

interface CashSectionProps {
  jalon: JalonFinancement;
  montant: string;
  reference: string;
  onReceiptGenerated: (pdfBlob: Blob) => void;
}

const CashSection: React.FC<CashSectionProps> = ({
  jalon,
  montant,
  reference,
  onReceiptGenerated
}) => {
  return (
    <ReceiptGenerator
      receiptData={{
        montant: parseFloat(montant) || 0,
        technicien_nom: `${jalon.technicien_nom} ${jalon.technicien_prenoms}`,
        nom_projet: jalon.nom_projet,
        reference_paiement: reference,
        date_paiement: new Date().toISOString(),
      }}
      onReceiptGenerated={onReceiptGenerated}
    />
  );
};

export default CashSection;
