
import React, { useState, useEffect } from 'react';
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Smartphone, AlertCircle, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";
import { Spinner } from '@/components/ui/spinner';

type PaymentMethod = 'mvola' | 'orange' | 'airtel' | null;
type PaymentStatus = 'idle' | 'processing' | 'checking' | 'success' | 'failed';

interface PaymentOptionsProps {
  investmentId: number | null;
  amount: number;
  onPaymentComplete?: (success: boolean, transactionId?: string) => void;
}

const PaymentOptions: React.FC<PaymentOptionsProps> = ({
  investmentId,
  amount,
  onPaymentComplete
}) => {
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(null);
  const [phoneNumber, setPhoneNumber] = useState<string>('');
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>('idle');
  const [error, setError] = useState<string | null>(null);
  const [transactionId, setTransactionId] = useState<string | null>(null);
  const [statusCheckCount, setStatusCheckCount] = useState(0);

  const handlePaymentMethodChange = (value: string) => {
    setPaymentMethod(value as PaymentMethod);
    setError(null);
  };

  const validatePhoneNumber = (number: string): boolean => {
    // Validate MVola numbers (03X)
    if (paymentMethod === 'mvola') {
      const regex = /^03[2-4][0-9]{7}$/; // MVola: 032, 033, 034
      return regex.test(number);
    }

    // General validation for other methods
    const regex = /^0[34][0-9]{8}$/; 
    return regex.test(number);
  };

  // Check transaction status periodically
  useEffect(() => {
    let statusCheckInterval: number;

    if (transactionId && paymentStatus === 'checking') {
      statusCheckInterval = window.setInterval(checkTransactionStatus, 5000);
    }

    return () => {
      if (statusCheckInterval) window.clearInterval(statusCheckInterval);
    };
  }, [transactionId, paymentStatus]);

  // Check transaction status
  const checkTransactionStatus = async () => {
    if (!transactionId) return;

    try {
      const { data: response, error } = await supabase.functions.invoke('mvola-status', {
        body: { transactionId },
      });

      if (error) {
        throw new Error(`Erreur lors de la vérification du statut: ${error.message}`);
      }

      console.log('Transaction status check response:', response);
      
      if (response.success) {
        setStatusCheckCount(prev => prev + 1);

        if (response.status === 'effectué') {
          setPaymentStatus('success');
          toast({
            title: "Paiement réussi",
            description: "Votre transaction a été effectuée avec succès",
            variant: "success",
          });
          onPaymentComplete?.(true, transactionId);
        } else if (response.status === 'échoué') {
          setPaymentStatus('failed');
          setError("Le paiement a échoué. Veuillez réessayer.");
          onPaymentComplete?.(false);
        } else if (statusCheckCount >= 12) { // Stop checking after 1 minute (12 * 5s = 60s)
          setPaymentStatus('idle');
          setError("Le statut du paiement n'a pas pu être confirmé. Veuillez vérifier votre compte MVola.");
        }
      }
    } catch (err) {
      console.error("Error checking transaction status:", err);
      // Continue checking even if there's an error
    }
  };

  const handleSubmitPayment = async () => {
    if (!paymentMethod) {
      setError("Veuillez sélectionner une méthode de paiement");
      return;
    }

    if (!validatePhoneNumber(phoneNumber)) {
      setError("Veuillez entrer un numéro de téléphone valide pour " + 
        (paymentMethod === 'mvola' ? 'MVola (ex: 034XXXXXXX)' : 
         paymentMethod === 'orange' ? 'Orange Money' : 'Airtel Money'));
      return;
    }

    setPaymentStatus('processing');
    setError(null);

    try {
      if (paymentMethod === 'mvola') {
        // Process MVola payment
        const { data: response, error } = await supabase.functions.invoke('paiement-mvola', {
          body: {
            phone: phoneNumber,
            amount,
            reason: `Investissement Maintso Vola #${investmentId || 'direct'}`,
            investissementId: investmentId
          },
        });

        if (error) {
          throw new Error(`Erreur lors de l'appel à l'API MVola: ${error.message}`);
        }

        if (!response.success) {
          throw new Error(response.message || "Échec du paiement MVola");
        }

        console.log('MVola payment response:', response);

        // Store transaction ID for status checking
        setTransactionId(response.transactionId);
        
        // Update status to checking
        setPaymentStatus('checking');
        
        // Inform user to check their phone
        toast({
          title: "Veuillez confirmer le paiement",
          description: "Veuillez vérifier votre téléphone pour confirmer la transaction MVola",
          variant: "info",
        });
        
      } else {
        // Handle other payment methods (not implemented yet)
        toast({
          title: `${paymentMethod === 'orange' ? 'Orange Money' : 'Airtel Money'} - Bientôt disponible`,
          description: "Nous vous notifierons lorsque cette méthode sera disponible",
          variant: "info",
        });
        
        // Reset status
        setPaymentStatus('idle');
      }
    } catch (err) {
      console.error("Payment error:", err);
      setError(err.message || "Une erreur est survenue lors du traitement du paiement");
      setPaymentStatus('failed');
      toast({
        title: "Échec du paiement",
        description: err.message || "Veuillez réessayer ou choisir une autre méthode de paiement",
        variant: "destructive",
      });
      onPaymentComplete?.(false);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-medium">Choisissez votre méthode de paiement</h3>
        <p className="text-sm text-muted-foreground">
          Montant à payer: {new Intl.NumberFormat('fr-MG', { style: 'currency', currency: 'MGA' }).format(amount)}
        </p>
      </div>

      <RadioGroup value={paymentMethod || ''} onValueChange={handlePaymentMethodChange} className="grid grid-cols-3 gap-4">
        <div>
          <RadioGroupItem value="mvola" id="mvola" className="peer sr-only" />
          <Label
            htmlFor="mvola"
            className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
          >
            <Smartphone className="mb-3 h-6 w-6 text-pink-600" />
            <span className="text-sm font-medium">MVola</span>
          </Label>
        </div>
        
        <div>
          <RadioGroupItem value="orange" id="orange" className="peer sr-only" disabled />
          <Label
            htmlFor="orange"
            className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-muted p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary opacity-50 cursor-not-allowed"
          >
            <Smartphone className="mb-3 h-6 w-6 text-orange-500" />
            <span className="text-sm font-medium">Orange Money</span>
            <span className="text-xs mt-1">Bientôt</span>
          </Label>
        </div>
        
        <div>
          <RadioGroupItem value="airtel" id="airtel" className="peer sr-only" disabled />
          <Label
            htmlFor="airtel"
            className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-muted p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary opacity-50 cursor-not-allowed"
          >
            <Smartphone className="mb-3 h-6 w-6 text-red-500" />
            <span className="text-sm font-medium">Airtel Money</span>
            <span className="text-xs mt-1">Bientôt</span>
          </Label>
        </div>
      </RadioGroup>

      {paymentMethod && (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="phone-number">Numéro de téléphone</Label>
            <Input
              id="phone-number"
              placeholder={paymentMethod === 'mvola' ? "034XXXXXXX" : "03XXXXXXXX"}
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              disabled={paymentStatus !== 'idle'}
            />
            <p className="text-sm text-muted-foreground">
              Entrez le numéro {paymentMethod === 'mvola' ? 'MVola' : paymentMethod === 'orange' ? 'Orange Money' : 'Airtel Money'} associé à votre compte
            </p>
          </div>

          {error && (
            <div className="bg-destructive/10 p-3 rounded-md flex items-start gap-2">
              <AlertCircle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}

          {paymentStatus === 'checking' && (
            <div className="bg-blue-50 p-3 rounded-md flex items-start gap-2">
              <Loader2 className="h-5 w-5 text-blue-500 flex-shrink-0 mt-0.5 animate-spin" />
              <div>
                <p className="text-sm font-medium text-blue-700">Transaction en cours</p>
                <p className="text-xs text-blue-600 mt-1">
                  Veuillez confirmer la transaction sur votre téléphone. 
                  La page sera mise à jour automatiquement.
                </p>
              </div>
            </div>
          )}

          {paymentStatus === 'success' && (
            <div className="bg-green-50 p-3 rounded-md flex items-start gap-2">
              <div className="h-5 w-5 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                <svg className="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <p className="text-sm font-medium text-green-800">
                Paiement effectué avec succès
              </p>
            </div>
          )}

          <button
            className={cn(
              "w-full py-2 px-4 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors",
              (paymentStatus !== 'idle' && paymentStatus !== 'failed') && "opacity-70 cursor-not-allowed",
              paymentStatus === 'processing' && "flex items-center justify-center"
            )}
            onClick={handleSubmitPayment}
            disabled={paymentStatus !== 'idle' && paymentStatus !== 'failed'}
          >
            {paymentStatus === 'processing' && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            {paymentStatus === 'processing' ? "Traitement en cours..." : 
             paymentStatus === 'checking' ? "En attente de confirmation..." :
             paymentStatus === 'success' ? "Payé" :
             "Payer maintenant"}
          </button>
        </div>
      )}
    </div>
  );
};

export default PaymentOptions;
