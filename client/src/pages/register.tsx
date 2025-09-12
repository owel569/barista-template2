import React from 'react';
import { useEffect } from "react";
import { useAuth } from "@/components/auth/AuthProvider";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Coffee, ArrowLeft, UserPlus, Shield } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { registerSchema, type RegisterFormData } from "@/lib/auth-schemas";

export default function Register() : JSX.Element {
  const { isAuthenticated, login } = useAuth();
  const [, navigate] = useLocation();
  const { toast } = useToast();

  const form = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      email: "",
      password: "",
      confirmPassword: ""
    }
  });

  const isRegistering = form.formState.isSubmitting;

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate("/admin");
    }
  }, [isAuthenticated, navigate]);

  const handleRegister = async (data: RegisterFormData) => {
    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: data.email,
          password: data.password,
          confirmPassword: data.confirmPassword
          // Removed role - will be assigned server-side for security
        })
      });

      const result = await response.json();
      
      if (response.ok && result.success) {
        // Use login function to properly authenticate the new user
        const loginResult = await login(data.email, data.password);
        
        if (loginResult.success) {
          toast({
            title: "Compte créé avec succès",
            description: `Bienvenue ${data.email}!`,
          });
          navigate("/admin");
        } else {
          toast({
            title: "Compte créé mais connexion échouée",
            description: "Veuillez vous connecter manuellement",
            variant: "destructive",
          });
          navigate("/admin/login");
        }
      } else {
        toast({
          title: "Erreur d'enregistrement",
          description: result.message || "Erreur lors de la création du compte",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Erreur de connexion au serveur",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-coffee-cream via-white to-coffee-light">
      {/* Navigation */}
      <nav className="bg-white shadow-sm border-b border-coffee-secondary">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <Link href="/">
              <div className="flex items-center space-x-3 cursor-pointer">
                <div className="bg-coffee-accent text-white rounded-full p-2">
                  <Coffee className="h-6 w-6" />
                </div>
                <span className="text-xl font-bold text-coffee-dark">
                  Barista Café
                </span>
              </div>
            </Link>
            <Link href="/admin/login">
              <Button variant="outline" className="border-coffee-dark text-coffee-dark hover:bg-coffee-dark hover:text-white" data-testid="button-back-login">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Retour à la connexion
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Registration Form */}
      <div className="flex items-center justify-center py-20">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="bg-coffee-accent text-white rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-4">
              <UserPlus className="h-10 w-10" />
            </div>
            <h1 className="text-3xl font-bold text-coffee-dark mb-2">
              Créer un compte administrateur
            </h1>
            <p className="text-gray-600">
              Enregistrez-vous pour accéder au système de gestion
            </p>
          </div>

          <Card className="shadow-xl border-coffee-secondary">
            <CardHeader className="bg-gradient-to-r from-coffee-primary to-coffee-accent text-white rounded-t-lg">
              <CardTitle className="text-center text-white">
                <UserPlus className="inline mr-2 h-5 w-5" />
                Nouvel utilisateur
              </CardTitle>
            </CardHeader>
            <CardContent className="p-8">
              <Form {...form}>
                <form onSubmit={form.handleSubmit(handleRegister)} className="space-y-6">
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-coffee-dark font-semibold">Email</FormLabel>
                        <FormControl>
                          <Input
                            type="email"
                            placeholder="Entrez votre adresse email"
                            disabled={isRegistering}
                            className="mt-2 border-coffee-secondary focus:border-coffee-accent"
                            data-testid="input-email"
                            {...field}
                          />
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
                        <FormLabel className="text-coffee-dark font-semibold">Mot de passe</FormLabel>
                        <FormControl>
                          <Input
                            type="password"
                            placeholder="Entrez votre mot de passe"
                            disabled={isRegistering}
                            className="mt-2 border-coffee-secondary focus:border-coffee-accent"
                            data-testid="input-password"
                            {...field}
                          />
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
                        <FormLabel className="text-coffee-dark font-semibold">Confirmer le mot de passe</FormLabel>
                        <FormControl>
                          <Input
                            type="password"
                            placeholder="Confirmez votre mot de passe"
                            disabled={isRegistering}
                            className="mt-2 border-coffee-secondary focus:border-coffee-accent"
                            data-testid="input-confirm-password"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button
                    type="submit"
                    disabled={isRegistering}
                    className="w-full bg-coffee-accent hover:bg-coffee-primary text-white font-semibold py-3 rounded-lg transition duration-300 transform hover:scale-105 shadow-lg"
                    data-testid="button-register"
                  >
                    <UserPlus className="mr-2 h-5 w-5" />
                    {isRegistering ? "Création en cours..." : "Créer le compte"}
                  </Button>
                </form>
              </Form>

              <div className="mt-6 text-center">
                <p className="text-sm text-gray-600">
                  Déjà un compte ?{" "}
                  <Link href="/admin/login" className="text-coffee-accent hover:text-coffee-primary font-semibold">
                    Se connecter
                  </Link>
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Security Notice */}
          <div className="mt-6 text-center">
            <div className="bg-coffee-cream border border-coffee-secondary rounded-lg p-4">
              <p className="text-sm text-coffee-dark">
                <Shield className="inline h-4 w-4 mr-1 text-coffee-accent" />
                Tous les comptes créés ont des privilèges d'administration complets.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}