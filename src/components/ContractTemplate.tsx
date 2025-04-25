
import React from 'react';
import { Button } from "@/components/ui/button";
import { FileText } from "lucide-react";
import { jsPDF } from "jspdf";
import autoTable from 'jspdf-autotable';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface ContractTemplateProps {
  project: any;
  className?: string;
}

const ContractTemplate: React.FC<ContractTemplateProps> = ({ project, className }) => {
  const generatePDF = async () => {
    const doc = new jsPDF();
    const currentYear = new Date().getFullYear();
    
    // Add title
    doc.setFontSize(16);
    doc.text('CONTRAT DE MISE EN VALEUR AGRICOLE À TITRE EXCLUSIF', 105, 20, { align: 'center' });
    doc.setFontSize(12);
    doc.text(`CAMPAGNE CULTURALE ${currentYear}`, 105, 30, { align: 'center' });
    
    doc.setFontSize(10);

    // Parties
    doc.text('ENTRE :', 20, 45);
    doc.text('La Société MAINTSO VOLA S.A.', 20, 55);
    
    doc.text('ET :', 20, 70);
    doc.text(`${project.tantsaha?.nom} ${project.tantsaha?.prenoms}`, 20, 80);
    
    // Article 1
    doc.setFontSize(12);
    doc.text('ARTICLE 1 – OBJET', 20, 100);
    doc.setFontSize(10);
    const cultures = project.projet_culture?.map((pc: any) => pc.culture?.nom_culture).join(', ');
    const location = `${project.commune?.nom_commune}, ${project.district?.nom_district}, ${project.region?.nom_region}`;
    doc.text(`Le présent contrat a pour objet la mise en valeur exclusive de la parcelle agricole ${project.terrain?.nom_terrain},`, 20, 110);
    doc.text(`sise à ${location}, sur une superficie de ${project.surface_ha} hectares,`, 20, 115);
    doc.text(`pour la culture de ${cultures}, dans le cadre du programme Maintso Vola ${currentYear}.`, 20, 120);

    // Article 2
    doc.setFontSize(12);
    doc.text('ARTICLE 2 – ENGAGEMENTS DE LA SOCIÉTÉ', 20, 135);
    doc.setFontSize(10);
    
    // Financial table
    const tableData = project.projet_culture?.map((pc: any) => [
      pc.culture?.nom_culture,
      project.surface_ha,
      pc.cout_exploitation_previsionnel?.toLocaleString(),
      pc.culture?.rendement_ha,
      pc.rendement_previsionnel?.toLocaleString(),
      pc.culture?.prix_tonne?.toLocaleString(),
      (pc.rendement_previsionnel * pc.culture?.prix_tonne)?.toLocaleString(),
      ((pc.rendement_previsionnel * pc.culture?.prix_tonne) - pc.cout_exploitation_previsionnel)?.toLocaleString()
    ]);

    const totalCost = tableData?.reduce((sum: number, row: any) => sum + Number(row[2]?.replace(/,/g, '')), 0);
    const totalRevenue = tableData?.reduce((sum: number, row: any) => sum + Number(row[6]?.replace(/,/g, '')), 0);
    const totalBenefit = tableData?.reduce((sum: number, row: any) => sum + Number(row[7]?.replace(/,/g, '')), 0);

    doc.setFontSize(12);
    doc.text('TABLEAU FINANCIER PRÉVISIONNEL', 20, 230);
    doc.setFontSize(10);

    autoTable(doc, {
      startY: 235,
      head: [['Culture', 'Surface (ha)', 'Coût (Ar)', 'Rdt (T/ha)', 'Rdt total (T)', 'Prix (Ar/kg)', 'Revenu (Ar)', 'Bénéfice (Ar)']],
      body: [
        ...tableData,
        ['TOTAL', project.surface_ha, totalCost?.toLocaleString(), '-', '-', '-', totalRevenue?.toLocaleString(), totalBenefit?.toLocaleString()]
      ],
      theme: 'grid',
      styles: { fontSize: 8 },
      headStyles: { fillColor: [76, 175, 80] }
    });

    // Benefit distribution
    const producerShare = totalBenefit * 0.4;
    const investorsShare = totalBenefit * 0.4;
    const maintsoShare = totalBenefit * 0.2;

    doc.setFontSize(12);
    doc.text('RÉPARTITION DES BÉNÉFICES PRÉVISIONNELS', 20, doc.lastAutoTable.finalY + 20);
    doc.setFontSize(10);

    autoTable(doc, {
      startY: doc.lastAutoTable.finalY + 25,
      head: [['Bénéficiaire', 'Pourcentage', 'Montant (Ar)']],
      body: [
        ['Producteur', '40%', producerShare?.toLocaleString()],
        ['Investisseurs', '40%', investorsShare?.toLocaleString()],
        ['Maintso Vola', '20%', maintsoShare?.toLocaleString()]
      ],
      theme: 'grid',
      styles: { fontSize: 8 },
      headStyles: { fillColor: [76, 175, 80] }
    });
    
    // Signatures
    doc.text('Fait à _________________________, le _________________________', 20, doc.lastAutoTable.finalY + 30);
    
    doc.text('Le Producteur', 20, doc.lastAutoTable.finalY + 50);
    doc.text('(Signature précédée de la mention "Lu et approuvé")', 20, doc.lastAutoTable.finalY + 55);
    
    doc.text('La Société MAINTSO VOLA', 120, doc.lastAutoTable.finalY + 50);
    doc.text('(Cachet et signature)', 120, doc.lastAutoTable.finalY + 55);

    doc.save(`contrat_${project.id_projet}_${project.tantsaha?.nom}.pdf`);
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            onClick={generatePDF}
            className={className}
          >
            <FileText className="h-4 w-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          Générer un contrat PDF pour ce projet
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default ContractTemplate;
