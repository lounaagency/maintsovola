
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, X, ArrowRight, TrendingUp, Users, FileText } from "lucide-react";
import Logo from "./Logo";
import { useNavigate } from "react-router-dom";

interface LandingPagesProps {
  onSkip: () => void;
}

const LandingPages: React.FC<LandingPagesProps> = ({ onSkip }) => {
  const [currentPage, setCurrentPage] = useState(0);
  const navigate = useNavigate();

  const slides = [
    {
      title: "Bienvenue sur Maintso Vola",
      description: "La première plateforme de financement participatif agricole à Madagascar. Nous connectons agriculteurs, investisseurs, techniciens et superviseurs pour développer l'agriculture malgache.",
      image: "/lovable-uploads/804a44d2-41b4-4ad8-92c8-51f27bd6b598.png"
    },
    {
      title: "Pour les investisseurs",
      description: "Investissez dans des projets agricoles validés par des experts et suivez leur progression en temps réel. Participez au développement de l'agriculture malgache tout en générant des revenus.",
      image: "/placeholder.svg", // À remplacer par une image réelle
      cta: {
        text: "Découvrir les projets",
        action: () => navigate("/feed")
      }
    },
    {
      title: "Pour les agriculteurs",
      description: "Faites valider vos terrains, créez des projets agricoles et trouvez des financements pour les réaliser. Bénéficiez de l'accompagnement de techniciens qualifiés.",
      image: "/placeholder.svg", // À remplacer par une image réelle
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
      description: "Déjà 120 investisseurs nous font confiance. 30 hectares financés.",
      image: "/placeholder.svg", // À remplacer par une image réelle
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

  // Projets fictifs pour la démonstration (à la slide 4)
  const showcaseProjects = [
    {
      id: 1,
      title: "Nouveaux projet",
      subtitle: "Champion Rouge",
      image: "/lovable-uploads/804a44d2-41b4-4ad8-92c8-51f27bd6b598.png",
      buttonColor: "bg-maintso text-white"
    },
    {
      id: 2,
      title: "Récolte proche",
      subtitle: "Ananas Mireille",
      image: "/lovable-uploads/804a44d2-41b4-4ad8-92c8-51f27bd6b598.png",
      buttonColor: "bg-amber-400 text-white"
    },
    {
      id: 3,
      title: "Rendement record",
      subtitle: "Légumes mixtes",
      image: "/lovable-uploads/804a44d2-41b4-4ad8-92c8-51f27bd6b598.png",
      buttonColor: "bg-blue-400 text-white"
    }
  ];

  // Navigation rapide pour la quatrième slide
  const quickNavItems = [
    { icon: <ArrowRight className="h-8 w-8 text-white" />, label: "Investir", color: "bg-maintso", action: () => navigate("/feed") },
    { icon: <TrendingUp className="h-8 w-8 text-white" />, label: "Suivi", color: "bg-blue-400", action: () => navigate("/feed") },
    { icon: <FileText className="h-8 w-8 text-white" />, label: "Projets", color: "bg-amber-400", action: () => navigate("/projects") }
  ];

  return (
    <div className="fixed inset-0 bg-[#faf8e9] z-50 flex flex-col">
      <div className="flex justify-between items-center p-4 bg-transparent">
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
                    src="/lovable-uploads/804a44d2-41b4-4ad8-92c8-51f27bd6b598.png" 
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
                  {showcaseProjects.map((project) => (
                    <div key={project.id} className="flex items-center justify-between">
                      <div className="flex items-center">
                        <img 
                          src={project.image} 
                          alt={project.title} 
                          className="w-12 h-12 rounded-full object-cover mr-3"
                        />
                        <div>
                          <h3 className="font-medium">{project.title}</h3>
                          <p className="text-sm text-gray-600">{project.subtitle}</p>
                        </div>
                      </div>
                      <Button 
                        className={`${project.buttonColor} rounded-full px-6`}
                        onClick={() => navigate("/feed")}
                      >
                        Voir
                      </Button>
                    </div>
                  ))}
                </div>

                {/* Quick navigation */}
                <div className="flex justify-around mt-8 mb-4">
                  {quickNavItems.map((item, idx) => (
                    <div key={idx} className="flex flex-col items-center" onClick={item.action}>
                      <div className={`${item.color} rounded-full w-16 h-16 flex items-center justify-center mb-2 cursor-pointer`}>
                        {item.icon}
                      </div>
                      <span className="text-sm font-medium">{item.label}</span>
                    </div>
                  ))}
                </div>

                {/* Stats */}
                <div className="bg-amber-50 rounded-lg p-4 text-center mt-4">
                  <p className="text-lg font-medium">Déjà 120 investisseurs nous font confiance</p>
                  <p className="text-lg font-medium">30 hectares financés</p>
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
                  
                  {slides[currentPage].cta && typeof slides[currentPage].cta !== 'array' && (
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
