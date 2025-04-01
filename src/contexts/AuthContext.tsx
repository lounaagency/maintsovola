
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
      
      // Préparation du profil avec les téléphones s'ils existent
      const userProfile: UserProfile = {
        id_utilisateur: data.id_utilisateur,
        id: data.id_utilisateur,
        nom: data.nom,
        prenoms: data.prenoms,
        email: data.email,
        photo_profil: data.photo_profil,
        photo_couverture: data.photo_couverture,
        adresse: data.adresse || undefined,
        bio: data.bio || undefined,
        id_role: data.id_role,
        nom_role: data.role?.nom_role,
        telephones: data.telephones || []
      };
      
      // Ajouter la propriété name pour la compatibilité avec Messages.tsx
      userProfile.name = `${data.nom} ${data.prenoms || ''}`.trim();
      
      setProfile(userProfile);
      
    } catch (error) {
      console.error('Error refreshing user profile:', error);
    }
  };

  const signUp = async (identifier: string, password: string, userData: any) => {
    try {
      setLoading(true);
      
      // Déterminer si l'identifiant est un email ou un téléphone
      const isEmail = identifier.includes('@');
      
      // Configuration de base pour l'inscription
      const signUpData: any = {
        password,
        options: {
          data: {
            nom: userData.nom,
            prenoms: userData.prenoms,
            interests: userData.interests
          }
        }
      };
      
      // Ajouter l'email ou le téléphone selon le cas
      if (isEmail) {
        signUpData.email = identifier;
      } else {
        signUpData.phone = identifier;
      }
      
      // Effectuer l'inscription
      const { data, error } = await supabase.auth.signUp(signUpData);

      if (error) throw error;
      if (!data.user) throw new Error("L'utilisateur n'a pas été créé.");
      
      // Préparer les données pour la table utilisateur
      const userProfileData = {
        id_utilisateur: data.user.id,
        nom: userData.nom,
        prenoms: userData.prenoms || null,
        email: userData.email || null
      };

      // Insérer dans la table utilisateur
      const { error: dbError } = await supabase.from("utilisateur").insert([userProfileData]);

      if (dbError) throw dbError;
      
      // Si un numéro de téléphone est fourni, l'ajouter à la table telephone
      if (userData.telephone) {
        const { error: phoneError } = await supabase.from("telephone").insert([
          {
            id_utilisateur: data.user.id,
            numero: userData.telephone,
            type: "principal"
          }
        ]);
        
        if (phoneError) console.error("Erreur lors de l'ajout du téléphone:", phoneError);
      }

      toast.success("Inscription réussie ! Vérifiez votre email pour confirmer votre compte.");
    } catch (error: any) {
      toast.error(error.message || "Erreur lors de l'inscription");
      throw error;
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
        adresse: data.adresse || undefined,
        bio: data.bio || undefined,
        id_role: data.id_role,
        nom_role: data.role?.nom_role,
        telephones: data.telephones || []
      };
      
      // Ajouter la propriété name pour la compatibilité avec Messages.tsx
      userProfile.name = `${data.nom} ${data.prenoms || ''}`.trim();
      
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
