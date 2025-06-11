
import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Send, Calendar, AlertTriangle, Clock, CalendarCheck } from "lucide-react";
import { JalonFinancement } from "@/types/financier";
import SendPaymentModal from "./SendPaymentModal";
import MilestoneSection from "./MilestoneSection";

interface MilestonePaymentTableProps {
  jalons: JalonFinancement[];
  isLoading: boolean;
}

const MilestonePaymentTable: React.FC<MilestonePaymentTableProps> = ({
  jalons,
  isLoading
}) => {
  const [selectedJalon, setSelectedJalon] = useState<JalonFinancement | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  const handleSendPayment = (jalon: JalonFinancement) => {
    setSelectedJalon(jalon);
    setShowPaymentModal(true);
  };

  const getUrgencyBadge = (datePrevisionnelle: string) => {
    const today = new Date();
    const limite = new Date(datePrevisionnelle);
    const diffDays = Math.ceil((limite.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return <Badge variant="destructive">En retard</Badge>;
    } else if (diffDays <= 3) {
      return <Badge variant="destructive">Urgent</Badge>;
    } else if (diffDays <= 7) {
      return <Badge variant="secondary">Cette semaine</Badge>;
    } else {
      return <Badge variant="outline">Planifié</Badge>;
    }
  };

  const categorizeJalons = (jalons: JalonFinancement[]) => {
    const today = new Date();
    
    const enRetard = jalons
      .filter(jalon => {
        const limite = new Date(jalon.date_previsionnelle);
        const diffDays = Math.ceil((limite.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        return diffDays < 0;
      })
      .sort((a, b) => new Date(a.date_previsionnelle).getTime() - new Date(b.date_previsionnelle).getTime());

    const urgent = jalons
      .filter(jalon => {
        const limite = new Date(jalon.date_previsionnelle);
        const diffDays = Math.ceil((limite.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        return diffDays >= 0 && diffDays <= 3;
      })
      .sort((a, b) => new Date(a.date_previsionnelle).getTime() - new Date(b.date_previsionnelle).getTime());

    const cetteSemaine = jalons
      .filter(jalon => {
        const limite = new Date(jalon.date_previsionnelle);
        const diffDays = Math.ceil((limite.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        return diffDays > 3 && diffDays <= 7;
      })
      .sort((a, b) => new Date(a.date_previsionnelle).getTime() - new Date(b.date_previsionnelle).getTime());

    const planifie = jalons
      .filter(jalon => {
        const limite = new Date(jalon.date_previsionnelle);
        const diffDays = Math.ceil((limite.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        return diffDays > 7;
      })
      .sort((a, b) => new Date(a.date_previsionnelle).getTime() - new Date(b.date_previsionnelle).getTime());

    return { enRetard, urgent, cetteSemaine, planifie };
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Jalons à Financer</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center space-x-4">
                <Skeleton className="h-4 w-4" />
                <Skeleton className="h-4 flex-1" />
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-8 w-24" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (jalons.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Jalons à Financer</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <Calendar className="h-8 w-8 mx-auto mb-2" />
            <p>Aucun jalon en attente de financement</p>
            <p className="text-sm">Tous les jalons du mois sont financés</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const { enRetard, urgent, cetteSemaine, planifie } = categorizeJalons(jalons);
  const totalJalons = enRetard.length + urgent.length + cetteSemaine.length + planifie.length;

  return (
    <>
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Send className="h-6 w-6" />
            <h2 className="text-xl font-semibold">Jalons à Financer</h2>
          </div>
          <Badge variant="outline" className="px-3 py-1">
            {totalJalons} jalon{totalJalons > 1 ? 's' : ''} au total
          </Badge>
        </div>

        <div className="space-y-4">
          <MilestoneSection
            title="En Retard"
            icon={AlertTriangle}
            badgeVariant="destructive"
            jalons={enRetard}
            onSendPayment={handleSendPayment}
            getUrgencyBadge={getUrgencyBadge}
          />

          <MilestoneSection
            title="Urgent (≤ 3 jours)"
            icon={AlertTriangle}
            badgeVariant="destructive"
            jalons={urgent}
            onSendPayment={handleSendPayment}
            getUrgencyBadge={getUrgencyBadge}
          />

          <MilestoneSection
            title="Cette Semaine (4-7 jours)"
            icon={Clock}
            badgeVariant="secondary"
            jalons={cetteSemaine}
            onSendPayment={handleSendPayment}
            getUrgencyBadge={getUrgencyBadge}
          />

          <MilestoneSection
            title="Planifié (> 7 jours)"
            icon={CalendarCheck}
            badgeVariant="outline"
            jalons={planifie}
            onSendPayment={handleSendPayment}
            getUrgencyBadge={getUrgencyBadge}
          />
        </div>

        {totalJalons === 0 && (
          <Card>
            <CardContent className="text-center py-8 text-muted-foreground">
              <Calendar className="h-8 w-8 mx-auto mb-2" />
              <p>Aucun jalon en attente de financement</p>
              <p className="text-sm">Tous les jalons sont financés</p>
            </CardContent>
          </Card>
        )}
      </div>

      <SendPaymentModal
        isOpen={showPaymentModal}
        onClose={() => {
          setShowPaymentModal(false);
          setSelectedJalon(null);
        }}
        jalon={selectedJalon}
      />
    </>
  );
};

export default MilestonePaymentTable;
