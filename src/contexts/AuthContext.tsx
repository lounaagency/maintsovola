import React, {
  createContext,
  useState,
  useEffect,
  useContext,
  ReactNode,
} from "react";
import {
  Session,
  User,
  AuthChangeEvent,
  SignUpWithPasswordCredentials,
} from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { UserProfile, UserTelephone } from "@/types/userProfile";
import { toast } from "sonner";

interface AuthContextType {
  session: Session | null;
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  signUp: (
    email: string,
    password: string,
    userData: {
      nom: string;
      prenoms: string;
      role: string;
      is_investor: boolean;
      is_farming_owner: boolean;
    }
  ) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  updateProfile: (updates: {
    nom?: string;
    prenoms?: string;
    email?: string;
    photo_profil?: string;
    photo_couverture?: string;
    adresse?: string;
    bio?: string;
    is_investor?: boolean;
    is_farming_owner?: boolean;
  }) => Promise<void>;
  addTelephone: (telephone: Omit<UserTelephone, 'id_telephone' | 'created_at' | 'modified_at'>) => Promise<void>;
  updateTelephone: (telephone: UserTelephone) => Promise<void>;
  deleteTelephone: (id_telephone: number) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getInitialSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      setSession(session);
      setUser(session?.user || null);
      setLoading(false);
    };

    getInitialSession();

    supabase.auth.onAuthStateChange(
      async (event: AuthChangeEvent, session: Session | null) => {
        setSession(session);
        setUser(session?.user || null);
        if (session?.user) {
          const userProfile = await getUserProfile(session.user.id);
          setProfile(userProfile);
        } else {
          setProfile(null);
        }
      }
    );
  }, []);

  useEffect(() => {
    if (user) {
      getUserProfile(user.id)
        .then((userProfile) => {
          setProfile(userProfile);
        })
        .catch((error) => {
          console.error("Error fetching user profile:", error);
        });
    } else {
      setProfile(null);
    }
  }, [user]);

  const signUp = async (
    email: string,
    password: string,
    userData: {
      nom: string;
      prenoms: string;
      role: string;
      is_investor: boolean;
      is_farming_owner: boolean;
    }
  ) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            nom: userData.nom,
            prenoms: userData.prenoms,
            role: userData.role,
            is_investor: userData.is_investor,
            is_farming_owner: userData.is_farming_owner,
          },
        },
      });

      if (error) {
        throw error;
      }

      toast.success("Inscription réussie ! Veuillez vérifier votre email.");
    } catch (error: any) {
      console.error("Error signing up:", error);
      toast.error(
        error.message || "Une erreur est survenue lors de l'inscription."
      );
    } finally {
      setLoading(false);
    }
  };

  const signIn = async (email: string, password: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email,
        password: password,
      });

      if (error) {
        throw error;
      }
      toast.success("Connexion réussie !");
    } catch (error: any) {
      console.error("Error signing in:", error);
      toast.error(
        error.message || "Une erreur est survenue lors de la connexion."
      );
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        throw error;
      }
      toast.success("Déconnexion réussie !");
    } catch (error: any) {
      console.error("Error signing out:", error);
      toast.error(
        error.message || "Une erreur est survenue lors de la déconnexion."
      );
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async (updates: {
    nom?: string;
    prenoms?: string;
    email?: string;
    photo_profil?: string;
    photo_couverture?: string;
    adresse?: string;
    bio?: string;
    is_investor?: boolean;
    is_farming_owner?: boolean;
  }) => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("utilisateur")
        .update(updates)
        .eq("id_utilisateur", user?.id);

      if (error) {
        throw error;
      }

      // Optimistically update the profile in the context
      setProfile((prevProfile) => {
        return prevProfile ? { ...prevProfile, ...updates } : null;
      });

      toast.success("Profil mis à jour avec succès !");
    } catch (error: any) {
      console.error("Error updating profile:", error);
      toast.error(
        error.message || "Une erreur est survenue lors de la mise à jour du profil."
      );
    } finally {
      setLoading(false);
    }
  };

  const addTelephone = async (telephone: Omit<UserTelephone, 'id_telephone' | 'created_at' | 'modified_at'>) => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("telephone")
        .insert([{ ...telephone, id_utilisateur: user?.id }]);
  
      if (error) {
        throw error;
      }
  
      // Refresh user profile to get updated telephones
      const updatedProfile = await getUserProfile(user?.id || '');
      setProfile(updatedProfile);
  
      toast.success("Téléphone ajouté avec succès !");
    } catch (error: any) {
      console.error("Error adding telephone:", error);
      toast.error(
        error.message || "Une erreur est survenue lors de l'ajout du téléphone."
      );
    } finally {
      setLoading(false);
    }
  };
  
  const updateTelephone = async (telephone: UserTelephone) => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("telephone")
        .update(telephone)
        .eq("id_telephone", telephone.id_telephone);
  
      if (error) {
        throw error;
      }
  
      // Refresh user profile to get updated telephones
      const updatedProfile = await getUserProfile(user?.id || '');
      setProfile(updatedProfile);
  
      toast.success("Téléphone mis à jour avec succès !");
    } catch (error: any) {
      console.error("Error updating telephone:", error);
      toast.error(
        error.message || "Une erreur est survenue lors de la mise à jour du téléphone."
      );
    } finally {
      setLoading(false);
    }
  };
  
  const deleteTelephone = async (id_telephone: number) => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("telephone")
        .delete()
        .eq("id_telephone", id_telephone);
  
      if (error) {
        throw error;
      }
  
      // Refresh user profile to get updated telephones
      const updatedProfile = await getUserProfile(user?.id || '');
      setProfile(updatedProfile);
  
      toast.success("Téléphone supprimé avec succès !");
    } catch (error: any) {
      console.error("Error deleting telephone:", error);
      toast.error(
        error.message || "Une erreur est survenue lors de la suppression du téléphone."
      );
    } finally {
      setLoading(false);
    }
  };

  const getUserProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from("utilisateur")
        .select("*")
        .eq("id_utilisateur", userId)
        .single();

      if (error) throw error;

      // Get user's telephones
      const { data: telephonesData, error: telephonesError } = await supabase
        .from("telephone")
        .select("*")
        .eq("id_utilisateur", userId);

      if (telephonesError) throw telephonesError;

      // Map telephone data to match UserTelephone type
      const formattedTelephones = telephonesData.map(tel => ({
        ...tel,
        type: tel.type as "principal" | "whatsapp" | "mobile_banking" | "autre"
      }));

      return {
        ...data,
        telephones: formattedTelephones
      };
    } catch (error) {
      console.error("Error getting user profile:", error);
      return null;
    }
  };

  const value: AuthContextType = {
    session,
    user,
    profile,
    loading,
    signUp,
    signIn,
    signOut,
    updateProfile,
    addTelephone,
    updateTelephone,
    deleteTelephone,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export { AuthProvider, useAuth };
