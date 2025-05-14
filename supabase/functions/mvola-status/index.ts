
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.33.1";
import { Buffer } from "https://deno.land/std@0.177.0/node/buffer.ts";

// MVola API client implementation (simplified version)
class MVola {
  private consumerKey: string;
  private consumerSecret: string;
  private apiUser: string;
  private apiKey: string;
  private mode: 'sandbox' | 'production';
  private baseUrl: string;

  constructor(options: {
    consumerKey: string;
    consumerSecret: string;
    apiUser: string;
    apiKey: string;
    mode?: 'sandbox' | 'production';
  }) {
    this.consumerKey = options.consumerKey;
    this.consumerSecret = options.consumerSecret;
    this.apiUser = options.apiUser;
    this.apiKey = options.apiKey;
    this.mode = options.mode || 'sandbox';
    this.baseUrl = this.mode === 'sandbox' 
      ? 'https://api.sandbox.mvola.mg'
      : 'https://api.mvola.mg';
  }

  // Generate basic auth header for token requests
  private getBasicAuthHeader() {
    const credentials = `${this.consumerKey}:${this.consumerSecret}`;
    const encodedCredentials = Buffer.from(credentials).toString('base64');
    return `Basic ${encodedCredentials}`;
  }

  // Get access token
  private async getAccessToken() {
    const tokenEndpoint = 'https://developer.mvola.mg/oauth2/token';
    
    try {
      const response = await fetch(tokenEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': this.getBasicAuthHeader(),
        },
        body: 'grant_type=client_credentials',
      });
      
      if (!response.ok) {
        throw new Error(`Failed to get token: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      return data.access_token;
    } catch (error) {
      console.error('Error getting access token:', error);
      throw error;
    }
  }

  // Generate API headers
  private async getApiHeaders() {
    const token = await this.getAccessToken();
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      'X-Target-Environment': this.mode,
      'Cache-Control': 'no-cache',
      'Ocp-Apim-Subscription-Key': this.apiKey,
      'X-Correlation-ID': `${Date.now()}`,
      'Version': '1.0',
    };
  }

  // Get transaction status
  async getTransactionStatus(serverCorrelationId: string) {
    try {
      const headers = await this.getApiHeaders();
      const url = `${this.baseUrl}/mvola/mm/transactions/type/merchantpay/1.0.0/${serverCorrelationId}`;
      
      const response = await fetch(url, {
        method: 'GET',
        headers,
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Get transaction status error: ${response.status} ${response.statusText} - ${errorText}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error getting transaction status:', error);
      throw error;
    }
  }
}

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
const mvolaConsumerKey = Deno.env.get("MVOLA_CONSUMER_KEY") || "ENc6AOYG1iVILQ0HIOIqaBo_Oj8a";
const mvolaConsumerSecret = Deno.env.get("MVOLA_CONSUMER_SECRET") || "If1mgy3kGnNdcRfz8QRfxZaDZd4a";
const mvolaApiUser = Deno.env.get("MVOLA_API_USER") || "maintsovola";
const mvolaApiKey = Deno.env.get("MVOLA_API_KEY") || "eyJ4NXQjUzI1NiI6Ik1ESmxOakl4TjJFMU9HWmxPR1ZtTUdReE9URmxNekJtTm1GalpqUTBZMll3T0dZME4ySTBZekU0WXpaak5qUmhZbVJtTW1RME9EZGlORGhqTUdFd01BPT0iLCJraWQiOiJnYXRld2F5X2NlcnRpZmljYXRlX2FsaWFzIiwidHlwIjoiSldUIiwiYWxnIjoiUlMyNTYifQ==.eyJzdWIiOiJsYXJyeXNAbWFpbnRzb3ZvbGEuY29tQGNhcmJvbi5zdXBlciIsImFwcGxpY2F0aW9uIjp7Im93bmVyIjoibGFycnlzQG1haW50c292b2xhLmNvbSIsInRpZXJRdW90YVR5cGUiOm51bGwsInRpZXIiOiI1MFBlck1pbiIsIm5hbWUiOiJtYWludHNvdm9sYSIsImlkIjo3NjQsInV1aWQiOiI1MGQzMDI0Zi0wMzYxLTQ3ZWQtOTIzYy0wYmJlODNjMDBkMzQifSwiaXNzIjoiaHR0cHM6XC9cL2RldmVsb3Blci5tdm9sYS5tZ1wvb2F1dGgyXC90b2tlbiIsInRpZXJJbmZvIjp7IkJyb256ZSI6eyJ0aWVyUXVvdGFUeXBlIjoicmVxdWVzdENvdW50IiwiZ3JhcGhRTE1heENvbXBsZXhpdHkiOjAsImdyYXBoUUxNYXhEZXB0aCI6MCwic3RvcE9uUXVvdGFSZWFjaCI6dHJ1ZSwic3Bpa2VBcnJlc3RMaW1pdCI6MCwic3Bpa2VBcnJlc3RVbml0IjpudWxsfX0sImtleXR5cGUiOiJTQU5EQk9YIiwicGVybWl0dGVkUmVmZXJlciI6IiIsInN1YnNjcmliZWRBUElzIjpbeyJzdWJzY3JpYmVyVGVuYW50RG9tYWluIjoiY2FyYm9uLnN1cGVyIiwibmFtZSI6Ik1WT0xBLU1lcmNoYW50LVBheS1BUEkiLCJjb250ZXh0IjoiXC9tdm9sYVwvbW1cL3RyYW5zYWN0aW9uc1wvdHlwZVwvbWVyY2hhbnRwYXlcLzEuMC4wIiwicHVibGlzaGVyIjoiYWRtaW4iLCJ2ZXJzaW9uIjoiMS4wLjAiLCJzdWJzY3JpcHRpb25UaWVyIjoiQnJvbnplIn1dLCJ0b2tlbl90eXBlIjoiYXBpS2V5IiwicGVybWl0dGVkSVAiOiIiLCJpYXQiOjE3NDcyMDI4MTcsImp0aSI6ImZiNGFkYzIxLTY3NTQtNGU4Ni05NGU0LWJlZDhiMWFhYjE5MyJ9.QTR3v2IhKROas1dMYvkZ-h4qj4f_mGbFhq_On4IFaP_UjYa6rrSp0DuNuTw0lDR8vESMgPgv7mvk4Exw7VInYDBr8POdZI-xhW2AcWU5S-4ZH9IiJSLEpfZLDySB7WJ91x5xDDBW4wM9KWsEcKsHCzaqvZWCZv0gWHXGQcpteMlwNtsnVzU2CuaPTNrcVy--7U563YPtuFdno5mkFDUGg-9UBsz7ZSYPgMiTy0H2x_Dgl31_j9vzxSjbonSLRW6djPAUAlKYqXr7TZrvPWTLIWm27UKoa4skRmDqale1FYXZNd4XhY6FGhVRO_-Y0OfV0QgHpurzNjltxX1mMXpXnA==";
const mvolaEnv = Deno.env.get("MVOLA_ENV") || "sandbox";

// Initialize MVola client
const mvolaClient = new MVola({
  consumerKey: mvolaConsumerKey,
  consumerSecret: mvolaConsumerSecret,
  apiUser: mvolaApiUser,
  apiKey: mvolaApiKey,
  mode: mvolaEnv as 'sandbox' | 'production',
});

serve(async (req) => {
  // Handle CORS preflight request
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: corsHeaders,
      status: 204,
    });
  }

  try {
    // Only allow POST requests
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
    const { transactionId } = await req.json();

    // Validate required fields
    if (!transactionId) {
      return new Response(
        JSON.stringify({
          success: false,
          message: "Le champ 'transactionId' est obligatoire",
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400,
        }
      );
    }

    console.log(`Checking status for transaction: ${transactionId}`);

    try {
      // Get transaction status from MVola API
      const statusResponse = await mvolaClient.getTransactionStatus(transactionId);
      console.log("Transaction status response:", statusResponse);
      
      // Determine status based on MVola response
      let paymentStatus = "en_attente";
      
      if (statusResponse.status === "completed" || statusResponse.status === "successful") {
        paymentStatus = "effectué";
      } else if (statusResponse.status === "failed" || statusResponse.status === "rejected") {
        paymentStatus = "échoué";
      }

      // Update payment status in database
      const { data: payment, error: fetchError } = await supabase
        .from("historique_paiement")
        .select("*")
        .eq("reference_transaction", transactionId)
        .single();
      
      if (fetchError) {
        console.error("Error fetching payment:", fetchError);
        throw new Error("Impossible de trouver le paiement associé");
      }

      // Update payment status
      const { error: updateError } = await supabase
        .from("historique_paiement")
        .update({
          status: paymentStatus,
          details_paiement: {
            ...payment.details_paiement,
            statusResponse
          }
        })
        .eq("reference_transaction", transactionId);

      if (updateError) {
        console.error("Error updating payment status:", updateError);
      } else {
        console.log(`Payment status updated to: ${paymentStatus}`);
      }

      // If payment is successful, update investment status
      if (paymentStatus === "effectué" && payment.id_investissement) {
        const { error: investmentError } = await supabase
          .from("investissement")
          .update({
            statut_paiement: "payé",
            date_paiement: new Date().toISOString()
          })
          .eq("id_investissement", payment.id_investissement);

        if (investmentError) {
          console.error("Error updating investment status:", investmentError);
        } else {
          console.log(`Investment ${payment.id_investissement} status updated to paid`);
        }
      }

      return new Response(
        JSON.stringify({
          success: true,
          status: paymentStatus,
          details: statusResponse
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        }
      );
    } catch (mvolaError) {
      console.error("MVola API error:", mvolaError);

      return new Response(
        JSON.stringify({
          success: false,
          message: `Erreur lors de la vérification du statut: ${mvolaError.message || "Erreur inconnue"}`,
          details: mvolaError
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 500,
        }
      );
    }
  } catch (error) {
    console.error("Error checking transaction status:", error);
    
    return new Response(
      JSON.stringify({
        success: false,
        message: `Erreur lors de la vérification du statut: ${error.message || error}`,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
