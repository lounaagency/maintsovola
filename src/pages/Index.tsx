
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
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

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4">
      {showLandingPages ? (
        <LandingPages onSkip={handleSkipLandingPages} />
      ) : (
        <motion.div 
          initial={{ opacity: 0, y: 20 }} 
          animate={{ opacity: 1, y: 0 }} 
          transition={{ duration: 0.5 }} 
          className="max-w-md w-full text-center space-y-6"
        >
          <Logo 
            size="lg" 
            showText={false} 
            className="mx-auto" 
            imageClassName="h-24 w-auto" 
          />
          
          <h1 className="text-3xl font-bold text-maintso">Maintso Vola</h1>
          
          <p className="text-lg text-gray-600">
            Bienvenue sur la plateforme qui connecte agriculteurs, investisseurs.
            Ensemble transformons l'agriculture malagasy
          </p>
          
          <div className="space-y-3 pt-4">
            <Button 
              onClick={() => navigate("/feed")} 
              className="w-full bg-maintso hover:bg-maintso-600"
            >
              Découvrir les projets
            </Button>
            
            <Button 
              onClick={() => navigate("/auth")} 
              variant="outline" 
              className="w-full border-maintso text-maintso hover:bg-maintso-50"
            >
              Se connecter
            </Button>
          </div>

          {hasSeenLandingPages && (
            <div className="pt-4">
              <Button 
                variant="link" 
                onClick={() => setShowLandingPages(true)} 
                className="text-sm text-gray-500 hover:text-maintso"
              >
                Revoir la présentation
              </Button>
            </div>
          )}
        </motion.div>
      )}
    </div>
  );
};

export default Index;
