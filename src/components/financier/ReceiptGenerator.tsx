
import React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Download, FileText } from "lucide-react";
import { ReceiptData } from "@/types/financier";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { formatCurrency } from "@/lib/utils";
import jsPDF from "jspdf";

interface ReceiptGeneratorProps {
  receiptData: ReceiptData;
  onReceiptGenerated: (pdfBlob: Blob) => void;
}

const ReceiptGenerator: React.FC<ReceiptGeneratorProps> = ({
  receiptData,
  onReceiptGenerated
}) => {
  const generatePDF = () => {
    const doc = new jsPDF();
    
    // En-tête
    doc.setFontSize(20);
    doc.text('REÇU DE PAIEMENT', 105, 30, { align: 'center' });
    
    doc.setFontSize(12);
    doc.text('MAINTSOVOLA', 105, 45, { align: 'center' });
    doc.text('Plateforme de Financement Agricole', 105, 55, { align: 'center' });
    
    // Ligne de séparation
    doc.line(20, 65, 190, 65);
    
    // Informations du reçu
    doc.setFontSize(14);
    doc.text('DÉTAILS DU PAIEMENT', 20, 80);
    
    doc.setFontSize(12);
    doc.text(`Référence: ${receiptData.reference_paiement}`, 20, 95);
    doc.text(`Date: ${format(new Date(receiptData.date_paiement), 'dd MMMM yyyy', { locale: fr })}`, 20, 105);
    doc.text(`Bénéficiaire: ${receiptData.technicien_nom}`, 20, 115);
    doc.text(`Projet: ${receiptData.nom_projet}`, 20, 125);
    
    // Montant en évidence
    doc.setFontSize(16);
    doc.text(`Montant: ${formatCurrency(receiptData.montant)}`, 20, 145);
    
    // Mentions légales
    doc.setFontSize(10);
    doc.text('Ce reçu atteste du paiement en liquide effectué.', 20, 170);
    doc.text('Pour toute réclamation, veuillez contacter le service financier.', 20, 180);
    
    // Signature
    doc.text('Signature du bénéficiaire:', 120, 200);
    doc.line(120, 210, 180, 210);
    
    // Génération du blob
    const pdfBlob = doc.output('blob');
    onReceiptGenerated(pdfBlob);
    
    // Téléchargement automatique
    doc.save(`recu_${receiptData.reference_paiement}.pdf`);
  };

  return (
    <Card className="mt-4">
      <CardContent className="pt-4">
        <div className="flex items-center gap-3 mb-4">
          <FileText className="h-5 w-5 text-blue-600" />
          <span className="font-medium">Génération du reçu de paiement</span>
        </div>
        
        <div className="space-y-2 text-sm text-muted-foreground mb-4">
          <p>• Un reçu PDF sera généré automatiquement</p>
          <p>• Le document sera téléchargé sur votre appareil</p>
          <p>• Une copie sera archivée dans le système</p>
        </div>
        
        <Button
          onClick={generatePDF}
          className="w-full gap-2"
          variant="outline"
        >
          <Download className="h-4 w-4" />
          Aperçu et génération du reçu
        </Button>
      </CardContent>
    </Card>
  );
};

export default ReceiptGenerator;
