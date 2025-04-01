
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { container, item } from "./motionConstants";
import { isValidEmail, isValidPhoneNumber } from "@/lib/utils";
import { toast } from "sonner";

interface LoginFormProps {
  switchToRegister: () => void;
}

const LoginForm: React.FC<LoginFormProps> = ({ switchToRegister }) => {
  const { signIn, loading } = useAuth();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<{[key: string]: string}>({});
  
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Reset errors
    setErrors({});
    
    // Simple validation
    const newErrors: {[key: string]: string} = {};
    if (!identifier) newErrors.identifier = "L'identifiant est obligatoire";
    if (!password) newErrors.password = "Le mot de passe est obligatoire";
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    
    try {
      await signIn(identifier, password);
    } catch (error: any) {
      toast.error("Échec de la connexion : " + (error.message || "Erreur inconnue"));
    }
  };
  
  return (
    <motion.form 
      onSubmit={handleLogin}
      variants={container}
      initial="hidden"
      animate="show"
      className="space-y-4"
    >
      <motion.div variants={item} className="space-y-2">
        <Label htmlFor="identifier">Email ou Téléphone</Label>
        <Input 
          id="identifier" 
          type="text" 
          placeholder="votre@email.com ou 0324000000" 
          value={identifier}
          onChange={(e) => setIdentifier(e.target.value)}
        />
        {errors.identifier && <p className="text-sm text-red-500">{errors.identifier}</p>}
      </motion.div>
      
      <motion.div variants={item} className="space-y-2">
        <Label htmlFor="password">Mot de passe</Label>
        <Input 
          id="password" 
          type="password" 
          placeholder="********" 
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        {errors.password && <p className="text-sm text-red-500">{errors.password}</p>}
      </motion.div>
      
      <motion.div variants={item}>
        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? "Connexion..." : "Se connecter"}
        </Button>
      </motion.div>

      <motion.div variants={item} className="text-center pt-2">
        <p className="text-sm text-muted-foreground">
          Pas encore inscrit ?{" "}
          <button 
            type="button" 
            onClick={switchToRegister} 
            className="text-green-600 hover:underline font-medium">
            Créer un compte
          </button>
        </p>
      </motion.div>
    </motion.form>
  );
};

export default LoginForm;
