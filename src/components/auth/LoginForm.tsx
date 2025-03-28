
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { container, item } from "./motionConstants";

const LoginForm: React.FC = () => {
  const { signIn, loading } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<{[key: string]: string}>({});
  
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Simple validation
    const newErrors: {[key: string]: string} = {};
    if (!email) newErrors.email = "L'email est obligatoire";
    if (!password) newErrors.password = "Le mot de passe est obligatoire";
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    
    await signIn(email, password);
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
        <Label htmlFor="email">Email</Label>
        <Input 
          id="email" 
          type="email" 
          placeholder="votre@email.com" 
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        {errors.email && <p className="text-sm text-red-500">{errors.email}</p>}
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
    </motion.form>
  );
};

export default LoginForm;
