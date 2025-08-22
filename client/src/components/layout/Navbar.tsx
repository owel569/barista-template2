import React from 'react';
import { Link, useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Coffee, Menu, X, User, Settings } from 'lucide-react';
import { useAuth } from '@/components/auth/AuthProvider';

export default function Navbar() {
  const [location] = useLocation();
  const { user, logout } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);

  const isActive = (path: string) => location === path;

  return (
    <nav className="bg-white dark:bg-gray-900 shadow-lg border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link href="/">
              <div className="flex items-center space-x-2 cursor-pointer">
                <Coffee className="h-8 w-8 text-amber-600" />
                <span className="text-xl font-bold text-gray-900 dark:text-white">
                  Barista Café
                </span>
              </div>
            </Link>
          </div>

          {/* Navigation Desktop */}
          <div className="hidden md:flex items-center space-x-8">
            <Link href="/">
              <Button 
                variant={isActive('/') ? 'default' : 'ghost'}
                className="text-sm"
              >
                Accueil
              </Button>
            </Link>
            
            <Link href="/menu">
              <Button 
                variant={isActive('/menu') ? 'default' : 'ghost'}
                className="text-sm"
              >
                Menu
              </Button>
            </Link>
            
            <Link href="/reservations">
              <Button 
                variant={isActive('/reservations') ? 'default' : 'ghost'}
                className="text-sm"
              >
                Réservations
              </Button>
            </Link>
            
            <Link href="/contact">
              <Button 
                variant={isActive('/contact') ? 'default' : 'ghost'}
                className="text-sm"
              >
                Contact
              </Button>
            </Link>

            {/* Boutons utilisateur */}
            <div className="flex items-center space-x-4">
              {user ? (
                <div className="flex items-center space-x-2">
                  <Link href="/admin">
                    <Button variant="outline" size="sm">
                      <Settings className="h-4 w-4 mr-2" />
                      Admin
                    </Button>
                  </Link>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={logout}
                  >
                    Déconnexion
                  </Button>
                </div>
              ) : (
                <div className="flex items-center space-x-2">
                  <Link href="/login">
                    <Button variant="ghost" size="sm">
                      Connexion
                    </Button>
                  </Link>
                  <Link href="/register">
                    <Button size="sm">
                      Inscription
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          </div>

          {/* Menu mobile */}
          <div className="md:hidden flex items-center">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </Button>
          </div>
        </div>

        {/* Menu mobile dropdown */}
        {isMenuOpen && (
          <div className="md:hidden py-4 space-y-2 border-t">
            <Link href="/">
              <Button variant="ghost" className="w-full justify-start">
                Accueil
              </Button>
            </Link>
            <Link href="/menu">
              <Button variant="ghost" className="w-full justify-start">
                Menu
              </Button>
            </Link>
            <Link href="/reservations">
              <Button variant="ghost" className="w-full justify-start">
                Réservations
              </Button>
            </Link>
            <Link href="/contact">
              <Button variant="ghost" className="w-full justify-start">
                Contact
              </Button>
            </Link>
            
            <div className="pt-2 border-t">
              {user ? (
                <div className="space-y-2">
                  <Link href="/admin">
                    <Button variant="outline" className="w-full justify-start">
                      <Settings className="h-4 w-4 mr-2" />
                      Administration
                    </Button>
                  </Link>
                  <Button 
                    variant="ghost" 
                    className="w-full justify-start"
                    onClick={logout}
                  >
                    Déconnexion
                  </Button>
                </div>
              ) : (
                <div className="space-y-2">
                  <Link href="/login">
                    <Button variant="ghost" className="w-full justify-start">
                      Connexion
                    </Button>
                  </Link>
                  <Link href="/register">
                    <Button className="w-full justify-start">
                      Inscription
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}