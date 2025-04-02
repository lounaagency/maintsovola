
import React, { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";
import { container, item, fadeIn } from "./motionConstants";
import { Checkbox } from "@/components/ui/checkbox";
import { isValidEmail, isValidPhoneNumber } from "@/lib/utils";

interface RegisterFormProps {
  switchToLogin: () => void;
}

const RegisterForm: React.FC<RegisterFormProps> = ({ switchToLogin }) => {
  const { signUp } = useAuth();
  const [nom, setNom] = useState("");
  const [prenoms, setPrenoms] = useState("");
  const [email, setEmail] = useState("");
  const [telephone, setTelephone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isInvestor, setIsInvestor] = useState(false);
  const [isFarmingOwner, setIsFarmingOwner] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!nom.trim()) {
      newErrors.nom = "Le nom est obligatoire";
    }
    
    if (!email.trim() && !telephone.trim()) {
      newErrors.email = "Au moins un email ou un numéro de téléphone est obligatoire";
      newErrors.telephone = "Au moins un email ou un numéro de téléphone est obligatoire";
    }
    
    if (email && !isValidEmail(email)) {
      newErrors.email = "Format d'email invalide";
    }
    
    if (telephone && !isValidPhoneNumber(telephone)) {
      newErrors.telephone = "Format de téléphone invalide";
    }
    
    if (!password) {
      newErrors.password = "Le mot de passe est obligatoire";
    } else if (password.length < 6) {
      newErrors.password = "Le mot de passe doit contenir au moins 6 caractères";
    }
    
    if (password !== confirmPassword) {
      newErrors.confirmPassword = "Les mots de passe ne correspondent pas";
    }
    
    return newErrors;
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    const formErrors = validateForm();
    if (Object.keys(formErrors).length > 0) {
      setErrors(formErrors);
      return;
    }
    
    setIsSubmitting(true);
    setErrors({});

    try {
      const userData = {
        nom,
        prenoms,
        email: email || undefined,
        telephone: telephone || undefined,
        is_investor: isInvestor,
        is_farming_owner: isFarmingOwner,
        role: "simple" // Default role is simple
      };
      
      await signUp(email || telephone, password, userData);
      switchToLogin(); // Redirect to login after successful registration
    } catch (error: any) {
      console.error("Registration error:", error);
      setErrors({
        form: error.message || "Une erreur est survenue lors de l'inscription"
      });
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
      {errors.form && (
        <motion.div
          variants={fadeIn}
          className="bg-red-50 border border-red-200 text-red-700 px-4 py-2 rounded-md text-sm"
        >
          {errors.form}
        </motion.div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <motion.div variants={item} className="space-y-2">
          <Label htmlFor="nom">Nom <span className="text-red-500">*</span></Label>
          <Input
            id="nom"
            type="text"
            value={nom}
            onChange={(e) => setNom(e.target.value)}
            placeholder="Votre nom"
            className={errors.nom ? "border-red-500" : ""}
          />
          {errors.nom && <p className="text-sm text-red-500">{errors.nom}</p>}
        </motion.div>
        
        <motion.div variants={item} className="space-y-2">
          <Label htmlFor="prenoms">Prénoms</Label>
          <Input
            id="prenoms"
            type="text"
            value={prenoms}
            onChange={(e) => setPrenoms(e.target.value)}
            placeholder="Vos prénoms"
          />
        </motion.div>

        <motion.div variants={item} className="space-y-2">
          <Label htmlFor="email">Email {!telephone && <span className="text-red-500">*</span>}</Label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="votre@email.com"
            className={errors.email ? "border-red-500" : ""}
          />
          {errors.email && <p className="text-sm text-red-500">{errors.email}</p>}
        </motion.div>
        
        <motion.div variants={item} className="space-y-2">
          <Label htmlFor="telephone">Téléphone {!email && <span className="text-red-500">*</span>}</Label>
          <Input
            id="telephone"
            type="tel"
            value={telephone}
            onChange={(e) => setTelephone(e.target.value)}
            placeholder="032 00 000 00"
            className={errors.telephone ? "border-red-500" : ""}
          />
          {errors.telephone && <p className="text-sm text-red-500">{errors.telephone}</p>}
          <p className="text-xs text-muted-foreground">Format: 032XXXXXXX ou 033XXXXXXX</p>
        </motion.div>
        
        <motion.div variants={item} className="space-y-2">
          <Label htmlFor="password">Mot de passe <span className="text-red-500">*</span></Label>
          <Input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="********"
            className={errors.password ? "border-red-500" : ""}
          />
          {errors.password && <p className="text-sm text-red-500">{errors.password}</p>}
        </motion.div>
        
        <motion.div variants={item} className="space-y-2">
          <Label htmlFor="confirmPassword">Confirmer mot de passe <span className="text-red-500">*</span></Label>
          <Input
            id="confirmPassword"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="********"
            className={errors.confirmPassword ? "border-red-500" : ""}
          />
          {errors.confirmPassword && <p className="text-sm text-red-500">{errors.confirmPassword}</p>}
        </motion.div>

        <motion.div variants={item} className="space-y-2 pt-2">
          <Label>Pourquoi rejoindre Maintso Vola ?</Label>
          <div className="flex items-center space-x-2">
            <Checkbox 
              id="isInvestor" 
              checked={isInvestor}
              onCheckedChange={(checked) => setIsInvestor(checked === true)}
            />
            <label
              htmlFor="isInvestor"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              Je souhaite investir dans l'agriculture
            </label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox 
              id="isFarmingOwner" 
              checked={isFarmingOwner}
              onCheckedChange={(checked) => setIsFarmingOwner(checked === true)}
            />
            <label
              htmlFor="isFarmingOwner"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              Je cherche des investisseurs pour mon projet agricole
            </label>
          </div>
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
          <button 
            type="button" 
            onClick={switchToLogin} 
            className="text-green-600 hover:underline font-medium">
            Se connecter
          </button>
        </p>
      </motion.div>
    </motion.div>
  );
};

export default RegisterForm;
