
import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { motion } from "framer-motion";
import { fadeIn } from "./motionConstants";

const formSchema = z.object({
  email: z.string().email({ message: "Adresse email invalide" }),
  password: z.string().min(6, { message: "Le mot de passe doit contenir au moins 6 caractères" }),
  nom: z.string().min(2, { message: "Le nom doit contenir au moins 2 caractères" }),
  prenoms: z.string().optional(),
  role: z.string({ required_error: "Veuillez sélectionner un rôle" }),
});

export default function RegisterForm({ switchToLogin }: { switchToLogin: () => void }) {
  const { signUp, loading } = useAuth();
  
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: "",
      nom: "",
      prenoms: "",
      role: "",
    },
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      await signUp({
        email: values.email,
        password: values.password,
        nom: values.nom,
        prenoms: values.prenoms,
        role: values.role,
      });
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <motion.div {...fadeIn} className="w-full max-w-md">
      <Card>
        <CardHeader>
          <CardTitle className="text-xl text-center">Créer un compte</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="nom"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nom</FormLabel>
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

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="votre@email.com" {...field} />
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
                      <Input type="password" placeholder="••••••" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="role"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Rôle</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Sélectionnez votre rôle" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="agriculteur">Agriculteur</SelectItem>
                        <SelectItem value="investisseur">Investisseur</SelectItem>
                        <SelectItem value="technicien">Technicien</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? (
                  <div className="flex items-center">
                    <div className="animate-spin mr-2 h-4 w-4 border-t-2 border-b-2 border-primary-foreground rounded-full" />
                    Inscription en cours...
                  </div>
                ) : (
                  "S'inscrire"
                )}
              </Button>
            </form>
          </Form>
        </CardContent>
        <CardFooter className="flex justify-center">
          <Button variant="link" onClick={switchToLogin} className="text-xs">
            Déjà inscrit ? Se connecter
          </Button>
        </CardFooter>
      </Card>
    </motion.div>
  );
}
