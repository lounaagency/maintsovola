
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import Logo from "./Logo";

interface LandingPagesProps {
  onSkip: () => void;
}

const LandingPages: React.FC<LandingPagesProps> = ({ onSkip }) => {
  const [currentPage, setCurrentPage] = useState(0);

  const slides = [
    {
      title: "Bienvenue sur Maintso Vola",
      description: "La première plateforme de financement participatif agricole à Madagascar. Nous connectons agriculteurs, investisseurs, techniciens et superviseurs pour développer l'agriculture malgache.",
      image: "/placeholder.svg" // Replace with an actual image
    },
    {
      title: "Pour les agriculteurs",
      description: "Faites valider vos terrains, créez des projets agricoles et trouvez des financements pour les réaliser. Bénéficiez de l'accompagnement de techniciens qualifiés.",
      image: "/placeholder.svg" // Replace with an actual image of farmers
    },
    {
      title: "Pour les investisseurs",
      description: "Investissez dans des projets agricoles validés par des experts et suivez leur progression en temps réel. Participez au développement de l'agriculture malgache tout en générant des revenus.",
      image: "/placeholder.svg" // Replace with an actual image of investors
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

  return (
    <div className="fixed inset-0 bg-white z-50 flex flex-col">
      <div className="flex justify-between items-center p-4 border-b">
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
            className="h-full flex flex-col items-center justify-center p-6 text-center"
          >
            <div className="mb-8">
              <img 
                src={slides[currentPage].image} 
                alt={slides[currentPage].title} 
                className="w-64 h-64 object-contain mx-auto"
              />
            </div>
            <h2 className="text-2xl font-bold mb-4">{slides[currentPage].title}</h2>
            <p className="text-lg text-gray-600 max-w-md">{slides[currentPage].description}</p>
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="p-6 border-t">
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
                  currentPage === index ? "bg-green-600" : "bg-gray-300"
                }`}
              />
            ))}
          </div>

          <Button onClick={nextSlide}>
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
