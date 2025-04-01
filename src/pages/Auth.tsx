
import React, { useState, useEffect } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import LoginForm from "@/components/auth/LoginForm";
import RegisterForm from "@/components/auth/RegisterForm";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Logo from "@/components/Logo";
import LandingPages from "@/components/LandingPages";

export const Auth = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("login");
  const [showLanding, setShowLanding] = useState(true);
  const navigate = useNavigate();

  // Vérifier si l'utilisateur a déjà vu les pages d'introduction
  useEffect(() => {
    const hasSeenLanding = localStorage.getItem("hasSeenLanding");
    if (hasSeenLanding) {
      setShowLanding(false);
    }
  }, []);

  // Rediriger vers la page d'accueil si l'utilisateur est connecté
  if (user) {
    return <Navigate to="/feed" replace />;
  }

  const handleLandingComplete = () => {
    setShowLanding(false);
    localStorage.setItem("hasSeenLanding", "true");
  };

  const switchToRegister = () => {
    setActiveTab("register");
  };

  const switchToLogin = () => {
    setActiveTab("login");
  };

  if (showLanding) {
    return <LandingPages onComplete={handleLandingComplete} />;
  }

  return (
    <div className="min-h-screen flex flex-col justify-center items-center p-4 bg-gradient-to-b from-background to-background/90">
      <div className="w-full max-w-md">
        <div className="flex flex-col items-center mb-8">
          <Logo size="lg" />
          <p className="text-muted-foreground mt-2">
            Plateforme de financement agricole participatif
          </p>
        </div>

        <motion.div
          className="bg-card border rounded-lg shadow-sm p-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid grid-cols-2 mb-6">
              <TabsTrigger value="login">Connexion</TabsTrigger>
              <TabsTrigger value="register">Inscription</TabsTrigger>
            </TabsList>
            
            <AnimatePresence mode="wait">
              <TabsContent value="login" forceMount={activeTab === "login"}>
                {activeTab === "login" && (
                  <LoginForm switchToRegister={switchToRegister} />
                )}
              </TabsContent>
              
              <TabsContent value="register" forceMount={activeTab === "register"}>
                {activeTab === "register" && (
                  <RegisterForm switchToLogin={switchToLogin} />
                )}
              </TabsContent>
            </AnimatePresence>
          </Tabs>
        </motion.div>
      </div>
    </div>
  );
};

export default Auth;
