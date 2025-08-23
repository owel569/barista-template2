import React from 'react';
import { useState, useContext } from "react";
import { AuthContext } from "@/contexts/auth-context";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Coffee, ArrowLeft, UserPlus, Shield } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";
import { apiRequest } from "@/lib/queryClient";

export default function Register() : JSX.Element {
  const { isAuthenticated } = useContext(AuthContext);
  const [, navigate] = useLocation();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isRegistering, setIsRegistering] = useState(false);
  const { toast } = useToast();

  // Redirect if already authenticated
  if (isAuthenticated) {
    navigate("/admin");
    return null;
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      toast({
        title: "Erreur",
        description: "Les mots de passe ne correspondent pas",
        variant: "destructive",
      });
      return;
    }

    setIsRegistering(true);

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username,
          password,
          confirmPassword,
          role: "admin"
        }});

      const data = await response.json();
      
      if (response.ok) {
        // Store token and user info
        localStorage.setItem("auth_token", data.token);
        localStorage.setItem("auth_user", JSON.stringify(data.user);
        
        toast({
          title: "Compte créé avec succès",
          description: `Bienvenue ${username}!`,
        });
        navigate("/admin");
      } else {
        toast({
          title: "Erreur d'enregistrement",
          description: data.message || "Erreur lors de la création du compte",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Erreur de connexion au serveur",
        variant: "destructive",
      });
    } finally {
      setIsRegistering(false);
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
            <Link href="/login">
              <Button variant="outline" className="border-coffee-dark text-coffee-dark hover:bg-coffee-dark hover:text-white">
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
              <form onSubmit={handleRegister} className="space-y-6">
                <div>
                  <Label htmlFor="username" className="text-coffee-dark font-semibold">
                    Nom d'utilisateur
                  </Label>
                  <Input
                    id="username"
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value}
                    className="mt-2 border-coffee-secondary focus:border-coffee-accent"
                    placeholder="Entrez votre nom d'utilisateur"
                    required
                    minLength={3}
                  />
                </div>
                
                <div>
                  <Label htmlFor="password" className="text-coffee-dark font-semibold">
                    Mot de passe
                  </Label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value}
                    className="mt-2 border-coffee-secondary focus:border-coffee-accent"
                    placeholder="Entrez votre mot de passe"
                    required
                    minLength={6}
                  />
                </div>

                <div>
                  <Label htmlFor="confirmPassword" className="text-coffee-dark font-semibold">
                    Confirmer le mot de passe
                  </Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value}
                    className="mt-2 border-coffee-secondary focus:border-coffee-accent"
                    placeholder="Confirmez votre mot de passe"
                    required
                    minLength={6}
                  />
                </div>

                <Button
                  type="submit"
                  disabled={isRegistering}
                  className="w-full bg-coffee-accent hover:bg-coffee-primary text-white font-semibold py-3 rounded-lg transition duration-300 transform hover:scale-105 shadow-lg"
                >
                  <UserPlus className="mr-2 h-5 w-5" />
                  {isRegistering ? "Création en cours..." : "Créer le compte"}
                </Button>
              </form>

              <div className="mt-6 text-center">
                <p className="text-sm text-gray-600">
                  Déjà un compte ?{" "}
                  <Link href="/login" className="text-coffee-accent hover:text-coffee-primary font-semibold">
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