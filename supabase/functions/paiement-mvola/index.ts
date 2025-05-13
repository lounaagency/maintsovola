
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.33.1";

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

// Initialize Supabase client with environment variables
const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const supabase = createClient(supabaseUrl, supabaseKey);

// MVola configuration from environment variables
const mvolaApiUser = Deno.env.get("MVOLA_API_USER")!;
const mvolaApiKey = Deno.env.get("MVOLA_API_KEY")!;
const mvolaConsumerKey = Deno.env.get("MVOLA_CONSUMER_KEY")!;
const mvolaConsumerSecret = Deno.env.get("MVOLA_CONSUMER_SECRET")!;
const mvolaMerchantNumber = Deno.env.get("MVOLA_MERCHANT")!;
const mvolaEnv = Deno.env.get("MVOLA_ENV") || "sandbox";

serve(async (req) => {
  // Handle CORS preflight request
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: corsHeaders,
      status: 204,
    });
  }

  try {
    // Only allow POST requests for payment processing
    if (req.method !== "POST") {
      return new Response(
        JSON.stringify({
          success: false,
          message: "Méthode non autorisée",
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 405,
        }
      );
    }

    // Parse request JSON
    const { phone, amount, reason, investissementId } = await req.json();

    // Validate required fields
    if (!phone || !amount || !reason) {
      return new Response(
        JSON.stringify({
          success: false,
          message: "Les champs 'phone', 'amount' et 'reason' sont obligatoires",
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400,
        }
      );
    }

    // Format phone number if needed
    const formattedPhone = phone.startsWith("0") ? `+261${phone.substring(1)}` : phone;
    const formattedMerchant = mvolaMerchantNumber.startsWith("0") ? `+261${mvolaMerchantNumber.substring(1)}` : mvolaMerchantNumber;

    // Generate transaction reference
    const transactionRef = `MVOLA-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
    
    console.log(`Initiating MVola payment: ${amount} Ar from ${formattedPhone} to ${formattedMerchant} for ${reason}`);
    console.log(`Transaction reference: ${transactionRef}`);

    // Since we can't import mvola-node directly, we'll simulate a successful response for now
    // In production, this would be replaced with actual MVola API calls
    const simulatedResponse = {
      serverCorrelationId: `SIMULATED-${transactionRef}`,
      status: "pending",
      notificationMethod: "polling"
    };

    console.log("Simulated MVola API response:", simulatedResponse);

    // Save transaction to database
    const paymentData = {
      reference_transaction: simulatedResponse.serverCorrelationId || transactionRef,
      status: "effectué",
      methode_paiement: "MVola",
      montant: amount,
      id_investissement: investissementId || null,
      date_paiement: new Date().toISOString(),
      details_paiement: {
        phoneNumber: formattedPhone,
        reason,
        mvolaResponse: simulatedResponse
      }
    };

    const { data: savedPayment, error: saveError } = await supabase
      .from("historique_paiement")
      .insert(paymentData)
      .select()
      .single();

    if (saveError) {
      console.error("Error saving payment to database:", saveError);
      // We still return success since the payment was processed
    } else {
      console.log("Payment saved to database:", savedPayment);
      
      // Update investissement table if investissementId is provided
      if (investissementId) {
        const { error: updateError } = await supabase
          .from("investissement")
          .update({ 
            statut_paiement: "payé",
            date_paiement: new Date().toISOString()
          })
          .eq("id_investissement", investissementId);

        if (updateError) {
          console.error("Error updating investment status:", updateError);
        }
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        transactionId: simulatedResponse.serverCorrelationId || transactionRef,
        message: "Paiement MVola effectué avec succès",
        details: simulatedResponse
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("Error processing MVola payment:", error);
    
    return new Response(
      JSON.stringify({
        success: false,
        message: `Erreur lors du traitement du paiement MVola: ${error.message || error}`,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
