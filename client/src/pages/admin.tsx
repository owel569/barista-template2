import { useState } from "react";
import { useAuth } from "@/lib/auth";
import Navigation from "@/components/navigation";
import AdminDashboard from "@/components/admin-dashboard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Coffee } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function Admin() {
  const { user, login, isAuthenticated, loading } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isLogging, setIsLogging] = useState(false);
  const { toast } = useToast();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLogging(true);

    try {
      await login(username, password);
      toast({
        title: "Connexion réussie",
        description: `Bienvenue ${username}`,
      });
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
      <Navigation />
      
      {!isAuthenticated ? (
        <div className="py-20">
          <div className="container mx-auto px-6">
            <div className="text-center mb-16">
              <h1 className="text-4xl font-bold text-coffee-dark mb-4">
                Interface d'Administration
              </h1>
              <p className="text-lg text-gray-700 max-w-2xl mx-auto">
                Gestion complète des réservations, menu et commandes
              </p>
            </div>

            <div className="max-w-md mx-auto">
              <Card className="shadow-lg">
                <CardHeader>
                  <CardTitle className="text-2xl text-center text-coffee-dark">
                    <Coffee className="h-8 w-8 text-coffee-accent mx-auto mb-2" />
                    Connexion Administrateur
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleLogin} className="space-y-4">
                    <div>
                      <Label htmlFor="username" className="text-coffee-dark font-semibold">
                        Nom d'utilisateur
                      </Label>
                      <Input
                        id="username"
                        type="text"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        placeholder="admin"
                        required
                        className="focus:border-coffee-accent"
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
                        placeholder="••••••••"
                        required
                        className="focus:border-coffee-accent"
                      />
                    </div>
                    <Button
                      type="submit"
                      disabled={isLogging}
                      className="w-full bg-coffee-dark hover:bg-coffee-accent text-white"
                    >
                      {isLogging ? "Connexion..." : "Se connecter"}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      ) : (
        <AdminDashboard />
      )}
    </div>
  );
}
