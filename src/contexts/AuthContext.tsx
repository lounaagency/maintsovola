
import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { AuthSession, User } from '@supabase/supabase-js';
import { Navigate, useLocation } from 'react-router-dom';

interface UserProfile {
  id_utilisateur: string;
  nom: string;
  prenoms?: string;
  email: string;
  photo_profil?: string;
  photo_couverture?: string;
  adresse?: string;
  bio?: string;
  role?: string;
  id_role?: number;
  telephone?: string;
  nom_role?: string;
}

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ 
    error: Error | null;
    data: any | null;
  }>;
  signUp: (email: string, password: string, userData: any) => Promise<{
    error: Error | null;
    data: any | null;
  }>;
  signOut: () => Promise<void>;
  updateProfile: (updates: Partial<UserProfile>) => Promise<{
    error: Error | null;
    data: UserProfile | null;
  }>;
  session: AuthSession | null;
  // Ajout des méthodes manquantes pour les composants
  login: (credentials: { email?: string; phone?: string; password: string }) => Promise<void>;
  signup: (userData: any) => Promise<void>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<AuthSession | null>(null);

  useEffect(() => {
    const getInitialSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();

        setSession(session);
        setUser(session?.user ?? null);

        if (session?.user) {
          await fetchProfile(session.user.id);
        }
      } catch (error) {
        console.error('Error getting initial session:', error);
      } finally {
        setLoading(false);
      }
    };

    getInitialSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);

      if (session?.user) {
        await fetchProfile(session.user.id);
      } else {
        setProfile(null);
      }

      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('utilisateur')
        .select('*')
        .eq('id_utilisateur', userId)
        .single();

      if (error) {
        throw error;
      }

      if (data) {
        setProfile(data as UserProfile);
        
        // Also fetch phone numbers if needed
        const { data: phoneData } = await supabase
          .from('telephone')
          .select('*')
          .eq('id_utilisateur', userId);
        
        // We don't use error here as phone numbers are optional
        // if (phoneData) {
        //   // You can handle phone data if needed
        // }
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
    }
  };
  
  const refreshProfile = async () => {
    if (user) {
      await fetchProfile(user.id);
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      
      if (error) {
        throw error;
      }

      if (data.user) {
        await fetchProfile(data.user.id);
      }

      return { error: null, data };
    } catch (error: any) {
      console.error('Error during sign in:', error);
      return { error, data: null };
    }
  };

  // Méthode login pour LoginForm
  const login = async (credentials: { email?: string; phone?: string; password: string }) => {
    if (credentials.email) {
      await signIn(credentials.email, credentials.password);
    } else if (credentials.phone) {
      // Logique pour connexion par téléphone si nécessaire
      console.log("Login via phone not implemented yet");
    }
  };

  const signUp = async (email: string, password: string, userData: Partial<UserProfile>) => {
    try {
      // Create the auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({ email, password });
      
      if (authError) {
        throw authError;
      }

      if (authData?.user) {
        // Assurer que nom est présent (requis dans la base de données)
        if (!userData.nom) {
          userData.nom = email.split('@')[0]; // Valeur par défaut
        }
        
        // Create the profile
        const { error: profileError } = await supabase
          .from('utilisateur')
          .insert({
            id_utilisateur: authData.user.id,
            email,
            nom: userData.nom,
            prenoms: userData.prenoms,
            photo_profil: userData.photo_profil,
            role: userData.role,
            id_role: userData.id_role
          });
        
        if (profileError) {
          throw profileError;
        }

        await fetchProfile(authData.user.id);
      }

      return { error: null, data: authData };
    } catch (error: any) {
      console.error('Error during sign up:', error);
      return { error, data: null };
    }
  };

  // Méthode signup pour RegisterForm
  const signup = async (userData: any) => {
    await signUp(userData.email, userData.password, {
      nom: userData.nom,
      prenoms: userData.prenoms,
      // Autres champs de profil
    });
  };

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
      setProfile(null);
    } catch (error) {
      console.error('Error during sign out:', error);
    }
  };

  // Méthode logout pour Navbar
  const logout = async () => {
    await signOut();
  };

  const updateProfile = async (updates: Partial<UserProfile>) => {
    try {
      if (!user) {
        throw new Error('User not authenticated');
      }

      const { data, error } = await supabase
        .from('utilisateur')
        .update(updates)
        .eq('id_utilisateur', user.id)
        .select('*')
        .single();

      if (error) {
        throw error;
      }

      if (data) {
        setProfile(data as UserProfile);
      }

      return { error: null, data };
    } catch (error: any) {
      console.error('Error updating profile:', error);
      return { error, data: null };
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      profile,
      loading,
      signIn,
      signUp,
      signOut,
      updateProfile,
      session,
      login,
      signup,
      logout,
      refreshProfile,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const location = useLocation();
  
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-green-600 border-t-transparent"></div>
      </div>
    );
  }
  
  if (!user) {
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }
  
  return <>{children}</>;
}
