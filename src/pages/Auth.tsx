
import React, { useState } from "react";
import { Navigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import LoginForm from "@/components/auth/LoginForm";
import RegisterForm from "@/components/auth/RegisterForm";

export const Auth = () => {
  const { user } = useAuth();
  const [isLoginView, setIsLoginView] = useState(true);

  // Rediriger vers la page d'accueil si l'utilisateur est connecté
  if (user) {
    return <Navigate to="/" replace />;
  }

  const switchToRegister = () => {
    setIsLoginView(false);
  };

  const switchToLogin = () => {
    setIsLoginView(true);
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center p-4">
      <div className="w-full max-w-md">
        <div className="flex flex-col items-center mb-8">
          <h1 className="text-3xl font-bold">Agrofinances</h1>
          <p className="text-muted-foreground">
            Plateforme de financement agricole participatif
          </p>
        </div>

        <motion.div
          className="bg-card border rounded-lg shadow-sm p-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <AnimatePresence mode="wait">
            {isLoginView ? (
              <LoginForm key="login" switchToRegister={switchToRegister} />
            ) : (
              <RegisterForm key="register" switchToLogin={switchToLogin} />
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  );
};

export default Auth;
