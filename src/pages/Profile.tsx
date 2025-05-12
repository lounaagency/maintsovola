import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { UserProfile } from '@/types/userProfile';
import ProfileHeader from '@/components/profile/ProfileHeader';
import ProfileTabs from '@/components/profile/ProfileTabs';
import ProjectDetailsDialog from '@/components/ProjectDetailsDialog';

// Type guard for SelectQueryError
const isSelectQueryError = (obj: any): boolean => {
  return obj && typeof obj === 'object' && 'message' in obj && 'details' in obj;
};

export const Profile = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, profile: currentUserProfile } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isCurrentUser, setIsCurrentUser] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followersCount, setFollowersCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [investedProjects, setInvestedProjects] = useState<any[]>([]);
  const [projectsCount, setProjectsCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [projectJalons, setProjectJalons] = useState<{[key: number]: any[]}>({});
  const [userRole, setUserRole] = useState<string | null>(null);
  
  // Add state for project details dialog
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null);
  
  if (!user) {
    return <Navigate to="/auth" replace />;
  }
  
  // Add the handleOpenDetails function
  const handleOpenDetails = (projectId: number) => {
    setSelectedProjectId(projectId);
    setDetailsOpen(true);
  };
  
  useEffect(() => {
    const fetchUserRole = async () => {
      if (user) {
        try {
          const { data, error } = await supabase
            .from('utilisateurs_par_role')
            .select('nom_role')
            .eq('id_utilisateur', user.id)
            .single();
            
          if (error) throw error;
          
          if (data) {
            setUserRole(data.nom_role);
          }
        } catch (error) {
          console.error("Erreur lors de la récupération du rôle de l'utilisateur:", error);
        }
      }
    };
    
    fetchUserRole();
  }, [user]);
  
  useEffect(() => {
    const loadProfileData = async () => {
      const userId = id || user?.id;
      
      if (!userId) return;
      
      if (user?.id === userId) {
        setIsCurrentUser(true);
        if (currentUserProfile) {
          setProfile(currentUserProfile);
        }
      } else {
        setIsCurrentUser(false);
        await fetchUserProfile(userId);
      }
      
      await fetchFollowStatus(userId);
      await fetchProjectsCount(userId);
      await fetchInvestedProjects(userId);
      setLoading(false);
    };
    
    loadProfileData();
  }, [id, user, currentUserProfile]);

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
        type: tel.type as "principal" | "whatsapp" | "mobile_banking" | "autre",
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
        id_role: isSelectQueryError(data) ? '' : data.id_role,
        nom_role: isSelectQueryError(data) ? '' : data.role?.nom_role,
        telephones: mappedTelephones
      });
    } catch (error) {
      console.error('Error fetching user profile:', error);
      toast.error("Impossible de charger le profil de l'utilisateur");
    }
  };
  
  const fetchFollowStatus = async (userId: string) => {
    try {
      const { data: followersResult, error: followersError } = await supabase
        .from('abonnement')
        .select('id_abonnement', { count: 'exact' })
        .eq('id_suivi', userId);
      
      if (followersError) throw followersError;
      setFollowersCount(followersResult?.length || 0);
      
      const { data: followingResult, error: followingError } = await supabase
        .from('abonnement')
        .select('id_abonnement', { count: 'exact' })
        .eq('id_abonne', userId);
      
      if (followingError) throw followingError;
      setFollowingCount(followingResult?.length || 0);
      
      if (user && userId !== user.id) {
        const { data, error } = await supabase
          .from('abonnement')
          .select('id_abonnement')
          .eq('id_abonne', user.id)
          .eq('id_suivi', userId)
          .maybeSingle();
        
        if (error) throw error;
        setIsFollowing(!!data);
      }
    } catch (error) {
      console.error('Error fetching follow status:', error);
    }
  };
  
  const fetchProjectsCount = async (userId: string) => {
    try {
      const { count, error } = await supabase
        .from('projet')
        .select('id_projet', { count: 'exact', head: true })
        .eq('id_tantsaha', userId);
      
      if (error) throw error;
      
      setProjectsCount(count || 0);
    } catch (error) {
      console.error('Error fetching projects count:', error);
    }
  };
  
  const fetchInvestedProjects = async (userId: string) => {
    try {
      const { data: investmentData, error } = await supabase
        .from('investissement')
        .select(`
          *,
          projet!inner(
            *,
            tantsaha:id_tantsaha(id_utilisateur, nom, prenoms, photo_profil)
          )
        `)
        .eq('id_investisseur', userId);
      
      if (error) throw error;

      const projectIds = investmentData
        .map(inv => inv.id_projet)
        .filter(id => id !== null && id !== undefined)
        .map(id => Number(id));
      
      if (projectIds.length === 0) {
        setInvestedProjects([]);
        return;
      }
      
      const { data: projectCultures } = await supabase
        .from('projet_culture')
        .select('*, culture(*)')
        .in('id_projet', projectIds);
      
      const projectCultureMap = new Map();
      if (projectCultures) {
        projectCultures.forEach((pc: any) => {
          if (!projectCultureMap.has(pc.id_projet)) {
            projectCultureMap.set(pc.id_projet, []);
          }
          projectCultureMap.get(pc.id_projet).push(pc);
        });
      }
      
      const { data: totalInvestments } = await supabase
        .from('investissement')
        .select('id_projet, montant')
        .in('id_projet', projectIds);
      
      const projectInvestmentMap = new Map();
      if (totalInvestments) {
        totalInvestments.forEach((inv: any) => {
          if (!projectInvestmentMap.has(inv.id_projet)) {
            projectInvestmentMap.set(inv.id_projet, 0);
          }
          projectInvestmentMap.set(inv.id_projet, projectInvestmentMap.get(inv.id_projet) + inv.montant);
        });
      }

      // Fetch jalons for each project
      const { data: jalonsData } = await supabase
        .from('jalon_projet')
        .select(`
          *,
          jalon_agricole:id_jalon_agricole(nom_jalon)
        `)
        .in('id_projet', projectIds);
      
      // Group jalons by project
      const jalonsMap: {[key: number]: any[]} = {};
      if (jalonsData) {
        jalonsData.forEach((jalon: any) => {
          if (!jalonsMap[jalon.id_projet]) {
            jalonsMap[jalon.id_projet] = [];
          }
          jalonsMap[jalon.id_projet].push(jalon);
        });
      }
      
      setProjectJalons(jalonsMap);

      const processedProjects = investmentData
        .filter(investment => investment.projet) // Filtrer les investissements sans projet
        .map(investment => {
          const project = investment.projet;
          if (!project) return null;
          
          const projectObj = project;
          const tantsaha = projectObj.tantsaha || {};
          
          const cultures = projectCultureMap.get(project.id_projet) || [];
          
          const totalCost = cultures.reduce(
            (sum: number, pc: any) => sum + (pc.cout_exploitation_previsionnel || 0), 
            0
          );
          
          const totalYield = cultures.reduce(
            (sum: number, pc: any) => sum + (pc.rendement_previsionnel || 0), 
            0
          );
          
          const expectedRevenue = cultures.reduce(
            (sum: number, pc: any) => sum + (pc.rendement_previsionnel * (pc.culture?.prix_tonne || 0)), 
            0
          );

          const totalInvested = projectInvestmentMap.get(project.id_projet) || 0;
          const userInvestment = investment.montant || 0;
          
          const investmentShare = totalInvested > 0 ? userInvestment / totalInvested : 0;
          const totalProfit = expectedRevenue - totalCost;
          const userProfit = totalProfit * investmentShare;
          const roi = userInvestment > 0 ? (userProfit / userInvestment) * 100 : 0;
          
          const projectJalons = jalonsMap[project.id_projet] || [];
          const completedJalons = projectJalons.filter(j => j.date_reelle).length;
          const jalonProgress = projectJalons.length > 0 ? (completedJalons / projectJalons.length) * 100 : 0;
          
          // Fix typecasting for tantsaha object properties
          const tantsahaTyped = tantsaha as {
            id_utilisateur?: string;
            nom?: string;
            prenoms?: string;
            photo_profil?: string;
          };
          
          return {
            id: project.id_projet.toString(),
            title: project.titre || `Projet #${project.id_projet}`,
            farmer: {
              id: tantsahaTyped.id_utilisateur,
              name: `${tantsahaTyped.nom || ""} ${tantsahaTyped.prenoms || ""}`.trim(),
              username: tantsahaTyped.nom?.toLowerCase()?.replace(/\s+/g, '') || "",
              avatar: tantsahaTyped.photo_profil,
            },
            location: {
              region: project.id_region || "Non spécifié",
              district: project.id_district || "Non spécifié",
              commune: project.id_commune || "Non spécifié",
            },
            cultivationArea: project.surface_ha || 0,
            cultivationType: cultures[0]?.culture?.nom_culture || "Non spécifié",
            farmingCost: totalCost,
            expectedYield: expectedRevenue,
            expectedRevenue: expectedRevenue,
            creationDate: project.created_at || new Date().toISOString(),
            images: [],
            description: project.description || "",
            fundingGoal: totalCost,
            currentFunding: totalInvested,
            totalProfit: totalProfit,
            userProfit: userProfit,
            roi: roi,
            investmentShare: investmentShare,
            jalonProgress: jalonProgress,
            completedJalons: completedJalons,
            totalJalons: projectJalons.length,
            jalons: projectJalons,
            likes: 0,
            comments: 0,
            shares: 0,
            status: project.statut,
            dateLancement: project.date_debut_production,
            userInvestment: userInvestment,
            chartData: [
              {
                name: 'Investissement',
                value: userInvestment,
                fill: '#94a3b8'
              },
              {
                name: 'Bénéfice estimé',
                value: userProfit > 0 ? userProfit : 0,
                fill: userProfit > 0 ? '#10b981' : '#f43f5e'
              }
            ]
          };
        }).filter(Boolean);
      
      setInvestedProjects(processedProjects || []);
    } catch (error) {
      console.error('Error fetching invested projects:', error);
      setInvestedProjects([]);
    }
  };
  
  const handleFollow = async () => {
    if (!user || !profile) return;
    
    try {
      if (isFollowing) {
        const { error } = await supabase
          .from('abonnement')
          .delete()
          .eq('id_abonne', user.id)
          .eq('id_suivi', profile.id);
        
        if (error) throw error;
        
        setIsFollowing(false);
        setFollowersCount(prev => prev - 1);
        toast.success(`Vous ne suivez plus ${profile.nom}`);
      } else {
        const { error } = await supabase
          .from('abonnement')
          .insert([{
            id_abonne: user.id,
            id_suivi: profile.id_utilisateur
          }]);
        
        if (error) throw error;
        
        setIsFollowing(true);
        setFollowersCount(prev => prev + 1);
        toast.success(`Vous suivez maintenant ${profile.nom}`);
      }
    } catch (error) {
      console.error('Error updating follow status:', error);
      toast.error("Une erreur est survenue");
    }
  };

  if (!profile) {
    return (
      <div className="flex justify-center items-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="container max-w-4xl py-6 space-y-6">
      <ProfileHeader 
        profile={profile}
        isCurrentUser={isCurrentUser}
        isFollowing={isFollowing}
        followersCount={followersCount}
        followingCount={followingCount}
        projectsCount={projectsCount}
        onFollowToggle={handleFollow}
      />
      
      <Separator />
      
      <ProfileTabs 
        userId={profile.id_utilisateur}
        investedProjects={investedProjects}
        loading={loading}
        onViewDetails={handleOpenDetails}
      />
      
      {/* Add ProjectDetailsDialog */}
      {selectedProjectId && (
        <ProjectDetailsDialog
          isOpen={detailsOpen}
          onClose={() => setDetailsOpen(false)}
          projectId={selectedProjectId}
          userRole={userRole || undefined}
        />
      )}
    </div>
  );
};

export default Profile;
