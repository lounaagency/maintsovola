
import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { UserProfile } from "@/types/userProfile";
import ProfileHeader from "@/components/profile/ProfileHeader";
import ProfileTabs from "@/components/profile/ProfileTabs";
import { useToast } from "@/components/ui/toast";

const Profile = () => {
  const { id } = useParams();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isCurrentUser, setIsCurrentUser] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followersCount, setFollowersCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [projectsCount, setProjectsCount] = useState(0);
  const { toast } = useToast();
  
  // Helper function to check if data is valid
  const isSelectQueryError = (data: any): boolean => {
    return !data || typeof data !== 'object';
  };

  const handleFollowToggle = async () => {
    // Placeholder function for the follow toggle action
    setIsFollowing(!isFollowing);
    return Promise.resolve();
  };

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
      
      if (error) throw error;
      
      const telephones = data.telephones || [];
      const mappedTelephones = telephones.map((tel: any) => ({
        id_telephone: tel.id_telephone,
        id_utilisateur: tel.id_utilisateur,
        numero: tel.numero,
        type: tel.type as "principal" | "whatsapp" | "mvola" | "orange_money" | "airtel_money" | "autre" | "mobile_banking",
        est_whatsapp: tel.est_whatsapp,
        est_mobile_banking: tel.est_mobile_banking,
        created_at: tel.created_at || new Date().toISOString(),
        modified_at: tel.modified_at || new Date().toISOString()
      }));
      
      setProfile({
        id_utilisateur: isSelectQueryError(data) ? '' : data.id_utilisateur,
        id: isSelectQueryError(data) ? '' : data.id_utilisateur,
        nom: isSelectQueryError(data) ? '' : data.nom,
        prenoms: isSelectQueryError(data) ? '' : data.prenoms,
        email: isSelectQueryError(data) ? '' : data.email,
        photo_profil: isSelectQueryError(data) ? '' : data.photo_profil,
        photo_couverture: isSelectQueryError(data) ? '' : data.photo_couverture,
        telephone: isSelectQueryError(data) ? '' : telephones[0]?.numero,
        adresse: isSelectQueryError(data) ? '' : data.adresse || undefined,
        bio: isSelectQueryError(data) ? '' : data.bio || undefined,
        id_role: isSelectQueryError(data) ? null : data.id_role,
        nom_role: isSelectQueryError(data) ? '' : data.role?.nom_role,
        telephones: mappedTelephones
      });

      // Fetch follower counts
      const { count: followers } = await supabase
        .from('followers')
        .select('*', { count: 'exact', head: true })
        .eq('followed_id', userId);
      
      setFollowersCount(followers || 0);
      
      const { count: following } = await supabase
        .from('followers')
        .select('*', { count: 'exact', head: true })
        .eq('follower_id', userId);
      
      setFollowingCount(following || 0);
      
      // Fetch projects count
      const { count: projects } = await supabase
        .from('projet')
        .select('*', { count: 'exact', head: true })
        .eq('id_tantsaha', userId);
      
      setProjectsCount(projects || 0);
      
      // Check if current authenticated user is viewing their own profile
      const { data: authUser } = await supabase.auth.getUser();
      setIsCurrentUser(authUser.user?.id === userId);
      
      // Check if current user follows this profile
      if (authUser.user) {
        const { count } = await supabase
          .from('followers')
          .select('*', { count: 'exact', head: true })
          .eq('follower_id', authUser.user.id)
          .eq('followed_id', userId);
        
        setIsFollowing(count !== null && count > 0);
      }
      
    } catch (error) {
      console.error('Error fetching user profile:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger le profil de l'utilisateur",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      fetchUserProfile(id);
    }
  }, [id]);

  if (loading) {
    return (
      <div className="container flex justify-center items-center min-h-[calc(100vh-4rem)]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="container flex justify-center items-center min-h-[calc(100vh-4rem)]">
        <div className="text-center">
          <h2 className="text-2xl font-bold">Utilisateur non trouvé</h2>
          <p className="text-muted-foreground">Le profil demandé n'existe pas ou n'est pas accessible.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-6">
      <ProfileHeader 
        profile={profile}
        isCurrentUser={isCurrentUser}
        isFollowing={isFollowing}
        followersCount={followersCount}
        followingCount={followingCount}
        projectsCount={projectsCount}
        onFollowToggle={handleFollowToggle}
      />
      <ProfileTabs userId={profile.id_utilisateur} />
    </div>
  );
};

export default Profile;
