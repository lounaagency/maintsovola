
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { motion } from "framer-motion";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/contexts/AuthContext";
import { container, item } from "./motionConstants";

const RegisterForm: React.FC = () => {
  const { signUp, loading } = useAuth();
  const [registerEmail, setRegisterEmail] = useState("");
  const [registerPassword, setRegisterPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState("agriculteur");
  const [errors, setErrors] = useState<{[key: string]: string}>({});
  
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
  
  return (
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
  );
};

export default RegisterForm;
