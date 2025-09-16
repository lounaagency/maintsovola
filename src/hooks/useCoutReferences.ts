import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface CoutReference {
  id_cout_jalon_reference: number;
  id_culture: number;
  id_jalon_agricole: number;
  type_depense: string;
  montant_par_hectare: number;
  unite: string;
  nom_culture?: string;
  nom_jalon?: string;
}

export const useCoutReferences = () => {
  const [couts, setCouts] = useState<CoutReference[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCouts = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('cout_jalon_reference')
        .select(`
          *,
          culture:id_culture(nom_culture),
          jalon_agricole:id_jalon_agricole(nom_jalon)
        `)
        .order('id_culture')
        .order('id_jalon_agricole')
        .order('type_depense');

      if (error) throw error;

      const formattedCouts = data?.map(cout => ({
        ...cout,
        nom_culture: cout.culture?.nom_culture,
        nom_jalon: cout.jalon_agricole?.nom_jalon
      })) || [];

      setCouts(formattedCouts);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCouts();
  }, []);

  const createCout = async (coutData: Omit<CoutReference, 'id_cout_jalon_reference' | 'nom_culture' | 'nom_jalon'>) => {
    try {
      const { data, error } = await supabase
        .from('cout_jalon_reference')
        .insert(coutData)
        .select()
        .single();

      if (error) throw error;
      
      await fetchCouts(); // Refresh list
      return data;
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  const updateCout = async (id: number, updates: Partial<CoutReference>) => {
    try {
      const { error } = await supabase
        .from('cout_jalon_reference')
        .update(updates)
        .eq('id_cout_jalon_reference', id);

      if (error) throw error;
      
      await fetchCouts(); // Refresh list
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  const deleteCout = async (id: number) => {
    try {
      const { error } = await supabase
        .from('cout_jalon_reference')
        .delete()
        .eq('id_cout_jalon_reference', id);

      if (error) throw error;
      
      await fetchCouts(); // Refresh list
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  return {
    couts,
    loading,
    error,
    createCout,
    updateCout,
    deleteCout,
    refetch: fetchCouts
  };
};

export const useCulturesAndJalons = () => {
  const [cultures, setCultures] = useState<any[]>([]);
  const [jalons, setJalons] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [culturesRes, jalonsRes] = await Promise.all([
          supabase.from('culture').select('*').order('nom_culture'),
          supabase.from('jalon_agricole').select('*').order('nom_jalon')
        ]);

        if (culturesRes.error) throw culturesRes.error;
        if (jalonsRes.error) throw jalonsRes.error;

        setCultures(culturesRes.data || []);
        setJalons(jalonsRes.data || []);
      } catch (error) {
        console.error('Error fetching cultures and jalons:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  return { cultures, jalons, loading };
};