import React from 'react';
import { Button } from "@/components/ui/button";
import { FileText } from "lucide-react";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import QRCode from "qrcode";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import logo from "@/assets/maintsovola_logo_pm.png";

interface ContractTemplateProps {
  project: any;
  className?: string;
}

const ContractTemplate: React.FC<ContractTemplateProps> = ({ project, className }) => {
  const generatePDF = async () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    let y = 60;
    const lineHeight = 7;

    const addLine = (text: string, offset = 0, fontSize = 10) => {
      const bottomMargin = 20;
      const currentPageHeight = doc.internal.pageSize.height;
      if (y + lineHeight + offset > currentPageHeight - bottomMargin) {
        doc.addPage();
        y = 60;
        addHeader();
      }
      doc.setFontSize(fontSize);
      doc.setTextColor(0, 0, 0);
      doc.text(text, 20, y + offset);
      y += lineHeight;
    };

    const addHeader = () => {
      doc.addImage(logo, 'PNG', 20, 8, 18, 18);

      doc.setTextColor(76, 175, 80);
      doc.setFontSize(11);
      doc.text("Maintso Vola", 45, 14);
      doc.setFontSize(9);
      doc.setTextColor(0, 0, 0);
      doc.text("Transformons ensemble l'agriculture à Madagascar.", 45, 20);

      const rightX = pageWidth - 85;
      const lines = [
        "Adresse : Lot II K 98 Antananarivo 101",
        "Téléphone : +261 34 12 345 67 | Email : contact@maintso-vola.mg",
        "Site web : https://maintso-vola.mg"
      ];
      lines.forEach((line, i) => doc.text(line, rightX, 12 + i * 5));

      doc.setDrawColor(200);
      doc.line(20, 28, pageWidth - 20, 28);
    };

    const setArticleTitle = (text: string) => {
      doc.setTextColor(76, 175, 80);
      addLine(text, 0, 12);
      doc.setTextColor(0, 0, 0);
    };

    addHeader();

    const currentYear = new Date().getFullYear();
    const campagne = project.campagne_annee || currentYear;

    doc.setFontSize(16);
    doc.setTextColor(76, 175, 80);
    doc.text("CONTRAT DE MISE EN VALEUR AGRICOLE À TITRE EXCLUSIF", 105, y, { align: "center" });
    y += lineHeight;
    doc.setFontSize(12);
    doc.text(`CAMPAGNE CULTURALE ${campagne}`, 105, y, { align: "center" });
    doc.setTextColor(0, 0, 0);
    y += 10;

    addLine("ENTRE :");
    addLine(`La Société MAINTSO VOLA S.A., représentée par ${project.representant_nom}, siège social à ${project.siege_social}, immatriculée sous le n° ${project.rc_numero},`);
    addLine("Ci-après dénommée \"la Société\"");

    y += 5;
    addLine("ET :");
    addLine(`${project.tantsaha?.nom_complet}, né(e) le ${project.tantsaha?.date_naissance}, domicilié(e) à ${project.tantsaha?.adresse}, CIN n° ${project.tantsaha?.cin},`);
    addLine("Ci-après dénommé(e) \"le Producteur\"");

    y += 10;
    setArticleTitle("ARTICLE 1 – OBJET");
    addLine(`Le présent contrat a pour objet la mise en valeur exclusive de la parcelle agricole ${project.terrain?.nom}, sise à ${project.terrain?.adresse}, sur une superficie de ${project.terrain?.surface} hectares, pour la culture de ${project.cultures?.[0]?.nom}, dans le cadre du programme Maintso Vola ${campagne}.`);

    y += 10;
    setArticleTitle("ARTICLE 2 – ENGAGEMENTS DE LA SOCIÉTÉ");
    addLine("2.1 Fourniture d’intrants (voir Annexe I) :");
    addLine(`- ${project.intrants_fournis}`);
    addLine("2.2 Encadrement technique :");
    addLine("- Visites régulières, fiches de suivi obligatoires, recommandations techniques signées");
    addLine("2.3 Rachat de la totalité de la production conforme :");
    addLine("- Le prix de vente sera fixé à la fin de la campagne en fonction du prix de marché au moment de la vente.");
    addLine(`- Règlement sous ${project.delai_paiement} jours après réception et validation`);
    addLine("2.4 Assurance :");
    addLine("- Maintso Vola souscrit une couverture de risques climatiques pour les parcelles enregistrées, sous conditions.");
    addLine("2.5 Répartition des bénéfices :");
    addLine("- Après restitution complète du capital investi, bénéfices nets répartis : 40% Producteur, 40% Investisseurs, 20% Maintso Vola.");
    addLine("- Modalité au choix du Producteur : produits agricoles, numéraire ou mixte.");
    addLine("- Relevé détaillé disponible sur demande.");
    addLine("2.6 Moyens et innovation mis à disposition :");
    addLine("- Pratiques agricoles, matériel, intrants de qualité, suivi informatisé, transfert de compétences.");

    y += 10;    
    setArticleTitle("ARTICLE 3 – ENGAGEMENTS DU PRODUCTEUR");
    addLine("3.1 Exclusivité : Le Producteur s’engage à affecter la parcelle à la seule culture contractuelle. Toute déviation engage sa responsabilité contractuelle.");
    addLine("3.2 Bonnes pratiques agricoles : Le Producteur suivra strictement les consignes techniques de la Société. Tout refus ou négligence documentée pourra entraîner des sanctions.");
    addLine("3.3 Production livrable obligatoire : L’intégralité de la récolte issue de la parcelle devra être livrée à Maintso Vola dans les délais et conditions fixées.");
    addLine("3.4 Coopération : Le Producteur autorise l’accès à sa parcelle à tout moment par les agents de la Société et accepte d’être photographié ou filmé dans le cadre de suivi ou communication du projet.");
    addLine("3.5 Engagement de performance minimale : Le Producteur s’engage à atteindre un rendement minimal de " + project.rendement_minimal + " kg/hectare, sauf cas de force majeure dûment constaté. Le non-respect de cet objectif sans justification technique pourra entraîner une réduction de sa part de bénéfices ou l’exclusion des futures campagnes Maintso Vola.");

    y += 10;
    addLine("ARTICLE 4 – RESPONSABILITÉ & TRAÇABILITÉ", 0, 12);
    addLine("- Rupture immédiate en cas de revente parallèle, dissimulation, destruction volontaire.");
    addLine("- Sanctions : remboursement +25%, poursuites judiciaires possibles.");

    y += 10;
    addLine("ARTICLE 5 – CONDITIONS FINANCIÈRES", 0, 12);
    addLine("- Prix fixé selon le marché à la fin de la campagne.");
    addLine("- Déductions : intrants, services, frais (voir Annexe II).\n- Paiement : virement ou mobile money.");
    addLine("- Bénéfices nets : 40% Producteur, 40% Investisseurs, 20% Maintso Vola.");
    addLine("- Modalité au choix du Producteur.");

    y += 5;
    doc.setFontSize(12);
    doc.text("TABLEAU FINANCIER PRÉVISIONNEL", 20, y);
    y += 5;

    autoTable(doc, {
      startY: y,
      head: [["Culture", "Surface (ha)", "Coût (Ar)", "Rdt (T/ha)", "Rdt total", "Prix (Ar/kg)", "Revenu (Ar)", "Bénéfice (Ar)"]],
      body: project.tableau_financier || [],
      theme: "grid",
      styles: { fontSize: 8 },
      headStyles: { fillColor: [76, 175, 80] },
    });

    const firstTableEndY = (doc as any).lastAutoTable.finalY;
    y = firstTableEndY + 10;
    
    doc.setFontSize(12);
    doc.text("RÉPARTITION DES BÉNÉFICES PRÉVISIONNELS", 20, y);

    autoTable(doc, {
      startY: y + 5,
      head: [["Bénéficiaire", "Pourcentage", "Montant (Ar)"]],
      body: [
        ["Producteur", "40%", project.part_producteur],
        ["Investisseurs", "40%", project.part_investisseurs],
        ["Maintso Vola", "20%", project.part_maintso],
      ],
      theme: "grid",
      styles: { fontSize: 8 },
      headStyles: { fillColor: [76, 175, 80] },
    });

    const secondTableEndY = (doc as any).lastAutoTable.finalY;
    y = secondTableEndY + 10;
    
    addLine("ARTICLE 6 – DURÉE", 0, 12);
    addLine(`Durée : du ${project.date_debut} au ${project.date_fin}`);
    addLine("Reconduction possible après évaluation de la performance.");

    y += 10;
    addLine("ARTICLE 7 – RÉSILIATION ET SANCTIONS", 0, 12);
    addLine("Cas de résiliation : détournement, refus livraison ou contrôle, fausses déclarations, rendement non atteint.");
    addLine("Sanctions : indemnité 500 000 Ar + remboursement intrants.");

    y += 10;
    addLine("ARTICLE 8 – LITIGES", 0, 12);
    addLine(`Tribunal compétent : Tribunal de Première Instance de ${project.tribunal_ville}`);

    y += 10;
    addLine(`FAIT À ${project.lieu_signature}, LE ${project.date_signature}`);
    addLine("En deux exemplaires originaux.");

    y += 5;
    autoTable(doc, {
      startY: y,
      head: [["Le Producteur", "La Société MAINTSO VOLA"]],
      body: [[
        "Nom, signature, empreinte\n\"Lu et approuvé, bon pour accord\"",
        "Nom, fonction, signature"
      ]],
      theme: "grid",
      styles: { fontSize: 9, cellPadding: 4 },
      headStyles: { fillColor: [230, 230, 230] },
      columnStyles: {
        0: { cellWidth: 85 },
        1: { cellWidth: 85 }
      }
    });

    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(150);
      doc.text(`Page ${i} sur ${pageCount}`, pageWidth / 2, pageHeight - 10, { align: 'center' });
      doc.text("Agriculteur - Vous êtes le premier partenaire de Maintso Vola.", pageWidth / 2, pageHeight - 5, { align: 'center' });
    }

    const qrData = `https://app.maintso-vola.mg/verification/${project.id_projet}`;
    const qrImage = await QRCode.toDataURL(qrData);
    doc.addImage(qrImage, 'PNG', pageWidth - 50, pageHeight - 50, 30, 30);

    doc.save(`contrat_${project.id_projet}_${project.tantsaha?.nom}.pdf`);
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant="ghost" size="icon" onClick={generatePDF} className={className}>
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
