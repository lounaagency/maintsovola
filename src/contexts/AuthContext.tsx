import React, { createContext, useContext, useEffect, useState } from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { UserProfile } from "@/types/userProfile";
import { isValidEmail } from "@/lib/utils";

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  error: Error | null;
  signIn: (identifier: string, password: string) => Promise<void>;
  signUp: (identifier: string, password: string, userData: any) => Promise<void>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  loading: true,
  error: null,
  signIn: async () => {},
  signUp: async () => {},
  signOut: async () => {},
  refreshProfile: async () => {},
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, newSession) => {
        setSession(newSession);
        setUser(newSession?.user ?? null);

        if (newSession?.user) {
          setTimeout(() => {
            fetchUserProfile(newSession.user.id);
          }, 0);
        } else {
          setProfile(null);
        }
      }
    );

    supabase.auth.getSession().then(({ data: { session: currentSession } }) => {
      setSession(currentSession);
      setUser(currentSession?.user ?? null);
      
      if (currentSession?.user) {
        fetchUserProfile(currentSession.user.id);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchUserProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('utilisateur')
        .select(`
          *,
          role:id_role(nom_role),
          telephones:telephone(*)
        `)
        .eq('id_utilisateur', userId)
        .single();

      if (error) {
        console.error("Error fetching profile:", error);
        return;
      }
      
      const userProfile: UserProfile = {
        id_utilisateur: data.id_utilisateur,
        id: data.id_utilisateur,
        nom: data.nom,
        prenoms: data.prenoms,
        email: data.email,
        photo_profil: data.photo_profil,
        photo_couverture: data.photo_couverture,
        telephone: data.telephones && data.telephones[0]?.numero,
        adresse: data.adresse || undefined,
        bio: data.bio || undefined,
        id_role: data.id_role,
        nom_role: data.role?.nom_role,
        telephones: data.telephones || []
      };
      
      setProfile(userProfile);
    } catch (error) {
      console.error("Error fetching profile:", error);
    }
  };

  const signUp = async (identifier: string, password: string, userData: any) => {
    try {
      setLoading(true);
      
      const isEmail = isValidEmail(identifier);
      
      const authData = {
        ...(isEmail ? { email: identifier } : {}),
        password,
        options: {
          data: {
            nom: userData.nom,
            prenoms: userData.prenoms,
            role: userData.role || 'simple',
            is_investor: userData.is_investor || false,
            is_farming_owner: userData.is_farming_owner || false
          }
        }
      };

      let { data, error };
      if (isEmail) {
        const result = await supabase.auth.signUp(authData);
        data = result.data;
        error = result.error;
      } else {
        const result = await supabase.auth.signUp({
          phone: identifier,
          password,
          options: authData.options
        });
        data = result.data;
        error = result.error;
      }

      if (error) throw error;
      if (!data.user) throw new Error("L'utilisateur n'a pas été créé.");
      
      let roleId = 1;
      if (userData.role === 'technicien') {
        roleId = 4;
      } else if (userData.role === 'superviseur') {
        roleId = 3;
      }
      
      const { error: dbError } = await supabase.from("utilisateur").insert([
        {
          id_utilisateur: data.user.id,
          email: isEmail ? identifier : userData.email,
          nom: userData.nom,
          prenoms: userData.prenoms,
          id_role: roleId
        }
      ]);

      if (dbError) throw dbError;
      
      if (!isEmail || userData.telephone) {
        const { error: phoneError } = await supabase.from("telephone").insert([
          {
            id_utilisateur: data.user.id,
            numero: isEmail ? userData.telephone : identifier,
            type: 'principal'
          }
        ]);
        
        if (phoneError) console.error("Error saving phone:", phoneError);
      }

      toast.success("Inscription réussie ! Vérifiez votre email pour confirmer.");
    } catch (error: any) {
      toast.error(error.message || "Erreur lors de l'inscription");
      console.error("Error signing up:", error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signIn = async (identifier: string, password: string) => {
    try {
      setLoading(true);
      
      const isEmail = isValidEmail(identifier);
      
      let authResponse;
      
      if (isEmail) {
        authResponse = await supabase.auth.signInWithPassword({
          email: identifier,
          password
        });
      } else {
        authResponse = await supabase.auth.signInWithPassword({
          phone: identifier,
          password
        });
      }
      
      const { data, error } = authResponse;
      
      if (error) throw error;
      
      toast.success("Connexion réussie !");
      navigate("/feed");
    } catch (error: any) {
      toast.error(error.message || "Erreur lors de la connexion");
      console.error("Error signing in:", error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    try {
      setLoading(true);
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      toast.success("Déconnexion réussie");
      navigate("/auth");
    } catch (error: any) {
      toast.error(error.message || "Erreur lors de la déconnexion");
    } finally {
      setLoading(false);
    }
  };

  const refreshProfile = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('utilisateur')
        .select(`
          *,
          role:id_role(nom_role),
          telephones:telephone(*)
        `)
        .eq('id_utilisateur', user.id)
        .single();
      
      if (error) throw error;
      
      const userProfile: UserProfile = {
        id_utilisateur: data.id_utilisateur,
        id: data.id_utilisateur,
        nom: data.nom,
        prenoms: data.prenoms,
        email: data.email,
        photo_profil: data.photo_profil,
        photo_couverture: data.photo_couverture,
        telephone: data.telephones && data.telephones[0]?.numero,
        adresse: data.adresse || undefined,
        bio: data.bio || undefined,
        id_role: data.id_role,
        nom_role: data.role?.nom_role,
        telephones: data.telephones || []
      };
      
      setProfile(userProfile);
      
    } catch (error) {
      console.error('Error refreshing user profile:', error);
    }
  };

  return (
    <AuthContext.Provider
      value={{ user, profile, loading, error, signIn, signUp, signOut, refreshProfile }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
