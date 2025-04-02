
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
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useForm } from "react-hook-form";
import { isValidEmail, isValidPhoneNumber } from "@/lib/utils";
import { Loader2 } from "lucide-react";

interface LoginFormProps {
  switchToRegister: () => void;
}

const LoginForm: React.FC<LoginFormProps> = ({ switchToRegister }) => {
  const { login, loading } = useAuth();
  const [errorMessage, setErrorMessage] = useState("");

  const form = useForm({
    defaultValues: {
      identifier: "",
      password: "",
    },
  });

  const onSubmit = async (values: { identifier: string; password: string }) => {
    setErrorMessage("");
    const identifier = values.identifier.trim();
    const password = values.password;

    if (!identifier) {
      setErrorMessage("Veuillez entrer un email ou numéro de téléphone.");
      return;
    }

    if (!password) {
      setErrorMessage("Veuillez entrer votre mot de passe.");
      return;
    }

    try {
      // Determine if the identifier is an email or phone number
      if (isValidEmail(identifier)) {
        await login({ email: identifier, password });
      } else if (isValidPhoneNumber(identifier)) {
        await login({ phone: identifier, password });
      } else {
        setErrorMessage("Format d'email ou de numéro de téléphone invalide.");
      }
    } catch (error) {
      console.error("Login error:", error);
      setErrorMessage("Erreur de connexion. Veuillez réessayer.");
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="identifier"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email ou numéro de téléphone</FormLabel>
              <FormControl>
                <Input placeholder="name@example.com ou +261XXXXXXXXX" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Mot de passe</FormLabel>
              <FormControl>
                <Input type="password" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        {errorMessage && <p className="text-sm font-medium text-destructive">{errorMessage}</p>}
        
        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Connexion en cours...
            </>
          ) : (
            "Se connecter"
          )}
        </Button>
        
        <p className="text-center text-sm text-muted-foreground">
          Pas de compte ?{" "}
          <button
            type="button"
            onClick={switchToRegister}
            className="text-green-600 font-medium hover:underline"
          >
            S'inscrire
          </button>
        </p>
      </form>
    </Form>
  );
};

export default LoginForm;
