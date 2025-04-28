import React from "react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import Logo from "@/components/Logo";

const Index = () => {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4">
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
        
        <p className="text-lg text-gray-600">Bienvenue sur la plateforme qui connecte agriculteurs, investisseurs.


Ensemble transformons l'agriculture malagasy</p>
        
        <div className="space-y-3 pt-4">
          <Button onClick={() => navigate("/feed")} className="w-full bg-maintso hover:bg-maintso-600">
            Découvrir les projets
          </Button>
          
          <Button onClick={() => navigate("/auth")} variant="outline" className="w-full border-maintso text-maintso hover:bg-maintso-50">
            Se connecter
          </Button>
        </div>
      </motion.div>
    </div>
  );
};

export default Index;
