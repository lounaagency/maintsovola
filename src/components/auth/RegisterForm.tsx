
import React, { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useForm } from "react-hook-form";
import { Loader2 } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { isValidEmail, isValidPhoneNumber } from "@/lib/utils";

interface RegisterFormProps {
  switchToLogin: () => void;
}

const RegisterForm: React.FC<RegisterFormProps> = ({ switchToLogin }) => {
  const { signup, loading } = useAuth();
  const [errorMessage, setErrorMessage] = useState("");

  const form = useForm({
    defaultValues: {
      nom: "",
      prenoms: "",
      email: "",
      phone: "",
      password: "",
      confirmPassword: "",
      is_investor: false,
      is_farming_owner: false
    },
  });

  const onSubmit = async (values: {
    nom: string;
    prenoms: string;
    email: string;
    phone: string;
    password: string;
    confirmPassword: string;
    is_investor: boolean;
    is_farming_owner: boolean;
  }) => {
    setErrorMessage("");
    
    if (!values.nom.trim()) {
      setErrorMessage("Le nom est obligatoire.");
      return;
    }

    if (!values.email.trim() && !values.phone.trim()) {
      setErrorMessage("Email ou numéro de téléphone obligatoire.");
      return;
    }

    if (values.email && !isValidEmail(values.email)) {
      setErrorMessage("Format d'email invalide.");
      return;
    }

    if (values.phone && !isValidPhoneNumber(values.phone)) {
      setErrorMessage("Format de téléphone invalide (ex: 0XXXXXXXXX ou +261XXXXXXXXX).");
      return;
    }

    if (!values.password) {
      setErrorMessage("Mot de passe obligatoire.");
      return;
    }

    if (values.password !== values.confirmPassword) {
      setErrorMessage("Les mots de passe ne correspondent pas.");
      return;
    }

    try {
      await signup({
        nom: values.nom,
        prenoms: values.prenoms,
        email: values.email || undefined,
        phone: values.phone || undefined,
        password: values.password,
        is_investor: values.is_investor,
        is_farming_owner: values.is_farming_owner
      });
      
      // The switchToLogin will be called inside the signup function after success
    } catch (error) {
      console.error("Registration error:", error);
      setErrorMessage("Erreur lors de l'inscription. Veuillez réessayer.");
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="nom"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nom <span className="text-red-500">*</span></FormLabel>
              <FormControl>
                <Input placeholder="Votre nom" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="prenoms"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Prénoms</FormLabel>
              <FormControl>
                <Input placeholder="Vos prénoms" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input placeholder="nom@exemple.com" type="email" {...field} />
                </FormControl>
                <FormDescription>
                  Email ou téléphone obligatoire
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="phone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Téléphone</FormLabel>
                <FormControl>
                  <Input placeholder="+261XXXXXXXXX" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Mot de passe <span className="text-red-500">*</span></FormLabel>
                <FormControl>
                  <Input type="password" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="confirmPassword"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Confirmer le mot de passe <span className="text-red-500">*</span></FormLabel>
                <FormControl>
                  <Input type="password" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="space-y-2">
          <FormField
            control={form.control}
            name="is_investor"
            render={({ field }) => (
              <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
                <FormLabel className="font-normal">
                  Je souhaite investir dans des projets agricoles
                </FormLabel>
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="is_farming_owner"
            render={({ field }) => (
              <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
                <FormLabel className="font-normal">
                  Je cherche des investisseurs pour mes terrains
                </FormLabel>
              </FormItem>
            )}
          />
        </div>

        {errorMessage && <p className="text-sm font-medium text-destructive">{errorMessage}</p>}

        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Création du compte...
            </>
          ) : (
            "S'inscrire"
          )}
        </Button>

        <p className="text-center text-sm text-muted-foreground">
          Vous avez déjà un compte ?{" "}
          <button
            type="button"
            onClick={switchToLogin}
            className="text-green-600 font-medium hover:underline"
          >
            Se connecter
          </button>
        </p>
      </form>
    </Form>
  );
};

export default RegisterForm;
