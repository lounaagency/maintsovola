
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const getMobileBankingNumbers = async (email: string) => {
  const { data, error } = await supabase
    .from("utilisateur")
    .select(`
      email,
      telephone(numero, type, est_mobile_banking)
    `)
    .eq("email", email)
    .eq("role.nom_role", "technicien");

  if (error) throw error;

  // Extraire les numéros Mobile Banking
  const numbers = data?.flatMap(item =>
    item.telephone.filter(phone =>
      phone.est_mobile_banking || phone.type === "mobile_banking"
    )
  ).map(phone => phone.numero) || [];

  return numbers;
};

export const useTechnicienMobileBanking = (email: string) => {
  return useQuery({
    queryKey: ["mobile-banking-numbers", email],
    queryFn: () => getMobileBankingNumbers(email),
    enabled: !!email,
  });
};

// This hook is deprecated - use useTechnicienMobileBanking instead
