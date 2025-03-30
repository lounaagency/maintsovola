
import React, { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import LoginForm from "@/components/auth/LoginForm";
import RegisterForm from "@/components/auth/RegisterForm";
import { fadeIn } from "@/components/auth/motionConstants";

const Auth = () => {
  const { user } = useAuth();
  const [isLogin, setIsLogin] = useState(true);

  // Redirect if user is already logged in
  if (user) {
    return <Navigate to="/feed" replace />;
  }

  const switchToRegister = () => setIsLogin(false);
  const switchToLogin = () => setIsLogin(true);

  return (
    <div className="flex min-h-screen items-center justify-center p-4 bg-background">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-green-600">Maintso Vola</h2>
          <p className="mt-2 text-muted-foreground">
            Connecter les agriculteurs aux investisseurs
          </p>
        </div>

        <motion.div
          className="bg-white p-6 rounded-xl shadow-lg"
          variants={fadeIn}
          initial="hidden"
          animate="visible"
        >
          <AnimatePresence mode="wait">
            {isLogin ? (
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
