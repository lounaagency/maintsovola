
import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Input } from '@/components/ui/input';
import { Loader2, CreditCard, Smartphone } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface InvestmentDialogProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
  projectTitle: string;
  fundingNeeded: number;
  currentFunding: number;
  onInvestmentComplete: () => void;
}

const InvestmentDialog: React.FC<InvestmentDialogProps> = ({
  isOpen,
  onClose,
  projectId,
  projectTitle,
  fundingNeeded,
  currentFunding,
  onInvestmentComplete,
}) => {
  const { user } = useAuth();
  const [amount, setAmount] = useState<number>(fundingNeeded - currentFunding);
  const [maxAmount, setMaxAmount] = useState<number>(fundingNeeded - currentFunding);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [paymentMethod, setPaymentMethod] = useState<'mobile' | 'card'>('mobile');
  const [mobileNumber, setMobileNumber] = useState<string>('');
  const [cardNumber, setCardNumber] = useState<string>('');

  useEffect(() => {
    if (isOpen) {
      const remainingFunding = fundingNeeded - currentFunding;
      setMaxAmount(remainingFunding > 0 ? remainingFunding : fundingNeeded * 0.1);
      setAmount(remainingFunding > 0 ? remainingFunding : fundingNeeded * 0.1);
    }
  }, [isOpen, fundingNeeded, currentFunding]);

  const handleSliderChange = (value: number[]) => {
    setAmount(value[0]);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value);
    if (!isNaN(value) && value >= 0) {
      setAmount(Math.min(value, maxAmount));
    }
  };

  const handleInvest = async () => {
    if (!user) {
      toast("Vous devez être connecté pour investir");
      return;
    }

    if (amount <= 0) {
      toast("Le montant d'investissement doit être supérieur à 0");
      return;
    }

    if (paymentMethod === 'mobile' && !mobileNumber) {
      toast("Veuillez entrer votre numéro de téléphone mobile");
      return;
    }

    if (paymentMethod === 'card' && !cardNumber) {
      toast("Veuillez entrer votre numéro de carte");
      return;
    }

    setIsProcessing(true);

    try {
      // In a real app, this would connect to a payment gateway
      // For now, we'll simulate a payment processing delay
      setTimeout(async () => {
        try {
          const { error } = await supabase.from('investissement').insert({
            id_projet: parseInt(projectId),
            id_investisseur: user.id,
            montant: amount,
            date_investissement: new Date().toISOString(),
          });

          if (error) throw error;

          // Create notifications
          const { data: projectData } = await supabase
            .from('projet')
            .select('id_tantsaha, id_technicien, id_superviseur')
            .eq('id_projet', projectId)
            .single();

          if (projectData) {
            // Notify the project owner
            if (projectData.id_tantsaha) {
              await supabase.from('notification').insert({
                id_destinataire: projectData.id_tantsaha,
                id_expediteur: user.id,
                titre: "Nouvel investissement sur votre projet",
                message: `Un investisseur a investi ${amount.toLocaleString()} Ar dans votre projet "${projectTitle}"`,
                type: 'info',
                entity_type: 'projet',
                entity_id: projectId,
                projet_id: parseInt(projectId)
              });
            }

            // Notify the technician
            if (projectData.id_technicien) {
              await supabase.from('notification').insert({
                id_destinataire: projectData.id_technicien,
                id_expediteur: user.id,
                titre: "Nouvel investissement",
                message: `Un investisseur a investi ${amount.toLocaleString()} Ar dans le projet "${projectTitle}"`,
                type: 'info',
                entity_type: 'projet',
                entity_id: projectId,
                projet_id: parseInt(projectId)
              });
            }

            // Notify the supervisor
            if (projectData.id_superviseur) {
              await supabase.from('notification').insert({
                id_destinataire: projectData.id_superviseur,
                id_expediteur: user.id,
                titre: "Nouvel investissement",
                message: `Un investisseur a investi ${amount.toLocaleString()} Ar dans le projet "${projectTitle}"`,
                type: 'info',
                entity_type: 'projet',
                entity_id: projectId,
                projet_id: parseInt(projectId)
              });
            }
          }

          toast.success("Votre investissement a été effectué avec succès !");
          onInvestmentComplete();
          onClose();
        } catch (error) {
          console.error('Error processing investment:', error);
          toast.error("Une erreur s'est produite lors du traitement de votre investissement.");
        } finally {
          setIsProcessing(false);
        }
      }, 2000);
    } catch (error) {
      console.error('Error processing investment:', error);
      toast.error("Une erreur s'est produite lors du traitement de votre investissement.");
      setIsProcessing(false);
    }
  };

  const remainingPercentage = ((fundingNeeded - currentFunding) / fundingNeeded) * 100;
  const formatCurrency = (value: number) => value.toLocaleString() + ' Ar';

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Investir dans ce projet</DialogTitle>
          <DialogDescription>
            Votre investissement permettra de financer le projet "{projectTitle}" et vous donnera droit à des retours proportionnels.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-6 py-4">
          <div>
            <div className="flex justify-between mb-2 text-sm">
              <span>Financement requis:</span>
              <span className="font-medium">{formatCurrency(fundingNeeded)}</span>
            </div>
            <div className="flex justify-between mb-2 text-sm">
              <span>Financement actuel:</span>
              <span className="font-medium">{formatCurrency(currentFunding)}</span>
            </div>
            <div className="flex justify-between mb-4 text-sm">
              <span>Reste à financer:</span>
              <span className="font-medium text-primary">
                {formatCurrency(fundingNeeded - currentFunding)} ({remainingPercentage.toFixed(0)}%)
              </span>
            </div>
          </div>

          <div className="space-y-4">
            <label className="text-sm font-medium">
              Montant de votre investissement
            </label>
            <div className="space-y-2">
              <Slider
                value={[amount]}
                min={1000}
                max={maxAmount}
                step={1000}
                onValueChange={handleSliderChange}
              />
              <div className="flex items-center">
                <Input
                  type="number"
                  value={amount}
                  onChange={handleInputChange}
                  className="w-full"
                  min={1000}
                  max={maxAmount}
                />
                <span className="ml-2 text-sm font-medium">Ar</span>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <label className="text-sm font-medium">
              Méthode de paiement
            </label>
            <div className="grid grid-cols-2 gap-4">
              <Button
                type="button"
                variant={paymentMethod === 'mobile' ? 'default' : 'outline'}
                className="flex items-center justify-center"
                onClick={() => setPaymentMethod('mobile')}
              >
                <Smartphone className="mr-2 h-4 w-4" />
                Mobile Money
              </Button>
              <Button
                type="button"
                variant={paymentMethod === 'card' ? 'default' : 'outline'}
                className="flex items-center justify-center"
                onClick={() => setPaymentMethod('card')}
              >
                <CreditCard className="mr-2 h-4 w-4" />
                Carte bancaire
              </Button>
            </div>

            {paymentMethod === 'mobile' && (
              <div>
                <label className="text-sm font-medium">
                  Numéro de téléphone
                </label>
                <Input
                  type="tel"
                  placeholder="032 XX XXX XX"
                  value={mobileNumber}
                  onChange={(e) => setMobileNumber(e.target.value)}
                  className="mt-1"
                />
              </div>
            )}

            {paymentMethod === 'card' && (
              <div>
                <label className="text-sm font-medium">
                  Numéro de carte
                </label>
                <Input
                  type="text"
                  placeholder="XXXX XXXX XXXX XXXX"
                  value={cardNumber}
                  onChange={(e) => setCardNumber(e.target.value)}
                  className="mt-1"
                />
              </div>
            )}
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isProcessing}>
            Annuler
          </Button>
          <Button onClick={handleInvest} disabled={isProcessing}>
            {isProcessing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Traitement en cours...
              </>
            ) : (
              `Investir ${formatCurrency(amount)}`
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default InvestmentDialog;
