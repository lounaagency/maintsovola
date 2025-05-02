
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, X, ArrowRight, TrendingUp, Users, FileText } from "lucide-react";
import Logo from "./Logo";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

interface LandingPagesProps {
  onSkip: () => void;
}

interface StatsData {
  totalUsers: number;
  totalProjects: number;
  totalHectares: number;
  totalInvestment: number;
}

const LandingPages: React.FC<LandingPagesProps> = ({ onSkip }) => {
  const [currentPage, setCurrentPage] = useState(0);
  const [stats, setStats] = useState<StatsData>({
    totalUsers: 0,
    totalProjects: 0,
    totalHectares: 0,
    totalInvestment: 0
  });
  const [featuredProjects, setFeaturedProjects] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    // Fetching stats from database
    const fetchStats = async () => {
      try {
        // Count total users
        const { count: userCount, error: userError } = await supabase
          .from('utilisateur')
          .select('id_utilisateur', { count: 'exact', head: true });

        // Count projects in financing
        const { count: projectCount, error: projectError } = await supabase
          .from('projet')
          .select('id_projet', { count: 'exact', head: true });

        // Sum of cultivated hectares
        const { data: hectares, error: hectaresError } = await supabase
          .from('projet')
          .select('surface_ha')
          .eq('statut', 'en financement');

        // Sum of investments
        const { data: investments, error: investmentsError } = await supabase
          .from('investissement')
          .select('montant');

        if (!userError && !projectError && !hectaresError && !investmentsError) {
          const totalHectares = hectares?.reduce((sum, project) => sum + (project.surface_ha || 0), 0) || 0;
          const totalInvestment = investments?.reduce((sum, inv) => sum + (inv.montant || 0), 0) || 0;

          setStats({
            totalUsers: userCount * 10 || 0,
            totalProjects: projectCount || 0,
            totalHectares: parseFloat(totalHectares.toFixed(2)),
            totalInvestment: totalInvestment
          });
        }
      } catch (error) {
        console.error("Error fetching stats:", error);
      }
    };

    // Fetching featured projects
    const fetchFeaturedProjects = async () => {
      try {
        const { data, error } = await supabase
          .from('projet')
          .select(`
            id_projet, 
            titre,
            description,
            statut,
            culture:projet_culture(culture(nom_culture))
          `)
          .eq('statut', 'en_financement')
          .limit(3);

        if (!error && data) {
          // Also fetch current funding for each project
          const projectsWithFunding = await Promise.all(
            data.map(async (project) => {
              const { data: investments, error: invError } = await supabase
                .from('investissement')
                .select('montant')
                .eq('id_projet', project.id_projet);

              const currentFunding = investments?.reduce((sum, inv) => sum + (inv.montant || 0), 0) || 0;
              console.log(project.culture);
              
              return {
                ...project,
                currentFunding,
                buttonColor: project.id_projet % 3 === 0 ? "bg-maintso text-white" : 
                             project.id_projet % 3 === 1 ? "bg-amber-400 text-white" : "bg-blue-400 text-white",
                subtitle: project.culture?.[0]?.culture?.nom_culture || "Projet agricole"
              };
            })
          );
          console.log(projectsWithFunding);
          setFeaturedProjects(projectsWithFunding);
        }
      } catch (error) {
        console.error("Error fetching projects:", error);
      }
    };

    fetchStats();
    fetchFeaturedProjects();
  }, []);

  const slides = [
    {
      title: "Bienvenue sur Maintso Vola",
      description: "La première plateforme de financement participatif agricole à Madagascar. Nous connectons agriculteurs, investisseurs, techniciens et superviseurs pour développer l'agriculture malgache.",
      image: "/lovable-uploads/invest_is_better.png",
      cta: {
        text: "Découvrir l'application",
        action: () => navigate("/feed")
      }
    },
    {
      title: "Pour les investisseurs",
      description: "Investissez dans des projets agricoles validés par des experts et suivez leur progression en temps réel. Participez au développement de l'agriculture malgache tout en générant des revenus.",
      image: "/lovable-uploads/invest_is_better.png",
      cta: {
        text: "Découvrir les projets",
        action: () => navigate("/feed")
      }
    },
    {
      title: "Pour les agriculteurs",
      description: "Faites valider vos terrains, créez des projets agricoles et trouvez des financements pour les réaliser. Bénéficiez de l'accompagnement de techniciens qualifiés.",
      image: "/lovable-uploads/invest_is_better.png",
      cta: [
        {
          text: "Ajouter un terrain",
          action: () => navigate("/terrain")
        },
        {
          text: "Lancer un projet",
          action: () => navigate("/projects")
        }
      ]
    },
    {
      title: "Semez aujourd'hui, récoltez demain avec Maintso Vola",
      description: `Déjà ${stats.totalUsers} investisseurs nous font confiance. ${stats.totalHectares} hectares financés.`,
      image: "/lovable-uploads/invest_is_better.png",
      showcaseProjects: true
    }
  ];

  const nextSlide = () => {
    if (currentPage < slides.length - 1) {
      setCurrentPage(currentPage + 1);
    } else {
      onSkip();
    }
  };

  const prevSlide = () => {
    if (currentPage > 0) {
      setCurrentPage(currentPage - 1);
    }
  };

  // Navigation rapide pour la quatrième slide
  const quickNavItems = [
    { icon: <ArrowRight className="h-8 w-8 text-white" />, label: "Investir", color: "bg-maintso", action: () => navigate("/feed") },
    { icon: <TrendingUp className="h-8 w-8 text-white" />, label: "Suivi", color: "bg-blue-400", action: () => navigate("/feed") },
    { icon: <FileText className="h-8 w-8 text-white" />, label: "Projets", color: "bg-amber-400", action: () => navigate("/projects") }
  ];

  return (
    <div className="fixed inset-0 bg-[#faf8e9] z-50 flex flex-col">
      <div className="flex justify-between items-center p-2 bg-transparent">
        <Logo size="md" />
        <Button variant="ghost" size="icon" onClick={onSkip}>
          <X className="h-5 w-5" />
        </Button>
      </div>

      <div className="flex-1 relative overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentPage}
            initial={{ opacity: 0, x: 100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -100 }}
            transition={{ duration: 0.3 }}
            className="h-full flex flex-col items-center p-6"
          >
            {currentPage === 3 ? (
              // Quatrième slide - Style spécial basé sur l'image
              <div className="w-full max-w-md mx-auto flex flex-col h-full">
                {/* Hero section */}
                <div className="relative rounded-lg overflow-hidden mb-6">
                  <img 
                    src="/lovable-uploads/invest_is_better.png" 
                    alt="Champ agricole" 
                    className="w-full h-48 object-cover"
                  />
                  <div className="absolute inset-0 bg-black/30 flex flex-col justify-center px-6">
                    <h2 className="text-3xl font-bold text-white mb-2">Semez aujourd'hui,<br/>récoltez demain<br/>avec Maintso Vola.</h2>
                    <Button 
                      className="bg-maintso hover:bg-maintso-600 text-white w-fit mt-4"
                      onClick={() => navigate("/feed")}
                    >
                      Découvrir les projets
                    </Button>
                  </div>
                </div>

                {/* Showcase projects */}
                <div className="space-y-4 flex-1">
                  {featuredProjects.length > 0 ? (
                    featuredProjects.map((project: any) => (
                      <div key={project.id_projet} className="flex items-center justify-between">
                        <div className="flex items-center">
                          <img 
                            src="/lovable-uploads/invest_is_better.png" 
                            alt={project.titre} 
                            className="w-12 h-12 rounded-full object-cover mr-3"
                          />
                          <div>
                            <h3 className="font-medium">{project.titre || `Projet #${project.id_projet}`}</h3>
                            <p className="text-sm text-gray-600">{project.subtitle}</p>
                          </div>
                        </div>
                        <Button 
                          className={`${project.buttonColor} rounded-full px-6`}
                          onClick={() => navigate(`/feed?project=${project.id_projet}`)}
                        >
                          Voir
                        </Button>
                      </div>
                    ))
                  ) : (
                    // Fallback si aucun projet n'est chargé
                    [1, 2, 3].map((id) => (
                      <div key={id} className="flex items-center justify-between">
                        <div className="flex items-center">
                          <div className="w-12 h-12 rounded-full bg-gray-200 mr-3"></div>
                          <div>
                            <h3 className="font-medium">Chargement...</h3>
                            <p className="text-sm text-gray-600">Projet agricole</p>
                          </div>
                        </div>
                        <Button 
                          className="bg-gray-300 text-white rounded-full px-6"
                        >
                          Voir
                        </Button>
                      </div>
                    ))
                  )}
                </div>

                {/* Quick navigation */}
                <div className="flex justify-around mt-8 mb-4">
                  {quickNavItems.map((item, idx) => (
                    <div key={idx} className="flex flex-col items-center cursor-pointer" onClick={item.action}>
                      <div className={`${item.color} rounded-full w-16 h-16 flex items-center justify-center mb-2`}>
                        {item.icon}
                      </div>
                      <span className="text-sm font-medium">{item.label}</span>
                    </div>
                  ))}
                </div>

                {/* Stats */}
                <div className="bg-amber-50 rounded-lg p-4 text-center mt-4">
                  <p className="text-lg font-medium">Déjà {stats.totalUsers} investisseurs nous font confiance</p>
                  <p className="text-lg font-medium">{stats.totalHectares} hectares financés</p>
                </div>

                {/* Footer links - small */}
                <div className="flex justify-between text-sm text-gray-600 mt-6">
                  <span>Mentions légales</span>
                  <span>Contact</span>
                  <span>⦿⦾</span>
                </div>
              </div>
            ) : (
              // Slides 1 à 3 - Style standard
              <>
                <div className="mb-8 mt-4 flex-shrink-0">
                  <img 
                    src={slides[currentPage].image} 
                    alt={slides[currentPage].title} 
                    className="w-64 h-64 object-cover mx-auto rounded-lg"
                  />
                </div>
                <div className="text-center max-w-md">
                  <h2 className="text-2xl font-bold mb-4 text-maintso">{slides[currentPage].title}</h2>
                  <p className="text-lg text-gray-600 mb-8">{slides[currentPage].description}</p>
                  
                  {slides[currentPage].cta && !Array.isArray(slides[currentPage].cta) && (
                    <Button 
                      onClick={slides[currentPage].cta.action}
                      className="bg-maintso hover:bg-maintso-600 text-white w-full"
                    >
                      {slides[currentPage].cta.text}
                    </Button>
                  )}
                  
                  {slides[currentPage].cta && Array.isArray(slides[currentPage].cta) && (
                    <div className="flex flex-col space-y-3">
                      {slides[currentPage].cta.map((button, idx) => (
                        <Button 
                          key={idx}
                          onClick={button.action}
                          className={idx === 0 ? "bg-maintso hover:bg-maintso-600 text-white" : "border border-maintso text-maintso hover:bg-maintso-50"}
                        >
                          {button.text}
                        </Button>
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="p-6 border-t border-gray-100">
        <div className="flex justify-between items-center">
          <Button
            variant="outline"
            onClick={prevSlide}
            disabled={currentPage === 0}
          >
            <ChevronLeft className="mr-2 h-4 w-4" />
            Précédent
          </Button>

          <div className="flex space-x-2">
            {slides.map((_, index) => (
              <span
                key={index}
                className={`block w-2 h-2 rounded-full ${
                  currentPage === index ? "bg-maintso" : "bg-gray-300"
                }`}
                onClick={() => setCurrentPage(index)}
              />
            ))}
          </div>

          <Button onClick={nextSlide} className="bg-maintso hover:bg-maintso-600">
            {currentPage === slides.length - 1 ? (
              "Commencer"
            ) : (
              <>
                Suivant
                <ChevronRight className="ml-2 h-4 w-4" />
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default LandingPages;
