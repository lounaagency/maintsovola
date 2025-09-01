import React, { useState, useEffect } from 'react';
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Smartphone, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { UserTelephone } from "@/types/userProfile";
import { useAuth } from "@/contexts/AuthContext";

// Importe le nouveau hook ici
import useMvola from '@/hooks/use-mvola'; // chemin relatif selon la struture

type PaymentMethod = 'mvola' | 'orange' | 'airtel' | null;

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
  const { user } = useAuth();
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(null);
  const [phoneNumber, setPhoneNumber] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [userPhones, setUserPhones] = useState<UserTelephone[]>([]);

  // Utilise le hook useMvola ici
  const {
    initiatePayment,
    checkTransactionStatus,
    loading,
    error: mvolaError,
  } = useMvola();

  useEffect(() => {
    if (user) {
      fetchUserPhoneNumbers();
    }
  }, [user]);

  const fetchUserPhoneNumbers = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('telephone')
        .select('*')
        .eq('id_utilisateur', user.id);

      if (error) throw error;
      setUserPhones((data || []) as UserTelephone[]);
    } catch (err) {
      console.error("Error fetching user phone numbers:", err);
    }
  };

  const handlePaymentMethodChange = (value: string) => {
    const method = value as PaymentMethod;
    setPaymentMethod(method);
    setError(null);
    
    // Pre-fill phone number based on payment method
    if (user && userPhones.length > 0) {
      let matchingPhoneType: string;
      
      switch (method) {
        case 'mvola':
          matchingPhoneType = 'mvola';
          break;
        case 'orange':
          matchingPhoneType = 'orange_money';
          break;
        case 'airtel':
          matchingPhoneType = 'airtel_money';
          break;
        default:
          matchingPhoneType = '';
      }
      
      const matchingPhone = userPhones.find(phone => phone.type === matchingPhoneType);
      if (matchingPhone) {
        setPhoneNumber(matchingPhone.numero);
      }
    }
  };

  const validatePhoneNumber = (number: string): boolean => {
    const regex = /^0[34][0-9]{8}$/; // MVola, Orange Money, or Airtel Money number in Madagascar
    return regex.test(number);
  };

  const handleSubmitPayment = async () => {
    if (!paymentMethod) {
      setError("Veuillez sélectionner une méthode de paiement");
      return;
    }

    if (!validatePhoneNumber(phoneNumber)) {
      setError("Veuillez entrer un numéro de téléphone valide (ex: 034XXXXXXX ou 033XXXXXXX)");
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      if (paymentMethod === 'mvola') {
        // Process MVola payment via edge function
        const result = await initiatePayment({
          amount: amount.toString(),
          phoneNumber: phoneNumber,
          description: `Investissement Maintso Vola #${investmentId}`,
          merchantId: "YOUR_MERCHANT_ID", // This will be handled by the edge function
          investmentId: investmentId || 0
        });

        if (!result || !result.success) {
          throw new Error(result?.message || mvolaError || "Échec du paiement MVola");
        }

        // Paiement réussi
        toast.success("Paiement effectué avec succès", {
          description: "Votre investissement a été enregistré et payé"
        });

        onPaymentComplete?.(true, result.transactionId);

      } else {
        // Handle other payment methods (not implemented yet)
        toast.info(`Le paiement par ${paymentMethod === 'orange' ? 'Orange Money' : 'Airtel Money'} sera disponible prochainement`, {
          description: "Nous vous notifierons lorsque cette méthode sera disponible"
        });
        
        // Consider this as a successful transaction for now
        onPaymentComplete?.(true);
      }
    } catch (err) {
      console.error("Payment error:", err);
      setError(err instanceof Error ? err.message : "Une erreur est survenue lors du traitement du paiement");
      toast.error("Échec du paiement", {
        description: (err instanceof Error ? err.message : "Une erreur inconnue est survenue") || "Veuillez réessayer ou choisir une autre méthode de paiement"
      });
      onPaymentComplete?.(false);
    } finally {
      setIsProcessing(false);
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
              placeholder="034XXXXXXX"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              disabled={isProcessing}
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

          <button
            className={cn(
              "w-full py-2 px-4 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors",
              isProcessing && "opacity-70 cursor-not-allowed"
            )}
            onClick={handleSubmitPayment}
            disabled={isProcessing}
          >
            {isProcessing ? "Traitement en cours..." : "Payer maintenant"}
          </button>
        </div>
      )}
    </div>
  );
};

export default PaymentOptions;
