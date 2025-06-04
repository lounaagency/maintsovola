
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
      doc.text("Andao hiara-hampandroso ny fambolena eto Madagasikara.", 45, 20);

      doc.setFontSize(8);
      const rightX = pageWidth - 85;
      const lines = [
        "Adiresy : Lot II K 98 Antananarivo 101",
        "Telefaonina : +261 34 12 345 67 | Email : contact@maintso-vola.mg",
        "Tranokala : https://maintso-vola.mg"
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
    doc.text("FIFANEKENA FAMPIASANA TANIM-BARY MANOKANA", 105, y, { align: "center" });
    y += lineHeight;
    doc.setFontSize(12);
    doc.text(`TAONA FAMBOLENA ${campagne}`, 105, y, { align: "center" });
    doc.setTextColor(0, 0, 0);
    y += 10;

    addLine("EO ANELANELAN'IRETO :");
    addLine(`Orinasa MAINTSO VOLA S.A., solontenany ${project.representant_nom || '[À compléter]'}, foibe ao ${project.siege_social || '[À compléter]'}, voasoratra ara-dalàna laharana ${project.rc_numero || '[À compléter]'},`);
    addLine("Antsoina amin'ny manaraka hoe \"Ny Orinasa\"");

    y += 5;
    addLine("SY :");
    addLine(`${project.tantsaha?.nom_complet || `${project.tantsaha?.nom} ${project.tantsaha?.prenoms || ''}`}, teraka tamin'ny ${project.tantsaha?.date_naissance || '[À compléter]'}, monina ao ${project.tantsaha?.adresse || '[À compléter]'}, CIN laharana ${project.tantsaha?.cin || '[À compléter]'},`);
    addLine("Antsoina amin'ny manaraka hoe \"Ny Tantsaha\"");

    y += 10;
    setArticleTitle("ANDININY 1 – TOMBONTSOA");
    addLine(`Ity fifanekena ity dia mikendry ny hampiasana tanim-bary ${project.terrain?.nom_terrain || `#${project.id_terrain}`}, any ${[project.commune?.nom_commune, project.district?.nom_district, project.region?.nom_region].filter(Boolean).join(', ')}, mirefy ${project.surface_ha} hektara, amin'ny fambolena ${project.projet_culture?.map(pc => pc.culture?.nom_culture).join(', ')}, ao anatin'ny programa Maintso Vola ${campagne}.`);

    y += 10;
    setArticleTitle("ANDININY 2 – ADIDIN'NY ORINASA");
    addLine("2.1 Fanomezana fitaovana sy akora (jereo Fanampiny I) :");
    addLine(`- ${project.intrants_fournis}`);
    addLine("2.2 Fanaraha-maso ara-teknika :");
    addLine("- Fitsidihana tsy tapaka, taratasy fanarahana, torohevitra soniavin'ny tantsaha");
    addLine("2.3 Fividianana vokatra rehetra mahafeno fepetra :");
    addLine("- Vidy farany tapaka amin'ny faran'ny taom-pambolena araka ny vidin-tsena.");
    addLine(`- Fandoavana ao anatin'ny ${project.delai_paiement} andro aorian'ny fanamarinana`);
    addLine("2.4 Fiantohana :");
    addLine("- Maintso Vola dia manome fiantohana amin'ny loza voajanahary, amin'ny fepetra manokana.");
    addLine("2.5 Fizarana tombombarotra :");
    addLine("- Rehefa voaloa ny vola rehetra nampiasaina : 40% ho an'ny Tantsaha, 40% ho an'ny Mpampiasa vola, 20% ho an'ny Maintso Vola.");
    addLine("- Azon'ny Tantsaha atao amin'ny fomba : vokatra, vola, na mifangaro.");
    addLine("- Tatitra amin'ny antsipirihany azo angatahana.");
    addLine("2.6 Fitaovana sy fanavaozana :");
    addLine("- Fitaovana, akora, fanaraha-maso, fahaiza-manao.");

    y += 10;
    setArticleTitle("ANDININY 3 – ADIDIN'NY TANTSAHA");
    addLine("3.1 Fampiasana manokana : Ireo tany dia ho an'ny fambolena resahina ihany.");
    addLine("3.2 Fomba fambolena araka ny tokony ho izy : Manaraka ny torohevitra ara-teknika avy amin'ny Orinasa.");
    addLine("3.3 Vokatra omena : Ny vokatra rehetra dia tsy maintsy omena ny Maintso Vola ara-potoana sy amin'ny fepetra.");
    addLine("3.4 Fiara-miasa : Ny Tantsaha dia manaiky ny fitsidihana ary ny fakana sary/horonan-tsary.");
    addLine("3.5 Fampanantenana vokatra farafahakeliny : Tokony hahatratra ny vokatra farany ambany hoe " + project.rendement_minimal + " kg/hektara, raha tsy misy antony lehibe manakana.");

    y += 10;
    addLine("ANDININY 4 – ANDRAIKITRA SY FANARAHANA", 0, 12);
    addLine("- Tapaka avy hatrany raha misy fivarotana tsy ara-dalàna, fanaratsiana, fanimbana.");
    addLine("- Sazy : fandoavana vola +25%, fanenjehana ara-pitsarana.");

    y += 10;
    addLine("ANDININY 5 – FEPETRA ARA-BOLA", 0, 12);
    addLine("- Vidy amin'ny faran'ny taom-pambolena.");
    addLine("- Fakàna : fitaovana, tolotra, saran-dalana (jereo Fanampiny II).\n- Fandoavana : amin'ny alalan'ny banky na mobile money.");
    addLine("- Tombombarotra : 40% Tantsaha, 40% Mpampiasa vola, 20% Maintso Vola.");
    addLine("- Safidy fandoavana an'ny Tantsaha.");

    y += 5;
    doc.setFontSize(12);
    doc.text("TABILAO FANOMANANA ARA-BOLA", 20, y);
    y += 5;

    autoTable(doc, {
      startY: y,
      head: [["Vokatra", "Tany (ha)", "Saran'ny famokarana (Ar)", "Vokatra isaky ny ha", "Vokatra tanteraka", "Vidiny (Ar/kg)", "Vola miditra (Ar)", "Tombony (Ar)"]],
      body: project.tableau_financier || [],
      theme: "grid",
      styles: { fontSize: 8 },
      headStyles: { fillColor: [76, 175, 80] },
    });

    const firstTableEndY = (doc as any).lastAutoTable.finalY;
    y = firstTableEndY + 10;
    
    doc.setFontSize(12);
    doc.text("FIZARANA TOMBONY VINAVINA", 20, y);

    autoTable(doc, {
      startY: y + 5,
      head: [["Mahazo", "Isan-jato", "Vola (Ar)"]],
      body: [
        ["Tantsaha", "40%", project.part_producteur],
        ["Mpampiasa vola", "40%", project.part_investisseurs],
        ["Maintso Vola", "20%", project.part_maintso],
      ],
      theme: "grid",
      styles: { fontSize: 8 },
      headStyles: { fillColor: [76, 175, 80] },
    });

    const secondTableEndY = (doc as any).lastAutoTable.finalY;
    y = secondTableEndY + 10;
    
    addLine("ANDININY 6 – FAHARETAN'NY FIFANEKENA", 0, 12);
    addLine(`Fotoana : manomboka ny ${project.date_debut} ka hatramin'ny ${project.date_fin}`);
    addLine("Azo havaozina raha mahafa-po ny vokatra sy ny fiaraha-miasa.");

    y += 10;
    addLine("ANDININY 7 – FANAFOANANA SY FAHATAHORANA", 0, 12);
    addLine("Tsy fahatanterahana, fialana, tsy fandoavana, famitahana, tsy nahatratra vokatra : mety hiteraka fanalana sy onitra 500 000 Ar + famerenana fitaovana.");

    y += 10;
    addLine("ANDININY 8 – FIFANDRAISANA AMIN'NY FITSARANA", 0, 12);
    addLine(`Fitsarana misahana : Fitsarana Ambaratonga Voalohany ao ${project.tribunal_ville}`);

    y += 10;
    addLine(`NATAO TEO ${project.lieu_signature || '[À compléter]'}, NY ${project.date_signature || new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' })}`);
    addLine("Amin'ny kopia roa mitovy.");

    y += 5;
    autoTable(doc, {
      startY: y,
      head: [["Ny Tantsaha", "Ny Orinasa MAINTSO VOLA"]],
      body: [[
        "Anarana, sonia, rantsan-tanana\n\"Vakina sy ekena, manaiky\"",
        "Anarana, andraikitra, sonia"
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
      doc.text(`Pejy ${i} / ${pageCount}`, pageWidth / 2, pageHeight - 10, { align: 'center' });
      doc.text("Tantsaha - Ianao no mpiara-miombon'antoka voalohany amin'ny Maintso Vola.", pageWidth / 2, pageHeight - 5, { align: 'center' });
    }

    const qrData = `https://app.maintso-vola.mg/verification/${project.id_projet}`;
    const qrImage = await QRCode.toDataURL(qrData);
    doc.addImage(qrImage, 'PNG', pageWidth - 50, pageHeight - 50, 30, 30);

    doc.save(`fifanekena_${project.id_projet}_${project.tantsaha?.nom || 'tantsaha'}.pdf`);
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
          Mamoròna fifanekena PDF ho an'ity tetikasa ity
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default ContractTemplate;
