
import React, { useState, useEffect } from "react";
import { Navigate, useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import LoginForm from "@/components/auth/LoginForm";
import RegisterForm from "@/components/auth/RegisterForm";
import Logo from "@/components/Logo";

export const Auth = () => {
  const { user } = useAuth();
  const [isLoginView, setIsLoginView] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();

  // Check if there's a redirect path in state
  const from = location.state?.from?.pathname || "/feed";

  // Redirect to home if already logged in
  useEffect(() => {
    if (user) {
      navigate(from, { replace: true });
    }
  }, [user, navigate, from]);

  if (user) {
    return <Navigate to={from} replace />;
  }

  const switchToRegister = () => {
    setIsLoginView(false);
  };

  const switchToLogin = () => {
    setIsLoginView(true);
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center p-4 bg-gray-50">
      <div className="w-full max-w-md">
        <div className="flex flex-col items-center mb-8">
          <Logo size="lg" />
          <p className="text-muted-foreground mt-2">
            Plateforme de financement agricole participatif
          </p>
        </div>

        <div className="bg-card border rounded-lg shadow-sm p-6 bg-white">
          <div className="flex mb-6 border-b">
            <button 
              className={`pb-2 px-4 text-center ${isLoginView ? "border-b-2 border-green-600 text-green-600 font-medium" : "text-gray-500"}`}
              onClick={switchToLogin}
            >
              Connexion
            </button>
            <button 
              className={`pb-2 px-4 text-center ${!isLoginView ? "border-b-2 border-green-600 text-green-600 font-medium" : "text-gray-500"}`}
              onClick={switchToRegister}
            >
              Inscription
            </button>
          </div>
          
          <AnimatePresence mode="wait">
            {isLoginView ? (
              <motion.div
                key="login"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                <LoginForm switchToRegister={switchToRegister} />
              </motion.div>
            ) : (
              <motion.div
                key="register"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                <RegisterForm switchToLogin={switchToLogin} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default Auth;
