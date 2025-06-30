import { useState } from "react";
import { useAuth } from "@/lib/auth";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Coffee, ArrowLeft, Shield } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";

export default function Login() {
  const { login, isAuthenticated, loading } = useAuth();
  const [, navigate] = useLocation();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isLogging, setIsLogging] = useState(false);
  const { toast } = useToast();

  // Redirect if already authenticated
  if (isAuthenticated) {
    navigate("/admin");
    return null;
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLogging(true);

    try {
      await login(username, password);
      toast({
        title: "Connexion réussie",
        description: `Bienvenue ${username}`,
      });
      navigate("/admin");
    } catch (error) {
      toast({
        title: "Erreur de connexion",
        description: "Identifiants invalides",
        variant: "destructive",
      });
    } finally {
      setIsLogging(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-coffee-light">
        <div className="text-center">
          <Coffee className="h-12 w-12 text-coffee-accent animate-pulse mx-auto mb-4" />
          <p className="text-coffee-dark">Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-coffee-light">
      {/* Header */}
      <div className="bg-coffee-dark text-white py-4">
        <div className="container mx-auto px-6 flex items-center">
          <Link href="/">
            <Button variant="ghost" className="text-coffee-secondary hover:text-white mr-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Retour au site
            </Button>
          </Link>
          <div className="text-2xl font-bold text-coffee-secondary">
            <Coffee className="inline-block mr-2 h-6 w-6" />
            Barista Café
          </div>
        </div>
      </div>

      {/* Login Form */}
      <div className="flex items-center justify-center py-20">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="bg-coffee-accent text-white rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-4">
              <Shield className="h-10 w-10" />
            </div>
            <h1 className="text-3xl font-bold text-coffee-dark mb-2">
              Espace Administrateur
            </h1>
            <p className="text-gray-600">
              Connectez-vous pour accéder au tableau de bord
            </p>
          </div>

          <Card className="shadow-xl border-0">
            <CardHeader className="text-center pb-2">
              <CardTitle className="text-2xl text-coffee-dark">
                Connexion Sécurisée
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <form onSubmit={handleLogin} className="space-y-6">
                <div>
                  <Label htmlFor="username" className="text-coffee-dark font-semibold">
                    Nom d'utilisateur
                  </Label>
                  <Input
                    id="username"
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Saisissez votre nom d'utilisateur"
                    required
                    className="mt-2 focus:border-coffee-accent focus:ring-coffee-accent"
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
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Saisissez votre mot de passe"
                    required
                    className="mt-2 focus:border-coffee-accent focus:ring-coffee-accent"
                  />
                </div>

                <Button
                  type="submit"
                  disabled={isLogging}
                  className="w-full bg-coffee-accent hover:bg-coffee-primary text-white font-semibold py-3 rounded-lg transition duration-300 transform hover:scale-105 shadow-lg"
                >
                  <Shield className="mr-2 h-5 w-5" />
                  {isLogging ? "Connexion en cours..." : "Se connecter"}
                </Button>
              </form>

              <div className="mt-6 text-center">
                <p className="text-sm text-gray-600">
                  Pas encore de compte ?{" "}
                  <Link href="/register" className="text-coffee-accent hover:text-coffee-primary font-semibold">
                    Créer un compte
                  </Link>
                </p>
                <p className="text-xs text-gray-500 mt-2">
                  Accès réservé au personnel autorisé
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Security Notice */}
          <div className="mt-6 text-center">
            <div className="bg-coffee-cream border border-coffee-secondary rounded-lg p-4">
              <p className="text-sm text-coffee-dark">
                <Shield className="inline h-4 w-4 mr-1 text-coffee-accent" />
                Connexion sécurisée SSL. Vos données sont protégées.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}