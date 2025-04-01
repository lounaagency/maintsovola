
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { container, item } from "./motionConstants";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";

interface LoginFormProps {
  switchToRegister: () => void;
}

const LoginForm: React.FC<LoginFormProps> = ({ switchToRegister }) => {
  const { signIn, loading } = useAuth();
  const [loginMethod, setLoginMethod] = useState("email");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<{[key: string]: string}>({});
  
  const validateForm = () => {
    const newErrors: {[key: string]: string} = {};
    
    if (loginMethod === "email") {
      if (!email) newErrors.email = "L'email est obligatoire";
      else if (!/\S+@\S+\.\S+/.test(email)) newErrors.email = "Format d'email invalide";
    } else {
      if (!phone) newErrors.phone = "Le numéro de téléphone est obligatoire";
      // Validation simple pour un numéro de téléphone malgache
      else if (!/^0[3|2|3][0-9]{8}$/.test(phone)) newErrors.phone = "Format de téléphone invalide";
    }
    
    if (!password) newErrors.password = "Le mot de passe est obligatoire";
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    try {
      // Pour l'instant, nous utilisons signIn avec email car c'est ce qui est implémenté
      // Dans une vraie implémentation, on aurait une méthode pour gérer les deux cas
      if (loginMethod === "email") {
        await signIn(email, password);
      } else {
        toast.error("La connexion par téléphone n'est pas encore implémentée");
        // Implémentation future: await signInWithPhone(phone, password);
      }
    } catch (error) {
      console.error("Erreur de connexion:", error);
    }
  };
  
  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="space-y-4"
    >
      <Tabs value={loginMethod} onValueChange={setLoginMethod} className="w-full">
        <TabsList className="grid grid-cols-2 mb-4">
          <TabsTrigger value="email">Par email</TabsTrigger>
          <TabsTrigger value="phone">Par téléphone</TabsTrigger>
        </TabsList>
        
        <form onSubmit={handleLogin} className="space-y-4">
          <TabsContent value="email">
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
          </TabsContent>
          
          <TabsContent value="phone">
            <motion.div variants={item} className="space-y-2">
              <Label htmlFor="phone">Numéro de téléphone</Label>
              <Input 
                id="phone" 
                type="tel" 
                placeholder="032 XX XXX XX" 
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
              {errors.phone && <p className="text-sm text-red-500">{errors.phone}</p>}
            </motion.div>
          </TabsContent>
          
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
          
          <motion.div variants={item} className="pt-2 text-center">
            <p className="text-sm text-muted-foreground">
              Pas encore de compte ?{" "}
              <Button variant="link" className="p-0" onClick={switchToRegister}>
                S'inscrire
              </Button>
            </p>
          </motion.div>
        </form>
      </Tabs>
    </motion.div>
  );
};

export default LoginForm;
