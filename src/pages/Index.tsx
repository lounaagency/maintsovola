
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ChevronRight, TrendingUp, Users, MapPin, FileText, ArrowRight } from "lucide-react";
import Logo from "@/components/Logo";
import LandingPages from "@/components/LandingPages";

const Index = () => {
  const navigate = useNavigate();
  const [showLandingPages, setShowLandingPages] = useState(true);
  const [hasSeenLandingPages, setHasSeenLandingPages] = useState(() => {
    return localStorage.getItem("hasSeenLandingPages") === "true";
  });

  useEffect(() => {
    // Si l'utilisateur a déjà vu les landing pages, ne pas les afficher
    if (hasSeenLandingPages) {
      setShowLandingPages(false);
    }
  }, [hasSeenLandingPages]);

  const handleSkipLandingPages = () => {
    setShowLandingPages(false);
    localStorage.setItem("hasSeenLandingPages", "true");
    setHasSeenLandingPages(true);
  };
  
  // Mock data for the dashboard (replace with real data from your database later)
  const stats = [
    { label: "Utilisateurs actifs", value: "14", icon: <Users className="text-blue-500" size={24} /> },
    { label: "Projets en financement", value: "12", icon: <FileText className="text-amber-500" size={24} /> },
    { label: "Hectares cultivés", value: "1347,53", icon: <MapPin className="text-green-600" size={24} /> },
    { label: "Total investissement (Ar)", value: "681 916 000", icon: <TrendingUp className="text-purple-500" size={24} /> },
  ];

  const featuredProjects = [
    {
      id: 1,
      title: "Champion Rouge",
      description: "Culture de tomates en plein champ avec irrigation moderne",
      image: "/lovable-uploads/804a44d2-41b4-4ad8-92c8-51f27bd6b598.png",
      progress: 75,
      amount: "12 500 000 Ar",
      target: "16 000 000 Ar",
    },
    {
      id: 2,
      title: "Ananas Mireille",
      description: "Plantation d'ananas à grande échelle dans la région d'Alaotra",
      image: "/lovable-uploads/804a44d2-41b4-4ad8-92c8-51f27bd6b598.png",
      progress: 90,
      amount: "22 000 000 Ar",
      target: "24 500 000 Ar",
    },
    {
      id: 3,
      title: "Légumes mixtes",
      description: "Culture biologique de légumes variés pour le marché local",
      image: "/lovable-uploads/804a44d2-41b4-4ad8-92c8-51f27bd6b598.png",
      progress: 50,
      amount: "7 500 000 Ar",
      target: "15 000 000 Ar",
    },
  ];

  const popularCultures = [
    { id: 1, name: "Manioc", count: 15, image: "/lovable-uploads/804a44d2-41b4-4ad8-92c8-51f27bd6b598.png" },
    { id: 2, name: "Haricot Blanc", count: 12, image: "/lovable-uploads/804a44d2-41b4-4ad8-92c8-51f27bd6b598.png" },
    { id: 3, name: "Arachide", count: 9, image: "/lovable-uploads/804a44d2-41b4-4ad8-92c8-51f27bd6b598.png" },
    { id: 4, name: "Maïs", count: 7, image: "/lovable-uploads/804a44d2-41b4-4ad8-92c8-51f27bd6b598.png" },
  ];
  
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
    },
  ];

  const recentProjects = [
    {
      id: 1,
      title: "Plantation de Manioc",
      date: "Il y a 2 jours",
      type: "Nouveau projet",
    },
    {
      id: 2,
      title: "Récolte de Haricots",
      date: "Il y a 5 jours",
      type: "Jalon terminé",
    },
    {
      id: 3,
      title: "Culture de Maïs Bioéthanol",
      date: "Il y a 1 semaine",
      type: "Nouvel investissement",
    },
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
                <Logo 
                  size="lg"
                  showText={true}
                  className="mb-6"
                  imageClassName="h-16 md:h-20 w-auto"
                  to="/"
                />
                <h1 className="text-3xl md:text-4xl font-bold mb-4">
                  Ensemble, transformons l'agriculture malagasy
                </h1>
                <p className="text-lg md:text-xl max-w-2xl opacity-90">
                  Connecter agriculteurs, investisseurs, techniciens et superviseurs
                  pour développer l'agriculture moderne à Madagascar.
                </p>
              </div>
              
              {/* Stats Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                {stats.map((stat, index) => (
                  <div key={index} className="bg-white/10 backdrop-blur-sm rounded-lg p-4 flex items-center space-x-4">
                    <div className="bg-white/20 p-3 rounded-full">
                      {stat.icon}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-white/80">{stat.label}</p>
                      <p className="text-2xl font-bold">{stat.value}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex justify-center mt-4">
                <Button 
                  onClick={() => navigate("/feed")} 
                  className="bg-white text-maintso hover:bg-gray-100"
                  size="lg"
                >
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
                {featuredProjects.map((project) => (
                  <div key={project.id} className="border border-border rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                    <img 
                      src={project.image} 
                      alt={project.title} 
                      className="w-full h-40 object-cover"
                    />
                    <div className="p-4">
                      <h3 className="text-lg font-semibold mb-2">{project.title}</h3>
                      <p className="text-gray-600 text-sm mb-3">{project.description}</p>
                      
                      <div className="mb-2">
                        <div className="flex justify-between text-sm mb-1">
                          <span>{project.amount}</span>
                          <span className="text-gray-500">{project.target}</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2.5">
                          <div 
                            className="bg-maintso h-2.5 rounded-full" 
                            style={{ width: `${project.progress}%` }}
                          ></div>
                        </div>
                        <div className="mt-1 text-xs text-right text-gray-500">
                          {project.progress}% financé
                        </div>
                      </div>
                      
                      <Button 
                        onClick={() => navigate(`/projects/${project.id}`)} 
                        className="w-full bg-maintso hover:bg-maintso-600 mt-2"
                      >
                        Voir le projet
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </section>
            
            {/* Popular Cultures */}
            <section>
              <h2 className="text-2xl font-bold text-gray-800 mb-6">Cultures Populaires</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {popularCultures.map((culture) => (
                  <div 
                    key={culture.id}
                    onClick={() => navigate(`/feed?culture=${culture.name}`)}
                    className="bg-gray-50 border border-gray-100 rounded-lg p-4 flex flex-col items-center cursor-pointer hover:bg-gray-100 transition-colors"
                  >
                    <div className="w-16 h-16 rounded-full overflow-hidden mb-3">
                      <img 
                        src={culture.image} 
                        alt={culture.name}
                        className="w-full h-full object-cover" 
                      />
                    </div>
                    <h3 className="font-medium text-center">{culture.name}</h3>
                    <p className="text-sm text-gray-500">{culture.count} projets</p>
                  </div>
                ))}
              </div>
            </section>
            
            {/* Quick Navigation */}
            <section>
              <h2 className="text-2xl font-bold text-gray-800 mb-6">Explorer par Catégorie</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {quickNavigations.map((item, index) => (
                  <div
                    key={index}
                    className={`${item.color} rounded-lg p-6 text-white hover:opacity-95 transition-opacity cursor-pointer`}
                    onClick={() => navigate(item.path)}
                  >
                    <div className="bg-white/20 p-3 rounded-full inline-block mb-4">
                      {item.icon}
                    </div>
                    <h3 className="text-xl font-bold mb-2">{item.title}</h3>
                    <p className="opacity-90 mb-4">{item.description}</p>
                    <Button variant="outline" className="text-white border-white hover:bg-white/20">
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
                {recentProjects.map((item) => (
                  <div 
                    key={item.id}
                    className="border-l-4 border-maintso pl-4 py-2 hover:bg-gray-50 cursor-pointer"
                    onClick={() => navigate(`/projects/${item.id}`)}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-medium">{item.title}</h3>
                        <p className="text-sm text-gray-600">{item.type}</p>
                      </div>
                      <span className="text-xs text-gray-500">{item.date}</span>
                    </div>
                  </div>
                ))}
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
                  <Button 
                    onClick={() => navigate("/auth")} 
                    className="bg-maintso hover:bg-maintso-600"
                    size="lg"
                  >
                    Créer un compte
                  </Button>
                  <Button 
                    onClick={() => setShowLandingPages(true)} 
                    variant="outline"
                    className="border-maintso text-maintso hover:bg-maintso-50"
                    size="lg"
                  >
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
                <Logo 
                  size="sm"
                  showText={true}
                  to="/"
                />
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
