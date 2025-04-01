
import React, { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";
import { container, item, fadeIn } from "./motionConstants";
import { toast } from "sonner";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

interface RegisterFormProps {
  switchToLogin: () => void;
}

const phoneRegex = /^0[3|2|3][0-9]{8}$/;

const registerSchema = z.object({
  nom: z.string().min(2, { message: "Le nom est obligatoire" }),
  prenoms: z.string().optional(),
  email: z.string().email({ message: "Format d'email invalide" }).optional(),
  telephone: z.string().regex(phoneRegex, { message: "Format de téléphone invalide" }).optional(),
  password: z.string().min(6, { message: "Le mot de passe doit contenir au moins 6 caractères" }),
  confirmPassword: z.string(),
  interests: z.object({
    investisseur: z.boolean().default(false),
    agriculteur: z.boolean().default(false)
  })
}).refine(data => data.email || data.telephone, {
  message: "Email ou numéro de téléphone requis",
  path: ["email"]
}).refine(data => data.password === data.confirmPassword, {
  message: "Les mots de passe ne correspondent pas",
  path: ["confirmPassword"],
});

type RegisterFormValues = z.infer<typeof registerSchema>;

const RegisterForm: React.FC<RegisterFormProps> = ({ switchToLogin }) => {
  const { signUp } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  
  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      nom: "",
      prenoms: "",
      email: "",
      telephone: "",
      password: "",
      confirmPassword: "",
      interests: {
        investisseur: false,
        agriculteur: false
      }
    },
  });

  const onSubmit = async (values: RegisterFormValues) => {
    setError("");
    setIsSubmitting(true);

    try {
      // Préparer les données utilisateur
      const userData = {
        nom: values.nom,
        prenoms: values.prenoms,
        email: values.email || undefined,
        telephone: values.telephone || undefined,
        interests: values.interests
      };

      // Utiliser email comme identifiant principal, sinon utiliser le téléphone
      const loginIdentifier = values.email || values.telephone || "";
      
      await signUp(loginIdentifier, values.password, userData);
      toast.success("Inscription réussie! Vous pouvez maintenant vous connecter.");
      switchToLogin();
    } catch (err) {
      console.error("Erreur d'inscription:", err);
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
      className="space-y-4 w-full"
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

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <motion.div variants={item}>
            <FormField
              control={form.control}
              name="nom"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nom*</FormLabel>
                  <FormControl>
                    <Input placeholder="Votre nom" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </motion.div>
          
          <motion.div variants={item}>
            <FormField
              control={form.control}
              name="prenoms"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Prénoms</FormLabel>
                  <FormControl>
                    <Input placeholder="Vos prénoms" {...field} />
                  </FormControl>
                </FormItem>
              )}
            />
          </motion.div>

          <div className="grid grid-cols-1 gap-4">
            <motion.div variants={item}>
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email{!form.getValues("telephone") && "*"}</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="votre@email.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </motion.div>
            
            <motion.div variants={item}>
              <FormField
                control={form.control}
                name="telephone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Téléphone{!form.getValues("email") && "*"}</FormLabel>
                    <FormControl>
                      <Input placeholder="032 XX XXX XX" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </motion.div>
          </div>
          
          <motion.div variants={item}>
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Mot de passe*</FormLabel>
                  <FormControl>
                    <Input type="password" placeholder="********" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </motion.div>
          
          <motion.div variants={item}>
            <FormField
              control={form.control}
              name="confirmPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Confirmer le mot de passe*</FormLabel>
                  <FormControl>
                    <Input type="password" placeholder="********" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </motion.div>
          
          <motion.div variants={item} className="space-y-2">
            <h3 className="text-sm font-medium mb-2">Vous êtes intéressé par:</h3>
            <div className="flex flex-col space-y-2">
              <FormField
                control={form.control}
                name="interests.investisseur"
                render={({ field }) => (
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="investisseur" 
                      checked={field.value} 
                      onCheckedChange={field.onChange}
                    />
                    <Label htmlFor="investisseur">Investir dans l'agriculture</Label>
                  </div>
                )}
              />
              <FormField
                control={form.control}
                name="interests.agriculteur"
                render={({ field }) => (
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="agriculteur" 
                      checked={field.value} 
                      onCheckedChange={field.onChange} 
                    />
                    <Label htmlFor="agriculteur">Chercher des investisseurs</Label>
                  </div>
                )}
              />
            </div>
          </motion.div>
          
          <motion.div variants={item}>
            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? "Inscription en cours..." : "S'inscrire"}
            </Button>
          </motion.div>
        </form>
      </Form>
      
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
