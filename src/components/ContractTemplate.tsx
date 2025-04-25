import React from 'react';
import { Button } from "@/components/ui/button";
import { FileText } from "lucide-react";
import { jsPDF } from "jspdf";
import autoTable from 'jspdf-autotable';
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

interface ContractTemplateProps {
  project: any;
  className?: string;
}

const ContractTemplate: React.FC<ContractTemplateProps> = ({ project, className }) => {
  const generatePDF = async () => {
    const doc = new jsPDF();
    
    // Add logo
    // const img = new Image();
    // img.src = '/maintsovola_logo_pm.png';
    // doc.addImage(img, 'PNG', 15, 10, 30, 30);
    
    doc.setFontSize(16);
    doc.text('CONTRAT DE MISE EN VALEUR AGRICOLE À TITRE EXCLUSIF', 105, 20, { align: 'center' });
    doc.setFontSize(12);
    doc.text(`CAMPAGNE CULTURALE ${new Date().getFullYear()}`, 105, 30, { align: 'center' });
    
    doc.setFontSize(10);
    
    // Parties
    doc.text('ENTRE :', 20, 45);
    doc.text('La Société MAINTSO VOLA S.A.', 20, 55);
    
    doc.text('ET :', 20, 70);
    doc.text(`${project.tantsaha?.nom} ${project.tantsaha?.prenoms}`, 20, 80);
    
    // Articles
    doc.setFontSize(12);
    doc.text('ARTICLE 1 – OBJET', 20, 100);
    doc.setFontSize(10);
    doc.text(`Le présent contrat a pour objet la mise en valeur exclusive de la parcelle agricole ${project.terrain?.nom_terrain},`, 20, 110);
    doc.text(`sise à ${project.commune?.nom_commune}, ${project.district?.nom_district}, ${project.region?.nom_region},`, 20, 115);
    doc.text(`sur une superficie de ${project.surface_ha} hectares, pour la culture de:`, 20, 120);
    
    const cultures = project.projet_culture?.map((pc: any) => pc.culture?.nom_culture).join(', ');
    doc.text(cultures, 20, 125);
    
    // Financial table
    const tableData = project.projet_culture?.map((pc: any) => [
      pc.culture?.nom_culture,
      project.surface_ha.toString(),
      pc.cout_exploitation_previsionnel?.toLocaleString(),
      pc.culture?.rendement_ha?.toString(),
      pc.rendement_previsionnel?.toLocaleString(),
      pc.culture?.prix_tonne?.toLocaleString(),
      (pc.rendement_previsionnel * pc.culture?.prix_tonne)?.toLocaleString(),
      ((pc.rendement_previsionnel * pc.culture?.prix_tonne) - pc.cout_exploitation_previsionnel)?.toLocaleString()
    ]);
    
    autoTable(doc, {
      startY: 140,
      head: [['Culture', 'Surface (ha)', 'Coût (Ar)', 'Rdt (T/ha)', 'Rdt total (T)', 'Prix (Ar/kg)', 'Revenu (Ar)', 'Bénéfice (Ar)']],
      body: tableData,
      theme: 'grid',
      styles: { fontSize: 8 },
      headStyles: { fillColor: [76, 175, 80] }
    });
    
    // Signatures
    doc.text('Fait à _________________________, le _________________________', 20, 250);
    
    doc.text('Le Producteur', 20, 270);
    doc.text('(Signature précédée de la mention "Lu et approuvé")', 20, 275);
    
    doc.text('La Société MAINTSO VOLA', 120, 270);
    doc.text('(Cachet et signature)', 120, 275);
    
    doc.save(`contrat_${project.id_projet}_${project.tantsaha?.nom}.pdf`);
  };
  
  return (
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
  );
};

export default ContractTemplate;
