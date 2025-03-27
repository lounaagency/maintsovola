
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { Navigate } from "react-router-dom";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const Auth: React.FC = () => {
  const { signIn, signUp, user, loading } = useAuth();
  const [activeTab, setActiveTab] = useState<"login" | "register">("login");
  
  // Login form state
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  
  // Register form state
  const [registerEmail, setRegisterEmail] = useState("");
  const [registerPassword, setRegisterPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState("agriculteur");
  
  // Errors
  const [errors, setErrors] = useState<{[key: string]: string}>({});
  
  // Redirect if already logged in
  if (user) {
    return <Navigate to="/" />;
  }
  
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
  
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Simple validation
    const newErrors: {[key: string]: string} = {};
    if (!registerEmail) newErrors.registerEmail = "L'email est obligatoire";
    if (!registerPassword) newErrors.registerPassword = "Le mot de passe est obligatoire";
    if (registerPassword.length < 6) newErrors.registerPassword = "Le mot de passe doit contenir au moins 6 caractères";
    if (registerPassword !== confirmPassword) newErrors.confirmPassword = "Les mots de passe ne correspondent pas";
    if (!name) newErrors.name = "Le nom est obligatoire";
    if (!role) newErrors.role = "Le rôle est obligatoire";
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    
    await signUp(registerEmail, registerPassword, { 
      nom: name, 
      role: role 
    });
  };
  
  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };
  
  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50">
      <motion.div
        className="w-full max-w-md bg-white rounded-xl shadow-md overflow-hidden"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="p-6">
          <h1 className="text-2xl font-bold text-center mb-6">Bienvenue sur AgrInvest</h1>
          
          <Tabs defaultValue="login" value={activeTab} onValueChange={(value) => setActiveTab(value as "login" | "register")}>
            <TabsList className="grid w-full grid-cols-2 mb-8">
              <TabsTrigger value="login">Connexion</TabsTrigger>
              <TabsTrigger value="register">Inscription</TabsTrigger>
            </TabsList>
            
            <TabsContent value="login">
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
            </TabsContent>
            
            <TabsContent value="register">
              <motion.form 
                onSubmit={handleRegister}
                variants={container}
                initial="hidden"
                animate="show"
                className="space-y-4"
              >
                <motion.div variants={item} className="space-y-2">
                  <Label htmlFor="name">Nom complet</Label>
                  <Input 
                    id="name" 
                    type="text" 
                    placeholder="Votre nom" 
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                  {errors.name && <p className="text-sm text-red-500">{errors.name}</p>}
                </motion.div>
                
                <motion.div variants={item} className="space-y-2">
                  <Label htmlFor="registerEmail">Email</Label>
                  <Input 
                    id="registerEmail" 
                    type="email" 
                    placeholder="votre@email.com" 
                    value={registerEmail}
                    onChange={(e) => setRegisterEmail(e.target.value)}
                  />
                  {errors.registerEmail && <p className="text-sm text-red-500">{errors.registerEmail}</p>}
                </motion.div>
                
                <motion.div variants={item} className="space-y-2">
                  <Label htmlFor="role">Rôle</Label>
                  <Select value={role} onValueChange={setRole}>
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionnez un rôle" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="agriculteur">Agriculteur</SelectItem>
                      <SelectItem value="investisseur">Investisseur</SelectItem>
                      <SelectItem value="superviseur">Superviseur</SelectItem>
                      <SelectItem value="technicien">Technicien</SelectItem>
                    </SelectContent>
                  </Select>
                  {errors.role && <p className="text-sm text-red-500">{errors.role}</p>}
                </motion.div>
                
                <motion.div variants={item} className="space-y-2">
                  <Label htmlFor="registerPassword">Mot de passe</Label>
                  <Input 
                    id="registerPassword" 
                    type="password" 
                    placeholder="********" 
                    value={registerPassword}
                    onChange={(e) => setRegisterPassword(e.target.value)}
                  />
                  {errors.registerPassword && <p className="text-sm text-red-500">{errors.registerPassword}</p>}
                </motion.div>
                
                <motion.div variants={item} className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirmer le mot de passe</Label>
                  <Input 
                    id="confirmPassword" 
                    type="password" 
                    placeholder="********" 
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                  />
                  {errors.confirmPassword && <p className="text-sm text-red-500">{errors.confirmPassword}</p>}
                </motion.div>
                
                <motion.div variants={item}>
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? "Inscription..." : "S'inscrire"}
                  </Button>
                </motion.div>
              </motion.form>
            </TabsContent>
          </Tabs>
        </div>
      </motion.div>
    </div>
  );
};

export default Auth;
