
import React, { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/contexts/AuthContext";
import { container, item, fadeIn } from "./motionConstants";

interface RegisterFormProps {
  switchToLogin: () => void;
}

const RegisterForm: React.FC<RegisterFormProps> = ({ switchToLogin }) => {
  const { signUp } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [nom, setNom] = useState("");
  const [prenoms, setPrenoms] = useState("");
  const [role, setRole] = useState("agriculteur");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      await signUp(email, password, { nom, prenoms, role });
    } catch (err) {
      console.error("Registration error:", err);
      setError(
        err instanceof Error
          ? err.message
          : "Une erreur est survenue lors de l'inscription"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <motion.div 
      variants={container}
      initial="hidden"
      animate="show"
      className="space-y-6 w-full"
    >
      <div className="space-y-2 text-center">
        <h1 className="text-2xl font-semibold tracking-tight">
          Créer un compte
        </h1>
        <p className="text-sm text-muted-foreground">
          Inscrivez-vous pour accéder à la plateforme
        </p>
      </div>

      {error && (
        <motion.div
          variants={fadeIn}
          initial="hidden"
          animate="visible"
          className="bg-red-50 border border-red-200 text-red-700 px-4 py-2 rounded-md text-sm"
        >
          {error}
        </motion.div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <motion.div variants={item}>
          <Input
            type="text"
            placeholder="Nom"
            value={nom}
            onChange={(e) => setNom(e.target.value)}
            required
          />
        </motion.div>
        
        <motion.div variants={item}>
          <Input
            type="text"
            placeholder="Prénoms"
            value={prenoms}
            onChange={(e) => setPrenoms(e.target.value)}
          />
        </motion.div>

        <motion.div variants={item}>
          <Input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </motion.div>
        
        <motion.div variants={item}>
          <Input
            type="password"
            placeholder="Mot de passe"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </motion.div>
        
        <motion.div variants={item}>
          <Select value={role} onValueChange={setRole}>
            <SelectTrigger>
              <SelectValue placeholder="Sélectionnez votre rôle" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="agriculteur">Agriculteur</SelectItem>
              <SelectItem value="investisseur">Investisseur</SelectItem>
              <SelectItem value="technicien">Technicien</SelectItem>
              <SelectItem value="superviseur">Superviseur</SelectItem>
            </SelectContent>
          </Select>
        </motion.div>
        
        <motion.div variants={item}>
          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? "Inscription en cours..." : "S'inscrire"}
          </Button>
        </motion.div>
      </form>
      
      <motion.div variants={item} className="text-center">
        <p className="text-sm text-muted-foreground">
          Déjà un compte ?{" "}
          <Button variant="link" className="p-0" onClick={switchToLogin}>
            Se connecter
          </Button>
        </p>
      </motion.div>
    </motion.div>
  );
};

export default RegisterForm;
