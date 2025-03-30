
import React, { useEffect, useState } from "react";
import UserAvatar from "@/components/UserAvatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Edit, Settings, Image, MapPin, Link as LinkIcon, LogOut } from "lucide-react";
import Post from "@/components/Post";
import { motion } from "framer-motion";
import { Navigate, useNavigate, useParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { AgriculturalProject } from "@/types/agriculturalProject";
import { UserProfile } from "@/types/userProfile";
import AgriculturalProjectCard from "@/components/AgriculturalProjectCard";

const Profile: React.FC = () => {
  const { userId } = useParams();
  const { user, profile, signOut, loading } = useAuth();
  const navigate = useNavigate();
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [projects, setProjects] = useState<AgriculturalProject[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const isCurrentUser = !userId || (user && userId === user.id);

  // Fetch user profile data
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        setIsLoading(true);
        const targetUserId = userId || user?.id;
        
        if (!targetUserId) {
          // No user ID, redirect to login
          navigate("/auth");
          return;
        }
        
        // Fetch user profile
        const { data, error } = await supabase
          .from('utilisateur')
          .select(`
            id_utilisateur,
            nom,
            prenoms,
            email,
            photo_profil,
            photo_couverture,
            id_role,
            role(nom_role)
          `)
          .eq('id_utilisateur', targetUserId)
          .single();
          
        if (error) throw error;
        
        if (data) {
          setUserProfile({
            id_utilisateur: data.id_utilisateur,
            nom: data.nom,
            prenoms: data.prenoms,
            email: data.email,
            photo_profil: data.photo_profil,
            photo_couverture: data.photo_couverture,
            id_role: data.id_role,
            nom_role: data.role?.nom_role,
          });
        }
        
        // Fetch user's projects
        const { data: projectsData, error: projectsError } = await supabase
          .from('projet')
          .select(`
            id_projet,
            surface_ha,
            statut,
            created_at,
            id_tantsaha,
            id_commune,
            id_technicien,
            utilisateur!id_tantsaha(id_utilisateur, nom, prenoms, photo_profil),
            commune(nom_commune, district(nom_district, region(nom_region)))
          `)
          .eq('id_tantsaha', targetUserId)
          .order('created_at', { ascending: false });
          
        if (projectsError) throw projectsError;
        
        // Fetch cultures for projects
        const { data: culturesData, error: culturesError } = await supabase
          .from('projet_culture')
          .select(`
            id_projet,
            id_culture,
            cout_exploitation_previsionnel,
            rendement_previsionnel,
            culture(nom_culture)
          `);
          
        if (culturesError) throw culturesError;
        
        // Fetch investments
        const { data: investissementsData, error: investissementsError } = await supabase
          .from('investissement')
          .select(`
            id_projet,
            montant
          `);
          
        if (investissementsError) throw investissementsError;
        
        // Fetch likes
        const { data: likesData, error: likesError } = await supabase
          .from('aimer_projet')
          .select(`
            id_projet,
            id_utilisateur
          `);
          
        if (likesError) throw likesError;
        
        // Fetch comments count
        const { data: commentsCountData, error: commentsError } = await supabase
          .from('commentaire')
          .select('id_projet');
          
        if (commentsError) throw commentsError;
        
        // Transform projects data
        const commentsCount: Record<string, number> = {};
        commentsCountData.forEach(comment => {
          const projectId = comment.id_projet.toString();
          commentsCount[projectId] = (commentsCount[projectId] || 0) + 1;
        });
        
        const transformedProjects = (projectsData || []).map(projet => {
          // Find associated cultures
          const projetCultures = culturesData.filter(pc => pc.id_projet === projet.id_projet);
          
          // Calculate funding
          const currentFunding = investissementsData
            .filter(inv => inv.id_projet === projet.id_projet)
            .reduce((sum, inv) => sum + inv.montant, 0);
          
          // Count likes
          const likes = likesData.filter(like => like.id_projet === projet.id_projet).length;
          
          // Check if user liked this project
          const isLiked = user ? 
            likesData.some(like => like.id_projet === projet.id_projet && like.id_utilisateur === user.id) : 
            false;
          
          // Count comments
          const commentCount = commentsCount[projet.id_projet.toString()] || 0;
          
          const cultivationType = projetCultures.length > 0 
            ? projetCultures[0].culture.nom_culture 
            : "Non spécifié";
          
          const farmingCost = projetCultures.length > 0 
            ? projetCultures[0].cout_exploitation_previsionnel || 0 
            : 0;
          
          const expectedYield = projetCultures.length > 0 
            ? projetCultures[0].rendement_previsionnel || 0 
            : 0;
          
          const expectedRevenue = expectedYield * projet.surface_ha * 1.5 * farmingCost;
          
          const tantsaha = projet.utilisateur;
          const farmer = tantsaha ? {
            id: tantsaha.id_utilisateur,
            name: `${tantsaha.nom} ${tantsaha.prenoms || ''}`.trim(),
            username: tantsaha.nom.toLowerCase().replace(/\s+/g, ''),
            avatar: tantsaha.photo_profil,
          } : {
            id: "",
            name: "Utilisateur inconnu",
            username: "inconnu",
            avatar: undefined,
          };
          
          return {
            id: projet.id_projet.toString(),
            title: `Projet de culture de ${cultivationType}`,
            farmer,
            location: {
              region: projet.commune?.district?.region?.nom_region || "Non spécifié",
              district: projet.commune?.district?.nom_district || "Non spécifié",
              commune: projet.commune?.nom_commune || "Non spécifié"
            },
            cultivationArea: projet.surface_ha,
            cultivationType,
            farmingCost,
            expectedYield,
            expectedRevenue,
            creationDate: new Date(projet.created_at).toISOString().split('T')[0],
            images: [], 
            description: `Projet de culture de ${cultivationType} sur un terrain de ${projet.surface_ha} hectares.`,
            fundingGoal: farmingCost * projet.surface_ha,
            currentFunding,
            likes,
            comments: commentCount,
            shares: 0,
            isLiked,
            technicienId: projet.id_technicien,
          };
        });
        
        setProjects(transformedProjects);
      } catch (error) {
        console.error('Error fetching user data:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchUserData();
  }, [user, userId, navigate]);
  
  // Redirect to auth page if not logged in
  if (!loading && !user && !userId) {
    return <Navigate to="/auth" />;
  }

  const displayProfile = isCurrentUser ? profile : userProfile;
  
  const profileData = {
    name: displayProfile?.nom || "Utilisateur",
    username: displayProfile?.email?.split('@')[0] || "utilisateur",
    avatar: displayProfile?.photo_profil || "https://images.unsplash.com/photo-1566492031773-4f4e44671857?auto=format&fit=crop&q=80&w=200",
    cover: displayProfile?.photo_couverture || "https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&q=80&w=1200",
    bio: `${displayProfile?.nom_role || "Utilisateur"} | Plateforme AgrInvest`,
    location: "Madagascar",
    website: "agrinvest.mg",
    followers: Math.floor(Math.random() * 1000) + 100, // Placeholder
    following: Math.floor(Math.random() * 500) + 50,   // Placeholder
    posts: projects.length,
  };
  
  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };
  
  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto pb-6">
      <div className="relative">
        <div
          className="h-48 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: `url(${profileData.cover})` }}
        >
          <div className="absolute inset-0 bg-gradient-to-b from-black/20 to-black/40" />
        </div>
        
        {isCurrentUser && (
          <div className="absolute top-4 right-4 flex space-x-2">
            <Button variant="outline" size="icon" className="rounded-full bg-white/80 backdrop-blur-sm">
              <Edit size={18} />
            </Button>
            <Button 
              variant="outline" 
              size="icon" 
              className="rounded-full bg-white/80 backdrop-blur-sm"
              onClick={() => navigate('/settings')}
            >
              <Settings size={18} />
            </Button>
          </div>
        )}
        
        <div className="relative -mt-16 px-4">
          <div className="flex justify-between items-end">
            <div className="bg-white p-1 rounded-full">
              <UserAvatar src={profileData.avatar} alt={profileData.name} size="lg" status="online" />
            </div>
            {isCurrentUser && (
              <Button variant="outline" className="rounded-full" onClick={signOut}>
                <LogOut size={16} className="mr-2" />
                Déconnexion
              </Button>
            )}
          </div>
          
          <div className="mt-2">
            <h1 className="text-xl font-bold">{profileData.name} {displayProfile?.prenoms || ''}</h1>
            <p className="text-sm text-gray-500">@{profileData.username}</p>
            <div className="mt-1 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
              {displayProfile?.nom_role || "Utilisateur"}
            </div>
          </div>
          
          <p className="mt-3 text-sm text-gray-800">{profileData.bio}</p>
          
          <div className="flex flex-wrap gap-y-2 mt-3">
            <div className="flex items-center text-xs text-gray-600 mr-4">
              <MapPin size={14} className="mr-1" />
              <span>{profileData.location}</span>
            </div>
            <div className="flex items-center text-xs text-gray-600">
              <LinkIcon size={14} className="mr-1" />
              <a href={`https://${profileData.website}`} target="_blank" rel="noopener noreferrer" className="text-blue-600">
                {profileData.website}
              </a>
            </div>
          </div>
          
          <div className="flex mt-4 pt-4 border-t border-border">
            <div className="flex-1 text-center">
              <p className="text-sm font-semibold">{profileData.posts}</p>
              <p className="text-xs text-gray-500">Projets</p>
            </div>
            <div className="flex-1 text-center border-x border-border">
              <p className="text-sm font-semibold">{profileData.followers}</p>
              <p className="text-xs text-gray-500">Abonnés</p>
            </div>
            <div className="flex-1 text-center">
              <p className="text-sm font-semibold">{profileData.following}</p>
              <p className="text-xs text-gray-500">Abonnements</p>
            </div>
          </div>
        </div>
      </div>
      
      <div className="px-4 mt-6">
        <Tabs defaultValue="posts" className="w-full">
          <TabsList className="grid w-full grid-cols-3 bg-muted rounded-lg">
            <TabsTrigger value="posts" className="rounded-md">Projets</TabsTrigger>
            <TabsTrigger value="photos" className="rounded-md">Photos</TabsTrigger>
            <TabsTrigger value="saved" className="rounded-md">Sauvegardés</TabsTrigger>
          </TabsList>
          
          <TabsContent value="posts" className="mt-4">
            <motion.div
              className="space-y-4"
              variants={container}
              initial="hidden"
              animate="show"
            >
              {projects.length > 0 ? (
                projects.map((project) => (
                  <motion.div key={project.id} variants={item}>
                    <AgriculturalProjectCard project={project} />
                  </motion.div>
                ))
              ) : (
                <div className="text-center py-8 border rounded-lg border-dashed">
                  Aucun projet disponible
                </div>
              )}
            </motion.div>
          </TabsContent>
          
          <TabsContent value="photos" className="mt-4">
            <div className="grid grid-cols-3 gap-1">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div
                  key={i}
                  className="aspect-square bg-gray-100 relative overflow-hidden"
                >
                  <Image className="absolute inset-0 m-auto text-gray-400" size={24} />
                </div>
              ))}
            </div>
          </TabsContent>
          
          <TabsContent value="saved" className="mt-4">
            <div className="flex items-center justify-center h-40 border rounded-lg border-dashed text-gray-500">
              Pas de projets sauvegardés
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Profile;
