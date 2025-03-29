
import React, { createContext, useContext, useEffect, useState } from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { UserProfile } from "@/types/userProfile";

interface AuthContextType {
  session: Session | null;
  user: User | null;
  profile: UserProfile | null;
  signUp: (email: string, password: string, userData: { nom: string; role: string }) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, newSession) => {
        setSession(newSession);
        setUser(newSession?.user ?? null);

        if (newSession?.user) {
          // Defer Supabase calls with setTimeout to prevent deadlocks
          setTimeout(() => {
            fetchUserProfile(newSession.user.id);
          }, 0);
        } else {
          setProfile(null);
        }
      }
    );

    // THEN check for existing session
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
      .eq('id_utilisateur', userId) // Utilisation du paramètre userId
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


const signUp = async (email: string, password: string, userData: { nom: string; role: string }) => {
  try {
    setLoading(true);

    // Inscription de l'utilisateur via Supabase Auth
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

    // Ajout manuel de l'utilisateur dans la table "utilisateur"
    const { error: dbError } = await supabase.from("utilisateur").insert([
      {
        id_utilisateur: data.user.id,  // Utiliser l'ID généré par Supabase Auth
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

  return (
    <AuthContext.Provider
      value={{
        session,
        user,
        profile,
        signUp,
        signIn,
        signOut,
        loading
      }}
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
