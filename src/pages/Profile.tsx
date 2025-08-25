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
  
  // Fix the type issue - ensure selectedProjectId is always a number
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null);
  
  // New state for summary data
  const [investmentSummary, setInvestmentSummary] = useState({
    totalInvested: 0,
    totalProfit: 0,
    averageROI: 0,
    ongoingProjects: 0,
    completedProjects: 0,
    projectsByStatusData: []
  });
  
  const [projectsSummary, setProjectsSummary] = useState({
    totalProjects: 0,
    totalArea: 0,
    totalFunding: 0,
    totalProfit: 0,
    ownerProfit: 0,
    projectsByStatus: {
      enFinancement: {
        count: 0,
        area: 0,
        funding: 0,
        profit: 0,
        ownerProfit: 0,
        cultures: []
      },
      enCours: {
        count: 0,
        area: 0,
        funding: 0,
        profit: 0,
        ownerProfit: 0,
        cultures: []
      },
      termine: {
        count: 0,
        area: 0,
        funding: 0,
        profit: 0,
        ownerProfit: 0,
        cultures: []
      }
    },
    projectsByCulture: []
  });
  
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
      
      // Ne récupérer les données sensibles que pour l'utilisateur courant
      if (user?.id === userId) {
        await fetchInvestedProjects(userId);
        await fetchProjectsSummary(userId);
      } else {
        // Pour les profils consultés, récupérer seulement les projets publics
        await fetchPublicProjectsSummary(userId);
      }
      
      setLoading(false);
    };
    
    loadProfileData();
  }, [id, user, currentUserProfile]);

  const fetchUserProfile = async (userId: string) => {
    try {
      console.log('Fetching profile for user:', userId);
      
      // Première requête : récupérer les données utilisateur avec le rôle
      const { data: userData, error: userError } = await supabase
        .from('utilisateur')
        .select(`
          *,
          role:id_role(nom_role)
        `)
        .eq('id_utilisateur', userId)
        .single();
      
      if (userError) {
        console.error("Error fetching user data:", userError);
        toast.error("Impossible de charger le profil de l'utilisateur");
        return;
      }

      console.log('User data fetched:', userData);

      // Deuxième requête : récupérer les téléphones séparément
      const { data: telephonesData, error: telephonesError } = await supabase
        .from('telephone')
        .select('*')
        .eq('id_utilisateur', userId);

      if (telephonesError) {
        console.error("Error fetching telephones:", telephonesError);
        // Continue même si les téléphones échouent
      }

      console.log('Telephones data fetched:', telephonesData);
      
      const mappedTelephones = telephonesData ? telephonesData.map((tel: any) => ({
        id_telephone: tel.id_telephone,
        id_utilisateur: tel.id_utilisateur,
        numero: tel.numero,
        type: tel.type as "principal" | "whatsapp" | "mobile_banking" | "autre",
        est_whatsapp: tel.est_whatsapp,
        est_mobile_banking: tel.est_mobile_banking,
        created_at: tel.created_at || new Date().toISOString(),
        modified_at: tel.modified_at || new Date().toISOString()
      })) : [];
      
      setProfile({
        id_utilisateur: userData.id_utilisateur,
        id: userData.id_utilisateur,
        nom: userData.nom,
        prenoms: userData.prenoms,
        email: userData.email,
        photo_profil: userData.photo_profil,
        photo_couverture: userData.photo_couverture,
        telephone: mappedTelephones[0]?.numero,
        adresse: userData.adresse || undefined,
        bio: userData.bio || undefined,
        id_role: userData.id_role,
        nom_role: userData.role?.nom_role,
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
  
  const fetchProjectsSummary = async (userId: string) => {
    try {
      const { data: projectsData, error } = await supabase
        .from('projet')
        .select(`
          id_projet,
          statut,
          surface_ha,
          cultures:projet_culture(
            culture:id_culture(*),
            cout_exploitation_previsionnel,
            rendement_previsionnel
          ),
          investissements:investissement(montant)
        `)
        .eq('id_tantsaha', userId);
        
      if (error) throw error;
      
      if (!projectsData) return;
      
      let totalArea = 0;
      let totalFunding = 0;
      let totalProfit = 0;
      
      const statusColors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];
      const cultureMap = new Map<string, { count: number, fill: string }>();
      
      // Initialize the categorized data structure
      const projectsByStatus = {
        enFinancement: {
          count: 0,
          area: 0,
          funding: 0,
          profit: 0,
          ownerProfit: 0,
          cultures: [] as Array<{ name: string, count: number, fill: string }>
        },
        enCours: {
          count: 0,
          area: 0,
          funding: 0,
          profit: 0,
          ownerProfit: 0,
          cultures: [] as Array<{ name: string, count: number, fill: string }>
        },
        termine: {
          count: 0,
          area: 0,
          funding: 0,
          profit: 0,
          ownerProfit: 0,
          cultures: []
        }
      };
      
      // Maps for tracking cultures by project status
      const culturesByStatus = {
        enFinancement: new Map<string, number>(),
        enCours: new Map<string, number>(),
        termine: new Map<string, number>()
      };
      
      projectsData.forEach(project => {
        // Determine the status category
        let statusCategory: 'enFinancement' | 'enCours' | 'termine';
        if (project.statut === 'en financement') {
          statusCategory = 'enFinancement';
        } else if (project.statut === 'en_production' || project.statut === 'en_cours') {
          statusCategory = 'enCours';
        } else if (project.statut === 'terminé') {
          statusCategory = 'termine';
        } else {
          statusCategory = 'enFinancement'; // Default
        }
        
        // Sum up the area
        const area = project.surface_ha || 0;
        totalArea += area;
        projectsByStatus[statusCategory].area += area;
        
        // Count projects
        projectsByStatus[statusCategory].count += 1;
        
        // Calculate profit
        let projectProfit = 0;
        if (project.cultures && Array.isArray(project.cultures)) {
          project.cultures.forEach(pc => {
            if (pc.culture) {
              const cultureName = pc.culture.nom_culture;
              const rendement = pc.rendement_previsionnel || 0;
              const coutExploitation = pc.cout_exploitation_previsionnel || 0;
              const revenue = rendement * (pc.culture.prix_tonne || 0);
              const profit = revenue - coutExploitation;
              
              projectProfit += profit;
              
              // Count cultures
              if (!cultureMap.has(cultureName)) {
                const colorIndex = cultureMap.size % statusColors.length;
                cultureMap.set(cultureName, { count: 1, fill: statusColors[colorIndex] });
              } else {
                cultureMap.get(cultureName)!.count += 1;
              }
              
              // Count cultures by status
              if (!culturesByStatus[statusCategory].has(cultureName)) {
                culturesByStatus[statusCategory].set(cultureName, 1);
              } else {
                culturesByStatus[statusCategory].set(cultureName, 
                  culturesByStatus[statusCategory].get(cultureName)! + 1);
              }
            }
          });
        }
        
        totalProfit += projectProfit;
        projectsByStatus[statusCategory].profit += projectProfit;
        projectsByStatus[statusCategory].ownerProfit += projectProfit * 0.4; // 40% de bénéfice pour le propriétaire
        
        // Sum up funding
        let projectFunding = 0;
        if (project.investissements && Array.isArray(project.investissements)) {
          project.investissements.forEach(inv => {
            projectFunding += inv.montant || 0;
          });
        }
        
        totalFunding += projectFunding;
        projectsByStatus[statusCategory].funding += projectFunding;
      });
      
      // Prepare culture data for chart
      const projectsByCulture = Array.from(cultureMap.entries()).map(([name, info]) => ({
        name,
        count: info.count,
        fill: info.fill
      }));
      
      // Convert culture maps to arrays for each status category
      Object.keys(culturesByStatus).forEach((status) => {
        const statusKey = status as keyof typeof culturesByStatus;
        projectsByStatus[statusKey].cultures = Array.from(culturesByStatus[statusKey].entries())
          .map(([name, count], index) => ({
            name,
            count,
            fill: statusColors[index % statusColors.length]
          }));
      });
      
      // Update projects summary
      setProjectsSummary({
        totalProjects: projectsData.length,
        totalArea,
        totalFunding,
        totalProfit,
        ownerProfit: totalProfit * 0.4, // 40% du profit total pour le propriétaire
        projectsByStatus,
        projectsByCulture
      });
      
    } catch (error) {
      console.error("Erreur lors de la récupération des informations sur les projets:", error);
    }
  };
  
  // Nouvelle fonction pour récupérer seulement les données publiques des projets
  const fetchPublicProjectsSummary = async (userId: string) => {
    try {
      const { data: projectsData, error } = await supabase
        .from('projet')
        .select(`
          id_projet,
          statut,
          surface_ha,
          cultures:projet_culture(
            culture:id_culture(nom_culture)
          )
        `)
        .eq('id_tantsaha', userId)
        .eq('statut', 'validé'); // Seulement les projets validés
        
      if (error) throw error;
      
      if (!projectsData) return;
      
      let totalArea = 0;
      const cultureMap = new Map<string, { count: number, fill: string }>();
      const statusColors = ['#3b82f6', '#10b981', '#f59e0b'];
      
      projectsData.forEach(project => {
        totalArea += project.surface_ha || 0;
        
        if (project.cultures && Array.isArray(project.cultures)) {
          project.cultures.forEach(pc => {
            if (pc.culture) {
              const cultureName = pc.culture.nom_culture;
              if (!cultureMap.has(cultureName)) {
                const colorIndex = cultureMap.size % statusColors.length;
                cultureMap.set(cultureName, { count: 1, fill: statusColors[colorIndex] });
              } else {
                cultureMap.get(cultureName)!.count += 1;
              }
            }
          });
        }
      });
      
      const projectsByCulture = Array.from(cultureMap.entries()).map(([name, info]) => ({
        name,
        count: info.count,
        fill: info.fill
      }));
      
      // Version allégée pour les profils publics - sans données financières
      setProjectsSummary({
        totalProjects: projectsData.length,
        totalArea,
        totalFunding: 0, // Masqué pour les profils publics
        totalProfit: 0, // Masqué pour les profils publics
        ownerProfit: 0, // Masqué pour les profils publics
        projectsByStatus: {
          enFinancement: { count: 0, area: 0, funding: 0, profit: 0, ownerProfit: 0, cultures: [] },
          enCours: { count: 0, area: 0, funding: 0, profit: 0, ownerProfit: 0, cultures: [] },
          termine: { count: projectsData.length, area: totalArea, funding: 0, profit: 0, ownerProfit: 0, cultures: projectsByCulture }
        },
        projectsByCulture
      });
      
    } catch (error) {
      console.error("Erreur lors de la récupération des projets publics:", error);
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
      
      // Calculate investment summary directly from processedProjects, not from investedProjects state
      // which hasn't been updated yet
      if (processedProjects && processedProjects.length > 0) {
        const totalInvested = processedProjects.reduce((sum, project) => sum + project.userInvestment, 0);
        const totalProfit = processedProjects.reduce((sum, project) => sum + project.userProfit, 0);
        
        // Calculate ROI and project status counts
        const projectsWithROI = processedProjects.filter(p => p.userInvestment > 0);
        const averageROI = projectsWithROI.length > 0 
          ? projectsWithROI.reduce((sum, p) => sum + p.roi, 0) / projectsWithROI.length 
          : 0;
        
        const ongoingProjects = processedProjects.filter(p => 
          p.status === 'en_cours' || p.status === 'en_production' || p.status === 'en financement').length;
        const completedProjects = processedProjects.filter(p => p.status === 'terminé').length;
        
        // Create data for status chart
        const projectsByStatusData = [
          { name: 'En cours', value: ongoingProjects, fill: '#3b82f6' },
          { name: 'Terminés', value: completedProjects, fill: '#10b981' },
        ];
        
        setInvestmentSummary({
          totalInvested,
          totalProfit,
          averageROI,
          ongoingProjects,
          completedProjects,
          projectsByStatusData
        });
      }
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
        userId={profile?.id_utilisateur || ''}
        isCurrentUser={isCurrentUser}
        investedProjects={investedProjects}
        loading={loading}
        onViewDetails={handleOpenDetails}
        investmentSummary={investmentSummary}
        projectsSummary={projectsSummary}
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
