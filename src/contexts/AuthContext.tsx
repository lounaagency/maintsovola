import React, { createContext, useContext, useEffect, useState } from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { UserProfile } from "@/types/userProfile";

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  error: Error | null;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, userData: any) => Promise<void>;
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
        .select('*')
        .eq('id_utilisateur', userId)
        .single();

      if (error) {
        console.error("Error fetching profile:", error);
        return;
      }
      
      setProfile(data);
    } catch (error) {
      console.error("Error fetching profile:", error);
    }
  };

  const signUp = async (email: string, password: string, userData: any) => {
    try {
      setLoading(true);

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            nom: userData.nom,
            role: userData.role
          }
        }
      });

      if (error) throw error;
      if (!data.user) throw new Error("L'utilisateur n'a pas été créé.");
      
      console.log("Données utilisateur :", {
          id_utilisateur: data?.user?.id,
          email,
          nom: userData.nom,
          role: userData.role
        });

        toast.info(`Utilisateur: ${data?.user?.id}, Nom: ${userData.nom}, Rôle: ${userData.role}, Email: ${email}`);

      const { error: dbError } = await supabase.from("utilisateur").insert([
        {
          id_utilisateur: data.user.id,
          email: email,
          nom: userData.nom,
          role: userData.role
        }
      ]);

      if (dbError) throw dbError;

      toast.success("Inscription réussie ! Vérifiez votre email pour confirmer.");
      navigate("/feed");
    } catch (error: any) {
      toast.error(error.message || "Erreur lors de l'inscription");
      console.error("Error signing up:", error);
    } finally {
      setLoading(false);
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      setLoading(true);
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) throw error;
      
      toast.success("Connexion réussie !");
      navigate("/feed");
    } catch (error: any) {
      toast.error(error.message || "Erreur lors de la connexion");
      console.error("Error signing in:", error);
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
          role:id_role(nom_role)
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
        telephone: data.telephone,
        adresse: data.adresse,
        bio: data.bio,
        id_role: data.id_role,
        nom_role: data.role?.nom_role
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
