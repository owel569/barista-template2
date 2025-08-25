import React, { useState } from 'react';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Coffee, Eye, EyeOff } from 'lucide-react';

export default function LoginSimple() : JSX.Element {
  const [, navigate] = useLocation();
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    // Validation côté client
    if (!formData.username.trim() || !formData.password.trim()) {
      setError('Veuillez remplir tous les champs');
      setIsLoading(false);
      return;
    }

    try {
      console.log('Tentative de connexion pour:', formData.username);
      
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: formData.username.trim(),
          password: formData.password
        }),
      });

      console.log('Réponse statut:', response.status);
      
      if (!response.ok) {
        if (response.status === 500) {
          throw new Error('Erreur serveur - Problème de base de données');
        }
        if (response.status === 401) {
          throw new Error('Identifiants incorrects');
        }
        throw new Error(`Erreur ${response.status}`);
      }

      const data = await response.json();
      console.log('Données reçues:', { ...data, user: data.user ? { ...data.user, password: '[HIDDEN]' } : null });

      if (data.token && data.user) {
        // Stockage sécurisé des données d'authentification
        localStorage.setItem('auth_token', data.token);
        localStorage.setItem('auth_user', JSON.stringify(data.user));
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        
        console.log('Authentification réussie, redirection...');
        
        // Redirection immédiate
        window.location.href = '/admin';
      } else {
        throw new Error('Données d\'authentification manquantes');
      }
    } catch (err: unknown) {
      console.error('Erreur de connexion détaillée:', err);
      
      if ((err as any).message?.includes('base de données')) {
        setError('Erreur de base de données - Contactez l\'administrateur');
      } else if ((err as any).message?.includes('Identifiants')) {
        setError('Nom d\'utilisateur ou mot de passe incorrect');
      } else if ((err as any).name === 'TypeError') {
        setError('Impossible de contacter le serveur');
      } else {
        setError((err as any).message || 'Erreur de connexion inattendue');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-amber-50 to-orange-100 dark:from-gray-900 dark:to-gray-800 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-4 text-center">
          <div className="flex justify-center">
            <div className="flex items-center space-x-2">
              <img 
                src="https://images.pexels.com/photos/302899/pexels-photo-302899.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1" 
                alt="Barista Café" 
                className="h-12 w-12 rounded-full object-cover"
              />
              <div>
                <h1 className="text-2xl font-bold text-amber-800 dark:text-amber-200">Barista Café</h1>
                <p className="text-sm text-amber-600 dark:text-amber-400">Administration</p>
              </div>
            </div>
          </div>
          <CardTitle className="text-2xl font-bold">Connexion</CardTitle>
          <CardDescription>
            Connectez-vous à l'interface d'administration
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="username">Nom d'utilisateur</Label>
              <Input
                id="username"
                name="username"
                type="text"
                value={formData.username}
                onChange={handleChange}
                placeholder="admin ou employe"
                required
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Mot de passe</Label>
              <div className="relative">
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Votre mot de passe"
                  required
                  disabled={isLoading}
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  disabled={isLoading}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4 text-gray-400" />
                  ) : (
                    <Eye className="h-4 w-4 text-gray-400" />
                  )}
                </button>
              </div>
            </div>

            <Button 
              type="submit" 
              className="w-full" 
              disabled={isLoading || !formData.username || !formData.password}
            >
              {isLoading ? 'Connexion...' : 'Se connecter'}
            </Button>
          </form>

          <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
            <div className="text-center space-y-2">
              <p className="text-sm text-gray-600 dark:text-gray-400">Comptes de test :</p>
              <div className="text-xs space-y-1">
                <p><span className="font-medium">Directeur:</span> admin / admin123</p>
                <p><span className="font-medium">Employé:</span> employe / employe123</p>
              </div>
            </div>
          </div>

          <div className="mt-4 text-center">
            <Button 
              variant="link" 
              onClick={() => navigate('/')}
              className="text-sm"
            >
              ← Retour au site
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}