import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Avatar } from '@/components/ui/avatar';
import { 
  Mail, 
  MapPin, 
  Phone, 
  User2,
  Edit, 
  PenSquare,
  Users
} from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import AgriculturalProjectCard from '@/components/AgriculturalProjectCard';
import { AgriculturalProject } from '@/types/agriculturalProject';
import { UserProfile } from '@/types/userProfile';
import { formatCurrency } from '@/lib/utils';

export const Profile = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, profile: currentUserProfile, refreshProfile } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isCurrentUser, setIsCurrentUser] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followersCount, setFollowersCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [projects, setProjects] = useState<AgriculturalProject[]>([]);
  const [investedProjects, setInvestedProjects] = useState<any[]>([]);
  const [projectsCount, setProjectsCount] = useState(0);
  const [loading, setLoading] = useState(true);
  
  if (!user) {
    return <Navigate to="/auth" replace />;
  }
  
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
      await fetchUserProjects(userId);
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
        id_utilisateur: data.id_utilisateur,
        id: data.id_utilisateur,
        nom: data.nom,
        prenoms: data.prenoms,
        email: data.email,
        photo_profil: data.photo_profil,
        photo_couverture: data.photo_couverture,
        telephone: telephones[0]?.numero,
        adresse: data.adresse || undefined,
        bio: data.bio || undefined,
        id_role: data.id_role,
        nom_role: data.role?.nom_role,
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
  
  const fetchUserProjects = async (userId: string) => {
    try {
      setLoading(true);
      
      const { data, error, count } = await supabase
        .from('projet')
        .select(`
          *,
          terrain(*),
          projet_culture!inner(*, culture(*))
        `, { count: 'exact' })
        .eq('id_tantsaha', userId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      const formattedProjects: AgriculturalProject[] = (data || []).map(project => {
        const totalCost = project.projet_culture.reduce(
          (sum: number, pc: any) => sum + (pc.cout_exploitation_previsionnel || 0), 
          0
        );
        
        const totalYield = project.projet_culture.reduce(
          (sum: number, pc: any) => sum + (pc.rendement_previsionnel || 0), 
          0
        );
        
        const expectedRevenue = project.projet_culture.reduce(
          (sum: number, pc: any) => sum + (pc.rendement_previsionnel * (pc.culture?.prix_tonne || 0)), 
          0
        );
        
        return {
          id: project.id_projet.toString(),
          title: project.titre || `Projet #${project.id_projet}`,
          farmer: {
            id: userId,
            name: `${profile?.nom || ""} ${profile?.prenoms || ""}`.trim(),
            username: profile?.nom?.toLowerCase()?.replace(/\s+/g, '') || "",
            avatar: profile?.photo_profil,
          },
          location: {
            region: project.terrain?.id_region || "Non spécifié",
            district: project.terrain?.id_district || "Non spécifié",
            commune: project.terrain?.id_commune || "Non spécifié",
          },
          cultivationArea: project.surface_ha || 0,
          cultivationType: project.projet_culture[0]?.culture?.nom_culture || "Non spécifié",
          farmingCost: totalCost,
          expectedYield: totalYield,
          expectedRevenue: expectedRevenue,
          creationDate: project.created_at || new Date().toISOString(),
          images: [],
          description: project.description || "",
          fundingGoal: totalCost,
          currentFunding: calculateCurrentFunding(project),
          totalProfit: expectedRevenue - totalCost,
          likes: 0,
          comments: 0,
          shares: 0,
        };
      });
      
      setProjects(formattedProjects);
      setProjectsCount(count || 0);
    } catch (error) {
      console.error('Error fetching user projects:', error);
      toast.error("Impossible de charger les projets");
    } finally {
      setLoading(false);
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

      const projectIds = investmentData.map(inv => inv.id_projet).filter(Boolean);
      
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

      const processedProjects = investmentData
        .filter(investment => investment.projet) // Filtrer les investissements sans projet
        .map(investment => {
          const project = investment.projet;
          if (!project) return null;
          
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
          
          return {
            id: project.id_projet.toString(),
            title: project.titre || `Projet #${project.id_projet}`,
            farmer: {
              id: project.tantsaha?.id_utilisateur,
              name: `${project.tantsaha?.nom || ""} ${project.tantsaha?.prenoms || ""}`.trim(),
              username: project.tantsaha?.nom?.toLowerCase()?.replace(/\s+/g, '') || "",
              avatar: project.tantsaha?.photo_profil,
            },
            location: {
              region: project.id_region || "Non spécifié",
              district: project.id_district || "Non spécifié",
              commune: project.id_commune || "Non spécifié",
            },
            cultivationArea: project.surface_ha || 0,
            cultivationType: cultures[0]?.culture?.nom_culture || "Non spécifié",
            farmingCost: totalCost,
            expectedYield: totalYield,
            expectedRevenue: expectedRevenue,
            creationDate: project.created_at || new Date().toISOString(),
            images: [],
            description: project.description || "",
            fundingGoal: totalCost,
            currentFunding: totalInvested,
            totalProfit: userProfit,
            likes: 0,
            comments: 0,
            shares: 0,
            status: project.statut,
            userInvestment: userInvestment
          };
        }).filter(Boolean);
      
      setInvestedProjects(processedProjects || []);
    } catch (error) {
      console.error('Error fetching invested projects:', error);
      setInvestedProjects([]);
    }
  };
  
  const calculateCurrentFunding = (project: any) => {
    if (!project.investissements) return 0;
    return project.investissements.reduce((sum: number, inv: any) => sum + (inv.montant || 0), 0);
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
  
  const handleLikeToggle = async (projectId: string) => {
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
      <div className="flex flex-col md:flex-row gap-6 items-start">
        <Avatar className="h-24 w-24 rounded-full border-4 border-background">
          {profile.photo_profil ? (
            <img 
              src={profile.photo_profil} 
              alt={profile.nom} 
              className="aspect-square h-full w-full object-cover"
            />
          ) : (
            <User2 className="h-12 w-12" />
          )}
        </Avatar>
        
        <div className="flex-1">
          <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-4">
            <h1 className="text-2xl font-bold">
              {`${profile.nom} ${profile.prenoms || ''}`}
            </h1>
            
            <div className="flex items-center">
              <span className="text-sm px-2 py-0.5 bg-muted rounded-full">
                {profile.nom_role?.charAt(0).toUpperCase() + profile.nom_role?.slice(1)}
              </span>
            </div>
          </div>
          
          {profile.bio && (
            <p className="mt-2 text-muted-foreground">{profile.bio}</p>
          )}
          
          <div className="flex flex-wrap gap-4 mt-3">
            <div className="flex items-center text-sm text-muted-foreground">
              <MapPin size={16} className="mr-1" />
              <span>{profile.adresse || 'Aucune adresse'}</span>
            </div>
            
            {profile.telephone && (
              <div className="flex items-center text-sm text-muted-foreground">
                <Phone size={16} className="mr-1" />
                <span>{profile.telephone}</span>
              </div>
            )}
            
            <div className="flex items-center text-sm text-muted-foreground">
              <Mail size={16} className="mr-1" />
              <span>{profile.email}</span>
            </div>
          </div>
          
          <div className="flex flex-wrap items-center gap-4 mt-4">
            <div className="flex items-center gap-1">
              <span className="font-semibold">{projectsCount}</span>
              <span className="text-muted-foreground text-sm">projets</span>
            </div>
            
            <div className="flex items-center gap-1">
              <span className="font-semibold">{followersCount}</span>
              <span className="text-muted-foreground text-sm">abonnés</span>
            </div>
            
            <div className="flex items-center gap-1">
              <span className="font-semibold">{followingCount}</span>
              <span className="text-muted-foreground text-sm">abonnements</span>
            </div>
          </div>
        </div>
        
        <div className="flex flex-col gap-2">
          {isCurrentUser ? (
            <Button 
              variant="outline" 
              onClick={() => navigate('/settings')}
              className="flex items-center"
            >
              <Edit size={16} className="mr-2" />
              Modifier profil
            </Button>
          ) : (
            <>
              <Button 
                variant={isFollowing ? "outline" : "default"}
                onClick={handleFollow}
              >
                {isFollowing ? (
                  <>
                    <Users size={16} className="mr-2" />
                    Abonné
                  </>
                ) : (
                  <>
                    <Users size={16} className="mr-2" />
                    Suivre
                  </>
                )}
              </Button>
              <Button variant="outline">
                <Mail size={16} className="mr-2" />
                Message
              </Button>
            </>
          )}
        </div>
      </div>
      
      <Separator />
      
      <Tabs defaultValue="projects">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="projects" className="flex items-center">
            <PenSquare size={16} className="mr-2" />
            Projets
          </TabsTrigger>
          <TabsTrigger value="investments" className="flex items-center">
            <Users size={16} className="mr-2" />
            Investissements
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="projects" className="mt-6">
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
            </div>
          ) : projects.length > 0 ? (
            <div className="grid grid-cols-1 gap-6">
              {projects.map(project => (
                <AgriculturalProjectCard
                  key={project.id}
                  project={project}
                  onLikeToggle={() => handleLikeToggle(project.id)}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-12 border border-dashed rounded-lg">
              <PenSquare size={40} className="mx-auto text-muted-foreground" />
              <h3 className="mt-4 text-lg font-medium">Aucun projet</h3>
              <p className="text-muted-foreground">
                {isCurrentUser 
                  ? "Vous n'avez pas encore créé de projet agricole."
                  : "Cet utilisateur n'a pas encore créé de projet agricole."}
              </p>
              {isCurrentUser && profile.nom_role === 'agriculteur' && (
                <Button className="mt-4" onClick={() => navigate('/terrain')}>
                  Créer un projet
                </Button>
              )}
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="investments" className="mt-6">
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
            </div>
          ) : investedProjects.length > 0 ? (
            <div className="space-y-4">
              {investedProjects.map(project => (
                <div key={project.id} className="border rounded-lg p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-medium">{project.title}</h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        Par {project.farmer.name}
                      </p>
                      <div className="flex gap-2 mt-2">
                        <span className="text-xs bg-muted px-2 py-1 rounded-full">
                          {project.cultivationArea} ha
                        </span>
                        <span className="text-xs bg-muted px-2 py-1 rounded-full">
                          {project.status || "Non défini"}
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">Votre investissement</p>
                      <p className="text-lg font-bold">{formatCurrency(project.userInvestment)}</p>
                    </div>
                  </div>
                  
                  <div className="mt-3">
                    <div className="flex justify-between text-sm">
                      <span>Progression</span>
                      <span>
                        {project.fundingGoal > 0 ? 
                          `${Math.round((project.currentFunding / project.fundingGoal) * 100)}%` : 
                          '0%'
                        }
                      </span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2 mt-1">
                      <div 
                        className="bg-primary h-2 rounded-full" 
                        style={{ 
                          width: `${project.fundingGoal > 0 ? 
                            Math.min(Math.round((project.currentFunding / project.fundingGoal) * 100), 100) : 0
                          }%` 
                        }}
                      ></div>
                    </div>
                  </div>
                  
                  <div className="mt-3 flex justify-end">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => navigate(`/projects/${project.id}`)}
                    >
                      Voir détails
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 border border-dashed rounded-lg">
              <Users size={40} className="mx-auto text-muted-foreground" />
              <h3 className="mt-4 text-lg font-medium">Aucun investissement</h3>
              <p className="text-muted-foreground">
                {isCurrentUser 
                  ? "Vous n'avez pas encore investi dans des projets agricoles."
                  : "Cet utilisateur n'a pas encore investi dans des projets agricoles."}
              </p>
              {isCurrentUser && (
                <Button className="mt-4" onClick={() => navigate('/')}>
                  Explorer les projets
                </Button>
              )}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Profile;
