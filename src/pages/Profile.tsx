import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
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

  useEffect(() => {
    if (!id) return;
    
    // Vérifier si c'est le profil de l'utilisateur actuel
    if (user?.id === id) {
      setIsCurrentUser(true);
      if (currentUserProfile) {
        setProfile(currentUserProfile);
      }
    } else {
      setIsCurrentUser(false);
      fetchUserProfile(id);
    }
    
    fetchFollowStatus(id);
    fetchUserProjects(id);
    fetchInvestedProjects(id);
    
  }, [id, user, currentUserProfile]);

  const fetchUserProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('utilisateur')
        .select(`
          *,
          role:id_role(nom_role)
        `)
        .eq('id_utilisateur', userId)
        .single();
      
      if (error) throw error;
      
      setProfile({
        id_utilisateur: data.id_utilisateur,
        id: data.id_utilisateur,
        nom: data.nom,
        prenoms: data.prenoms,
        email: data.email,
        photo_profil: data.photo_profil,
        telephone: data.telephone || undefined,
        adresse: data.adresse || undefined,
        bio: data.bio || undefined,
        nom_role: data.role?.nom_role
      });
    } catch (error) {
      console.error('Error fetching user profile:', error);
      toast.error("Impossible de charger le profil de l'utilisateur");
    }
  };
  
  const fetchFollowStatus = async (userId: string) => {
    try {
      // Nombre de followers
      const { count: followersResult, error: followersError } = await supabase
        .rpc('count_followers', { user_id: userId });
      
      if (followersError) throw followersError;
      setFollowersCount(followersResult || 0);
      
      // Nombre d'abonnements
      const { count: followingResult, error: followingError } = await supabase
        .rpc('count_subscriptions', { user_id: userId });
      
      if (followingError) throw followingError;
      setFollowingCount(followingResult || 0);
      
      // Vérifier si l'utilisateur actuel suit ce profil
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
      
      // Récupérer les projets créés par l'utilisateur
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
      
      // Transformer les données en format AgriculturalProject
      const formattedProjects: AgriculturalProject[] = (data || []).map(project => {
        // Calculer le coût total d'exploitation
        const totalCost = project.projet_culture.reduce(
          (sum: number, pc: any) => sum + (pc.cout_exploitation_previsionnel || 0), 
          0
        );
        
        // Calculer le rendement total
        const totalYield = project.projet_culture.reduce(
          (sum: number, pc: any) => sum + (pc.rendement_previsionnel || 0), 
          0
        );
        
        // Calculer le revenu attendu
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
          currentFunding: project.financement_actuel || 0,
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
      // Récupérer les projets dans lesquels l'utilisateur a investi
      const { data, error } = await supabase
        .from('investissement')
        .select(`
          *,
          projet(
            *,
            tantsaha:id_tantsaha(id_utilisateur, nom, prenoms, photo_profil),
            projet_culture(*, culture(*))
          )
        `)
        .eq('id_investisseur', userId);
      
      if (error) throw error;
      
      // Regrouper les investissements par projet
      const projectsMap = new Map();
      
      data?.forEach(investment => {
        const project = investment.projet;
        if (!project) return;
        
        const projectId = project.id_projet;
        
        if (!projectsMap.has(projectId)) {
          projectsMap.set(projectId, {
            ...project,
            totalInvestment: investment.montant
          });
        } else {
          const existingProject = projectsMap.get(projectId);
          existingProject.totalInvestment += investment.montant;
          projectsMap.set(projectId, existingProject);
        }
      });
      
      setInvestedProjects(Array.from(projectsMap.values()));
    } catch (error) {
      console.error('Error fetching invested projects:', error);
    }
  };
  
  const handleFollow = async () => {
    if (!user || !profile) return;
    
    try {
      if (isFollowing) {
        // Unfollow
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
        // Follow
        const { error } = await supabase
          .rpc('create_subscription', { 
            abonne_id: user.id, 
            suivi_id: profile.id_utilisateur
          });
        
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
    // Implementation for toggling like on a project
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
      {/* Header Profile */}
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
      
      {/* Content Tabs */}
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
          {investedProjects.length > 0 ? (
            <div className="space-y-4">
              {investedProjects.map(project => (
                <div key={project.id_projet} className="border rounded-lg p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-medium">{project.titre || `Projet #${project.id_projet}`}</h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        Par {project.tantsaha?.nom} {project.tantsaha?.prenoms || ''}
                      </p>
                      <div className="flex gap-2 mt-2">
                        <span className="text-xs bg-muted px-2 py-1 rounded-full">
                          {project.surface_ha} ha
                        </span>
                        <span className="text-xs bg-muted px-2 py-1 rounded-full">
                          {project.statut}
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">Votre investissement</p>
                      <p className="text-lg font-bold">{formatCurrency(project.totalInvestment)}</p>
                    </div>
                  </div>
                  
                  <div className="mt-3">
                    <div className="flex justify-between text-sm">
                      <span>Progression</span>
                      <span>
                        {(project.financement_actuel || 0) > 0 && project.cout_total ? 
                          `${Math.round((project.financement_actuel / project.cout_total) * 100)}%` : 
                          '0%'
                        }
                      </span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2 mt-1">
                      <div 
                        className="bg-primary h-2 rounded-full" 
                        style={{ 
                          width: `${project.cout_total ? 
                            Math.min(Math.round((project.financement_actuel || 0) / project.cout_total * 100), 100) : 0
                          }%` 
                        }}
                      ></div>
                    </div>
                  </div>
                  
                  <div className="mt-3 flex justify-end">
                    <Button variant="outline" size="sm">Voir détails</Button>
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
