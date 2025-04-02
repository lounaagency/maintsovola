
import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { UserProfile, UserTelephone } from '@/types/userProfile';

interface AuthContextType {
  user: any | null;
  profile: UserProfile | null;
  loading: boolean;
  login: (credentials: { email?: string; phone?: string; password: string }) => Promise<void>;
  signup: (credentials: { nom: string; prenoms?: string; email?: string; phone?: string; password: string; is_investor?: boolean; is_farming_owner?: boolean; }) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (data: Partial<UserProfile>) => Promise<void>;
  isSimpleUser: () => boolean;
  isTechnicien: () => boolean;
  isSuperviseur: () => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<any | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Initialize the auth state
  useEffect(() => {
    const initialize = async () => {
      try {
        setLoading(true);
        
        // Check current session
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          throw sessionError;
        }

        if (session?.user) {
          setUser(session.user);
          await fetchUserProfile(session.user.id);
        }
      } catch (error) {
        console.error('Error during auth initialization:', error);
      } finally {
        setLoading(false);
      }
    };

    initialize();

    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        setUser(session.user);
        await fetchUserProfile(session.user.id);
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
        setProfile(null);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const fetchUserProfile = async (userId: string) => {
    try {
      // Get user profile
      const { data: profileData, error: profileError } = await supabase
        .from('utilisateur')
        .select(`
          *,
          role:id_role(nom_role),
          telephones:telephone(*)
        `)
        .eq('id_utilisateur', userId)
        .single();

      if (profileError) {
        throw profileError;
      }

      // Get telephones data separately if there was an error in the join
      let telephones: UserTelephone[] = [];
      if (!profileData.telephones || profileData.telephones.error) {
        const { data: telephonesData } = await supabase
          .from('telephone')
          .select('*')
          .eq('id_utilisateur', userId);
        
        if (telephonesData) {
          telephones = telephonesData;
        }
      } else {
        telephones = profileData.telephones;
      }

      setProfile({
        ...profileData,
        telephones: telephones || []
      });
    } catch (error) {
      console.error('Error fetching user profile:', error);
    }
  };

  const login = async (credentials: { email?: string; phone?: string; password: string }) => {
    try {
      setLoading(true);
      
      if (!credentials.email && !credentials.phone) {
        throw new Error('Veuillez fournir un email ou un numéro de téléphone');
      }

      // Try email login first if provided
      if (credentials.email) {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: credentials.email,
          password: credentials.password,
        });

        if (error) {
          // If email login fails and phone is provided, try phone login
          if (credentials.phone) {
            console.log('Email login failed, trying phone number...');
          } else {
            throw error;
          }
        } else if (data.user) {
          // Email login succeeded
          setUser(data.user);
          await fetchUserProfile(data.user.id);
          toast.success('Connexion réussie');
          navigate('/feed');
          return;
        }
      }

      // Try phone login if provided
      if (credentials.phone) {
        // First, find the user ID by phone number
        const { data: userData, error: userError } = await supabase
          .from('telephone')
          .select('id_utilisateur')
          .eq('numero', credentials.phone)
          .single();

        if (userError) {
          throw new Error('Numéro de téléphone non trouvé');
        }

        // Then sign in with the user ID
        const { data, error } = await supabase.auth.signInWithPassword({
          email: userData.id_utilisateur, // Using user ID as email for this special case
          password: credentials.password,
        });

        if (error) {
          throw error;
        }

        if (data.user) {
          setUser(data.user);
          await fetchUserProfile(data.user.id);
          toast.success('Connexion réussie');
          navigate('/feed');
          return;
        }
      }

      // If we reach here, both login methods failed
      throw new Error('Les identifiants sont incorrects');
    } catch (error: any) {
      console.error('Login error:', error);
      toast.error(error.message || 'Erreur de connexion. Veuillez réessayer.');
    } finally {
      setLoading(false);
    }
  };

  const signup = async (credentials: { 
    nom: string; 
    prenoms?: string; 
    email?: string; 
    phone?: string; 
    password: string; 
    is_investor?: boolean; 
    is_farming_owner?: boolean;
  }) => {
    try {
      setLoading(true);
      
      if (!credentials.email && !credentials.phone) {
        throw new Error('Veuillez fournir un email ou un numéro de téléphone');
      }

      if (!credentials.nom) {
        throw new Error('Le nom est requis');
      }

      // Register with email if provided
      let userId: string;
      
      if (credentials.email) {
        const { data, error } = await supabase.auth.signUp({
          email: credentials.email,
          password: credentials.password,
          options: {
            data: {
              nom: credentials.nom,
              prenoms: credentials.prenoms,
              role: 'simple', // Default role for new users
              is_investor: credentials.is_investor,
              is_farming_owner: credentials.is_farming_owner
            }
          }
        });

        if (error) throw error;
        if (!data.user) throw new Error('La création de compte a échoué');
        
        userId = data.user.id;
      } else {
        // Create auth user with a special format for phone users
        // Using a random email since Supabase requires email
        const randomEmail = `phone_${Date.now()}_${Math.random().toString(36).substring(2, 15)}@example.com`;
        
        const { data, error } = await supabase.auth.signUp({
          email: randomEmail,
          password: credentials.password,
          options: {
            data: {
              nom: credentials.nom,
              prenoms: credentials.prenoms,
              phone: credentials.phone,
              role: 'simple', // Default role for new users
              is_investor: credentials.is_investor,
              is_farming_owner: credentials.is_farming_owner
            }
          }
        });

        if (error) throw error;
        if (!data.user) throw new Error('La création de compte a échoué');
        
        userId = data.user.id;
      }

      // Create the user profile in the utilisateur table
      const { error: profileError } = await supabase
        .from('utilisateur')
        .insert({
          id_utilisateur: userId,
          nom: credentials.nom,
          prenoms: credentials.prenoms || null,
          email: credentials.email || null,
          id_role: 1, // Role ID for 'simple' user
        });

      if (profileError) throw profileError;

      // Add phone number if provided
      if (credentials.phone) {
        const { error: phoneError } = await supabase
          .from('telephone')
          .insert({
            id_utilisateur: userId,
            numero: credentials.phone,
            type: 'principal',
            est_whatsapp: false,
            est_mobile_banking: false
          });

        if (phoneError) throw phoneError;
      }

      toast.success('Compte créé avec succès. Veuillez vous connecter.');
      
      // Automatically log in the user
      if (credentials.email) {
        await login({ email: credentials.email, password: credentials.password });
      } else if (credentials.phone) {
        await login({ phone: credentials.phone, password: credentials.password });
      }
    } catch (error: any) {
      console.error('Signup error:', error);
      toast.error(error.message || 'Erreur lors de la création du compte. Veuillez réessayer.');
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      setLoading(true);
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      setUser(null);
      setProfile(null);
      navigate('/');
      toast.success('Déconnexion réussie');
    } catch (error: any) {
      console.error('Logout error:', error);
      toast.error(error.message || 'Erreur lors de la déconnexion. Veuillez réessayer.');
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async (data: Partial<UserProfile>) => {
    try {
      if (!user) throw new Error('Utilisateur non connecté');
      
      setLoading(true);
      
      // Update the utilisateur table
      const { error } = await supabase
        .from('utilisateur')
        .update({
          nom: data.nom,
          prenoms: data.prenoms,
          email: data.email,
          bio: data.bio,
          adresse: data.adresse,
          photo_profil: data.photo_profil,
          photo_couverture: data.photo_couverture
          // id_role should not be updated by the user
        })
        .eq('id_utilisateur', user.id);
      
      if (error) throw error;

      // Handle telephones separately if provided
      if (data.telephones && data.telephones.length > 0) {
        // First, delete existing telephones
        const { error: deleteError } = await supabase
          .from('telephone')
          .delete()
          .eq('id_utilisateur', user.id);
        
        if (deleteError) throw deleteError;
        
        // Then insert new telephones
        const telephonesData = data.telephones.map(phone => ({
          id_utilisateur: user.id,
          numero: phone.numero,
          type: phone.type,
          est_whatsapp: phone.est_whatsapp,
          est_mobile_banking: phone.est_mobile_banking
        }));
        
        const { error: insertError } = await supabase
          .from('telephone')
          .insert(telephonesData);
        
        if (insertError) throw insertError;
      }
      
      // Fetch updated profile
      await fetchUserProfile(user.id);
      
      toast.success('Profil mis à jour avec succès');
    } catch (error: any) {
      console.error('Update profile error:', error);
      toast.error(error.message || 'Erreur lors de la mise à jour du profil. Veuillez réessayer.');
    } finally {
      setLoading(false);
    }
  };

  // User role helper functions
  const isSimpleUser = () => {
    return profile?.role?.nom_role === 'simple';
  };

  const isTechnicien = () => {
    return profile?.role?.nom_role === 'technicien';
  };

  const isSuperviseur = () => {
    return profile?.role?.nom_role === 'superviseur';
  };

  const contextValue: AuthContextType = {
    user,
    profile,
    loading,
    login,
    signup,
    logout,
    updateProfile,
    isSimpleUser,
    isTechnicien,
    isSuperviseur
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
