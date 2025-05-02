
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ChevronRight, TrendingUp, Users, MapPin, FileText, ArrowRight } from "lucide-react";
import Logo from "@/components/Logo";
import LandingPages from "@/components/LandingPages";
import { supabase } from "@/integrations/supabase/client";
import { formatCurrency } from "@/lib/utils";

const Index = () => {
  const navigate = useNavigate();
  const [showLandingPages, setShowLandingPages] = useState(true);
  const [hasSeenLandingPages, setHasSeenLandingPages] = useState(() => {
    return localStorage.getItem("hasSeenLandingPages") === "true";
  });
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalProjects: 0,
    totalHectares: 0,
    totalInvestment: 0
  });
  const [featuredProjects, setFeaturedProjects] = useState([]);
  const [popularCultures, setPopularCultures] = useState([]);
  const [recentProjects, setRecentProjects] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // If the user has already seen the landing pages, don't display them
    if (hasSeenLandingPages) {
      setShowLandingPages(false);
    }

    // Fetch data for the dashboard
    fetchDashboardData();
  }, [hasSeenLandingPages]);

  const fetchDashboardData = async () => {
    setIsLoading(true);
    try {
      // Fetch statistics
      await fetchStats();

      // Fetch featured projects
      await fetchFeaturedProjects();

      // Fetch popular cultures
      await fetchPopularCultures();

      // Fetch recent projects/activities
      await fetchRecentProjects();
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      // Count total users
      const {
        data: userData,
        error: userError,
        count: userCount
      } = await supabase.from('utilisateur').select('id_utilisateur', {
        count: 'exact',
        head: true
      });

      // Count projects in financing
      const {
        data: projectData,
        error: projectError,
        count: projectCount
      } = await supabase.from('projet').select('id_projet', {
        count: 'exact',
        head: true
      });

      // Sum of cultivated hectares
      const { data: hectares, error: hectaresError } = await supabase
        .from('projet')
        .select('surface_ha')
        .in('statut', ['en cours','en financement']);

      // Sum of investments
      const { data: investments, error: investmentsError } = await supabase
        .from('investissement')
        .select("montant");

      if (!userError && !projectError && !hectaresError && !investmentsError) {
        const totalHectares = hectares?.reduce((sum, project) => sum + (project.surface_ha || 0), 0) || 0;
        const totalInvestment = investments?.reduce((sum, inv) => sum + (inv.montant || 0), 0) || 0;
        
        setStats({
          totalUsers: userCount || 0,
          totalProjects: projectCount || 0,
          totalHectares: parseFloat(totalHectares.toFixed(2)),
          totalInvestment: totalInvestment
        });
      }
    } catch (error) {
      console.error("Error fetching stats:", error);
    }
  };

  const fetchFeaturedProjects = async () => {
    try {
      // Fetch projects in financing status
      const {
        data,
        error
      } = await supabase
        .from('projet')
        .select(`
          id_projet, 
          titre,
          statut,
          surface_ha,
          description,
          photos,
          projet_culture(culture(nom_culture),cout_exploitation_previsionnel,rendement_previsionnel)
        `)
       .eq('statut', 'en financement')
        .limit(3);

      if (!error && data) {
        // Fetch current funding for each project
        const projectsWithFunding = await Promise.all(
          data.map(async (project) => {
            const { data: investments, error: invError } = await supabase
              .from('investissement')
              .select('montant')
              .eq('id_projet', project.id_projet);

            const currentFunding = investments?.reduce((sum, inv) => sum + (inv.montant || 0), 0) || 0;
            const cout_total = project.projet_culture?.reduce((sum, pc) => sum + (pc.cout_exploitation_previsionnel || 0), 0) || 0;
            const progress = cout_total  ? Math.min(Math.round((currentFunding / cout_total) * 100), 100) : 0;
            
            return {
              id: project.id_projet,
              title: project.titre || `Projet #${project.id_projet}`,
              description: project.description || `Culture de ${project.projet_culture?.[0]?.culture?.nom_culture || 'divers produits'} sur ${project.surface_ha} hectares`,
              image: project.photos?.split(',')[0].trim()  || "/lovable-uploads/804a44d2-41b4-4ad8-92c8-51f27bd6b598.png",
              progress: progress,
              amount: formatCurrency(currentFunding),
              target: formatCurrency(cout_total || 0)
            };
          })
        );

        setFeaturedProjects(projectsWithFunding);
      }
    } catch (error) {
      console.error("Error fetching featured projects:", error);
    }
  };

  const fetchPopularCultures = async () => {
    try {
      const { data, error } = await supabase
        .from('popular_cultures')
        .select('*')
        .limit(4);
  
      if (!error && data) {
        const cultures = data.map((item) => ({
          id: item.id_culture,
          name: item.nom_culture,
          count: item.count,
          image: item.photos ? `/cultures/${item.photos}` : "/lovable-uploads/804a44d2-41b4-4ad8-92c8-51f27bd6b598.png"
        }));
  
        setPopularCultures(cultures);
      }
    } catch (error) {
      console.error("Error fetching popular cultures:", error);
    }
  };
  

  const fetchRecentProjects = async () => {
    try {
      // Fetch recently created or updated projects
      const {
        data,
        error
      } = await supabase
        .from('projet')
        .select('id_projet, titre, statut, created_at')
        .order('created_at', { ascending: false })
        .limit(4);

      if (!error && data) {
        const projects = data.map(project => {
          let type = 'Nouveau projet';
          if (project.statut === 'en financement') type = 'En financement';
          if (project.statut === 'en cours') type = 'En production';
          if (project.statut === 'terminé') type = 'Projet terminé';

          // Calculate relative time
          const createdDate = new Date(project.created_at);
          const now = new Date();
          const diffDays = Math.floor((now.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24));
          
          let date;
          if (diffDays === 0) date = 'Aujourd\'hui';
          else if (diffDays === 1) date = 'Hier';
          else if (diffDays < 7) date = `Il y a ${diffDays} jours`;
          else if (diffDays < 30) date = `Il y a ${Math.floor(diffDays / 7)} semaines`;
          else date = `Il y a ${Math.floor(diffDays / 30)} mois`;

          return {
            id: project.id_projet,
            title: project.titre || `Projet #${project.id_projet}`,
            date: date,
            type: type
          };
        });

        setRecentProjects(projects);
      }
    } catch (error) {
      console.error("Error fetching recent projects:", error);
    }
  };

  const handleSkipLandingPages = () => {
    setShowLandingPages(false);
    localStorage.setItem("hasSeenLandingPages", "true");
    setHasSeenLandingPages(true);
  };

  // Quick navigation items
  const quickNavigations = [
    {
      title: "Investir",
      description: "Découvrez les projets disponibles pour vos investissements",
      icon: <TrendingUp className="text-white" size={24} />,
      color: "bg-maintso",
      path: "/feed"
    },
    {
      title: "Terrains",
      description: "Consultez et ajoutez des terrains agricoles",
      icon: <MapPin className="text-white" size={24} />,
      color: "bg-blue-500",
      path: "/terrain"
    },
    {
      title: "Projets",
      description: "Gérez vos projets agricoles",
      icon: <FileText className="text-white" size={24} />,
      color: "bg-amber-500",
      path: "/projects"
    }
  ];

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {showLandingPages ? (
        <LandingPages onSkip={handleSkipLandingPages} />
      ) : (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="flex-1"
        >
          {/* Hero Section */}
          <div className="bg-gradient-to-r from-maintso to-green-700 text-white py-10 md:py-16">
            <div className="container mx-auto px-4">
              <div className="flex flex-col items-center text-center mb-8">
                <Logo size="lg" showText={true} className="mb-6" imageClassName="h-16 md:h-20 w-auto" to="/" />
                <h1 className="text-3xl md:text-4xl font-bold mb-4">🚀 L'agritech intelligente au service de la rentabilité durable</h1>
                <p className="text-lg md:text-xl max-w-2xl opacity-90">Chez Maintso Vola, nous connectons la finance et la technologie pour révolutionner l'agriculture.
Grâce à la data, à des outils de suivi en temps réel et à une infrastructure optimisée, chaque investissement devient traçable, performant et à fort impact.

📊 Investissez dans une nouvelle génération de projets agricoles pilotés par la tech.</p>
              </div>
              
              {/* Stats Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 flex items-center space-x-4">
                  <div className="bg-white/20 p-3 rounded-full">
                    <Users className="text-blue-500" size={24} />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white/80">Utilisateurs actifs</p>
                    <p className="text-2xl font-bold">{stats.totalUsers}</p>
                  </div>
                </div>
                
                <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 flex items-center space-x-4">
                  <div className="bg-white/20 p-3 rounded-full">
                    <FileText className="text-amber-500" size={24} />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white/80">Projets en financement</p>
                    <p className="text-2xl font-bold">{stats.totalProjects}</p>
                  </div>
                </div>
                
                <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 flex items-center space-x-4">
                  <div className="bg-white/20 p-3 rounded-full">
                    <MapPin className="text-green-600" size={24} />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white/80">Hectares cultivés</p>
                    <p className="text-2xl font-bold">{stats.totalHectares.toLocaleString('fr-MG')}</p>
                  </div>
                </div>
                
                <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 flex items-center space-x-4">
                  <div className="bg-white/20 p-3 rounded-full">
                    <TrendingUp className="text-purple-500" size={24} />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white/80">Total investissement (Ar)</p>
                    <p className="text-2xl font-bold">{stats.totalInvestment.toLocaleString('fr-MG')}</p>
                  </div>
                </div>
              </div>

              <div className="flex justify-center mt-4">
                <Button onClick={() => navigate("/feed")} className="bg-white text-maintso hover:bg-gray-100" size="lg">
                  Découvrir les projets
                  <ChevronRight className="h-5 w-5" />
                </Button>
              </div>
            </div>
          </div>
          
          {/* Main Content */}
          <div className="container mx-auto px-4 py-8 space-y-12">
            {/* Featured Projects */}
            <section>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-800">Projets Vedettes</h2>
                <Button variant="link" onClick={() => navigate("/feed")} className="text-maintso">
                  Voir tout <ArrowRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {isLoading ?
                  // Show skeleton loaders while loading
                  Array(3).fill(null).map((_, index) => (
                    <div key={index} className="border border-border rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow animate-pulse">
                      <div className="w-full h-40 bg-gray-200"></div>
                      <div className="p-4">
                        <div className="h-6 bg-gray-200 rounded w-3/4 mb-2"></div>
                        <div className="h-4 bg-gray-200 rounded w-full mb-3"></div>
                        <div className="flex justify-between text-sm mb-1">
                          <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                          <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2.5 mb-2"></div>
                        <div className="h-10 bg-gray-200 rounded w-full mt-2"></div>
                      </div>
                    </div>
                  )) : featuredProjects.length > 0 ? featuredProjects.map(project => (
                    <div key={project.id} className="border border-border rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                      <img src={project.image} alt={project.title} className="w-full h-40 object-cover" />
                      <div className="p-4">
                        <h3 className="text-lg font-semibold mb-2">{project.title}</h3>
                        <p className="text-gray-600 text-sm mb-3">{project.description}</p>
                        
                        <div className="mb-2">
                          <div className="flex justify-between text-sm mb-1">
                            <span>{project.amount}</span>
                            <span className="text-gray-500">{project.target}</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2.5">
                            <div className="bg-maintso h-2.5 rounded-full" style={{
                              width: `${project.progress}%`
                            }}></div>
                          </div>
                          <div className="mt-1 text-xs text-right text-gray-500">
                            {project.progress}% financé
                          </div>
                        </div>
                        
                        <Button onClick={() => navigate(`/projects/${project.id}`)} className="w-full bg-maintso hover:bg-maintso-600 mt-2">
                          Voir le projet
                        </Button>
                      </div>
                    </div>
                  )) : (
                  <p className="col-span-3 text-center text-gray-500 py-6">
                    Aucun projet vedette disponible pour le moment
                  </p>
                )}
              </div>
            </section>
            
            {/* Popular Cultures */}
            <section>
              <h2 className="text-2xl font-bold text-gray-800 mb-6">Cultures Populaires</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {isLoading ?
                  // Show skeleton loaders while loading
                  Array(4).fill(null).map((_, index) => (
                    <div key={index} className="bg-gray-50 animate-pulse border border-gray-100 rounded-lg p-4 flex flex-col items-center">
                      <div className="w-16 h-16 rounded-full bg-gray-200 mb-3"></div>
                      <div className="h-5 bg-gray-200 rounded w-3/4 mb-2"></div>
                      <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                    </div>
                  )) : popularCultures.length > 0 ? popularCultures.map(culture => (
                    <div key={culture.id} onClick={() => navigate(`/feed?culture=${culture.name}`)} className="bg-gray-50 border border-gray-100 rounded-lg p-4 flex flex-col items-center cursor-pointer hover:bg-gray-100 transition-colors">
                      <div className="w-16 h-16 rounded-full overflow-hidden mb-3">
                        <img src={culture.image} alt={culture.name} className="w-full h-full object-cover" />
                      </div>
                      <h3 className="font-medium text-center">{culture.name}</h3>
                      <p className="text-sm text-gray-500">{culture.count} projets</p>
                    </div>
                  )) : (
                  <p className="col-span-4 text-center text-gray-500 py-6">
                    Aucune culture populaire disponible pour le moment
                  </p>
                )}
              </div>
            </section>
            
            {/* Quick Navigation */}
            <section>
              <h2 className="text-2xl font-bold text-gray-800 mb-6">Explorer par Catégorie</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {quickNavigations.map((item, index) => (
                  <div key={index} className={`${item.color} rounded-lg p-6 text-white hover:opacity-95 transition-opacity cursor-pointer`} onClick={() => navigate(item.path)}>
                    <div className="bg-white/20 p-3 rounded-full inline-block mb-4">
                      {item.icon}
                    </div>
                    <h3 className="text-xl font-bold mb-2">{item.title}</h3>
                    <p className="opacity-90 mb-4">{item.description}</p>
                    <Button variant="outline" className="border-white hover:bg-white/20 text-green-800">
                      Accéder <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </section>
            
            {/* Recent Projects/News */}
            <section>
              <h2 className="text-2xl font-bold text-gray-800 mb-6">Actualités Récentes</h2>
              <div className="space-y-4">
                {isLoading ?
                  // Show skeleton loaders while loading
                  Array(3).fill(null).map((_, index) => (
                    <div key={index} className="border-l-4 border-maintso pl-4 py-2 animate-pulse">
                      <div className="flex justify-between items-start">
                        <div className="w-full">
                          <div className="h-5 bg-gray-200 rounded w-3/4 mb-2"></div>
                          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                        </div>
                        <div className="h-4 bg-gray-200 rounded w-16"></div>
                      </div>
                    </div>
                  )) : recentProjects.length > 0 ? recentProjects.map(item => (
                    <div key={item.id} className="border-l-4 border-maintso pl-4 py-2 hover:bg-gray-50 cursor-pointer" onClick={() => navigate(`/projects/${item.id}`)}>
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-medium">{item.title}</h3>
                          <p className="text-sm text-gray-600">{item.type}</p>
                        </div>
                        <span className="text-xs text-gray-500">{item.date}</span>
                      </div>
                    </div>
                  )) : (
                  <p className="text-center text-gray-500 py-6">
                    Aucune actualité récente disponible pour le moment
                  </p>
                )}
              </div>
            </section>
            
            {/* Call-to-Action for new users */}
            <section className="bg-gray-50 rounded-lg p-6 border border-gray-100">
              <div className="text-center max-w-2xl mx-auto">
                <h2 className="text-2xl font-bold mb-4">Rejoignez notre communauté</h2>
                <p className="text-gray-600 mb-6">
                  Que vous soyez investisseur ou agriculteur, Maintso Vola vous offre les outils nécessaires pour réussir dans le secteur agricole à Madagascar.
                </p>
                <div className="flex flex-col sm:flex-row justify-center gap-4">
                  <Button onClick={() => navigate("/auth")} className="bg-maintso hover:bg-maintso-600" size="lg">
                    Créer un compte
                  </Button>
                  <Button onClick={() => setShowLandingPages(true)} variant="outline" className="border-maintso text-maintso hover:bg-maintso-50" size="lg">
                    En savoir plus
                  </Button>
                </div>
              </div>
            </section>
          </div>
          
          {/* Footer */}
          <footer className="bg-gray-100 py-8 mt-8">
            <div className="container mx-auto px-4">
              <div className="flex flex-col md:flex-row justify-between items-center">
                <Logo size="sm" showText={true} to="/" />
                <div className="flex mt-4 md:mt-0 space-x-6">
                  <a href="#" className="text-gray-600 hover:text-maintso">Mentions légales</a>
                  <a href="#" className="text-gray-600 hover:text-maintso">Contact</a>
                  <a href="#" className="text-gray-600 hover:text-maintso">À propos</a>
                </div>
              </div>
              <div className="mt-6 pt-6 border-t border-gray-200 text-center text-sm text-gray-600">
                © {new Date().getFullYear()} Maintso Vola. Tous droits réservés.
              </div>
            </div>
          </footer>
        </motion.div>
      )}
    </div>
  );
};

export default Index;
