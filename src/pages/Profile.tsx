
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
  Users,
  TrendingUp,
  Calendar,
  Landmark,
  Clock,
  ChartLine,
  ChartBar
} from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { UserProfile } from '@/types/userProfile';
import { formatCurrency } from '@/lib/utils';
import ProjectFeed from '@/components/ProjectFeed';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  ChartContainer, 
  ChartTooltip,
  ChartTooltipContent
} from '@/components/ui/chart';
import {
  BarChart,
  Bar,
  Cell,
  XAxis,
  YAxis,
  Tooltip
} from 'recharts';

// Type guard for SelectQueryError
const isSelectQueryError = (obj: any): boolean => {
  return obj && typeof obj === 'object' && 'message' in obj && 'details' in obj;
};

export const Profile = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, profile: currentUserProfile, refreshProfile } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isCurrentUser, setIsCurrentUser] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followersCount, setFollowersCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [investedProjects, setInvestedProjects] = useState<any[]>([]);
  const [projectsCount, setProjectsCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [projectJalons, setProjectJalons] = useState<{[key: number]: any[]}>({});
  
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
          
          const id_tantsaha = typeof tantsaha === 'object' ? tantsaha.id_utilisateur : null;
          const nom = typeof tantsaha === 'object' ? tantsaha.nom : null;
          const prenoms = typeof tantsaha === 'object' ? tantsaha.prenoms : null;
          const photo_profil = typeof tantsaha === 'object' ? tantsaha.photo_profil : null;

          return {
            id: project.id_projet.toString(),
            title: project.titre || `Projet #${project.id_projet}`,
            farmer: {
              id: id_tantsaha,
              name: `${nom || ""} ${prenoms || ""}`.trim(),
              username: nom?.toLowerCase()?.replace(/\s+/g, '') || "",
              avatar: photo_profil,
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
            dateLancement: project.date_lancement,
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

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'en cours': return 'bg-blue-500';
      case 'terminé': return 'bg-green-500';
      case 'en attente': return 'bg-yellow-500';
      case 'en financement': return 'bg-purple-500';
      case 'validé': return 'bg-teal-500';
      default: return 'bg-gray-500';
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return "Non défini";
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
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
            <Landmark size={16} className="mr-2" />
            Investissements
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="projects" className="mt-6">
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
            </div>
          ) : (
            <div className="max-w-md mx-auto">
              <ProjectFeed 
                filters={{ 
                  userId: profile.id_utilisateur 
                }}
                showFilters={false}
                showFollowingTab={false}
                title=""
                className="mt-0"
              />
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="investments" className="mt-6">
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
            </div>
          ) : investedProjects.length > 0 ? (
            <div className="max-w-md mx-auto space-y-4">
              {investedProjects.map(project => (
                <Card key={project.id} className="overflow-hidden border border-muted">
                  <CardHeader className="p-4 pb-2 space-y-1">
                    <div className="flex justify-between items-start">
                      <div className="space-y-1">
                        <CardTitle className="text-base font-medium">{project.title}</CardTitle>
                        <div className="flex items-center text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <User2 size={12} />
                            <span>{project.farmer.name}</span>
                          </div>
                        </div>
                      </div>
                      <Badge variant={project.status === 'terminé' ? 'secondary' : 'default'}>
                        {project.status || "Non défini"}
                      </Badge>
                    </div>
                  </CardHeader>

                  <CardContent className="p-4 pt-2 space-y-4">
                    {/* Financial Summary Section */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <div className="flex items-center text-xs text-muted-foreground">
                          <Landmark size={12} className="mr-1" />
                          <span>Votre investissement</span>
                        </div>
                        <div className="text-base font-bold">{formatCurrency(project.userInvestment)}</div>
                        <div className="text-xs text-muted-foreground">
                          {Math.round(project.investmentShare * 100)}% du total
                        </div>
                      </div>
                      
                      <div className="space-y-1">
                        <div className="flex items-center text-xs text-muted-foreground">
                          <TrendingUp size={12} className="mr-1" />
                          <span>Bénéfice estimé</span>
                        </div>
                        <div className={`text-base font-bold ${project.userProfit > 0 ? 'text-green-600' : 'text-red-500'}`}>
                          {formatCurrency(project.userProfit)}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          ROI: {project.roi > 0 ? '+' : ''}{Math.round(project.roi)}%
                        </div>
                      </div>
                    </div>

                    {/* Chart showing investment vs expected return */}
                    <div className="h-[100px] -mx-2">
                      <ChartContainer 
                        config={{
                          investment: { color: '#94a3b8' },
                          profit: { color: project.userProfit > 0 ? '#10b981' : '#f43f5e' }
                        }}
                      >
                        <BarChart 
                          width={300} 
                          height={100} 
                          data={project.chartData}
                          margin={{ top: 5, right: 5, bottom: 5, left: 5 }}
                          barSize={40}
                        >
                          <XAxis 
                            dataKey="name" 
                            axisLine={false} 
                            tickLine={false}
                            tick={{ fontSize: 10 }}
                          />
                          <YAxis hide />
                          <ChartTooltip 
                            cursor={false}
                            content={<ChartTooltipContent />}
                          />
                          <Bar 
                            dataKey="value" 
                            radius={[4, 4, 0, 0]} 
                          >
                            {project.chartData.map((entry: any, index: number) => (
                              <Cell key={`cell-${index}`} fill={entry.fill} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ChartContainer>
                    </div>

                    {/* Project Progress Section */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <Clock size={12} className="mr-1" />
                          <span>Progrès du projet</span>
                        </div>
                        {project.dateLancement && (
                          <span className="text-xs">
                            Lancé le {formatDate(project.dateLancement)}
                          </span>
                        )}
                      </div>

                      {project.totalJalons > 0 ? (
                        <div>
                          <div className="flex justify-between text-xs mb-1">
                            <span>{project.completedJalons}/{project.totalJalons} jalons complétés</span>
                            <span>{Math.round(project.jalonProgress)}%</span>
                          </div>
                          <Progress value={project.jalonProgress} className="h-1.5" />
                          
                          {/* Jalons Preview - first 2 jalons */}
                          {project.jalons && project.jalons.length > 0 && (
                            <div className="mt-2 space-y-1">
                              {project.jalons.slice(0, 2).map((jalon: any, index: number) => (
                                <div key={`${project.id}-jalon-${index}`} className="flex items-center justify-between text-xs">
                                  <div className="flex items-center gap-1">
                                    <div className={`w-2 h-2 rounded-full ${jalon.date_reelle ? 'bg-green-500' : 'bg-gray-300'}`} />
                                    <span className={jalon.date_reelle ? 'text-green-700' : ''}>
                                      {jalon.jalon_agricole?.nom_jalon || `Jalon ${index + 1}`}
                                    </span>
                                  </div>
                                  <span className={`text-xs ${jalon.date_reelle ? 'text-green-700' : 'text-muted-foreground'}`}>
                                    {jalon.date_reelle ? formatDate(jalon.date_reelle) : formatDate(jalon.date_previsionnelle)}
                                  </span>
                                </div>
                              ))}
                              
                              {project.jalons.length > 2 && (
                                <div className="text-xs text-muted-foreground text-center mt-1">
                                  +{project.jalons.length - 2} autres jalons
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="text-xs text-center text-muted-foreground py-2">
                          Aucun jalon défini pour ce projet
                        </div>
                      )}
                    </div>

                    {/* Project Funding Progress Section */}
                    <div className="space-y-2">
                      <div className="flex justify-between text-xs">
                        <span className="text-muted-foreground">Financement</span>
                        <span>
                          {formatCurrency(project.currentFunding)} / {formatCurrency(project.fundingGoal)}
                        </span>
                      </div>
                      <Progress 
                        value={project.fundingGoal > 0 ? Math.min(Math.round((project.currentFunding / project.fundingGoal) * 100), 100) : 0} 
                        className="h-1.5" 
                      />
                    </div>

                    {/* Actions */}
                    <div className="flex justify-end pt-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => navigate(`/projects/${project.id}`)}
                      >
                        Voir détails
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 border border-dashed rounded-lg">
              <Landmark size={40} className="mx-auto text-muted-foreground" />
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
