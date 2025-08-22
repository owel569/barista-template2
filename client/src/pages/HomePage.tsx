import React from 'react';
import { Link } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Coffee, Users, Calendar, Star } from 'lucide-react';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-100 dark:from-gray-900 dark:to-gray-800">
      {/* Hero Section */}
      <section className="relative py-20 px-6">
        <div className="max-w-7xl mx-auto text-center">
          <div className="mb-8">
            <Coffee className="h-16 w-16 text-amber-600 mx-auto mb-4" />
            <h1 className="text-6xl font-bold text-gray-900 dark:text-white mb-4">
              Barista Café
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              Votre système de gestion de restaurant professionnel. Gérez vos menus, 
              réservations, commandes et bien plus encore.
            </p>
          </div>
          
          <div className="flex flex-wrap gap-4 justify-center">
            <Link href="/admin">
              <Button size="lg" className="bg-amber-600 hover:bg-amber-700">
                Interface Admin
              </Button>
            </Link>
            <Link href="/menu">
              <Button size="lg" variant="outline">
                Voir le Menu
              </Button>
            </Link>
            <Link href="/reservations">
              <Button size="lg" variant="outline">
                Réserver une Table
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 px-6">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12 text-gray-900 dark:text-white">
            Fonctionnalités Principales
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardHeader>
                <Coffee className="h-8 w-8 text-amber-600 mb-2" />
                <CardTitle>Gestion Menu</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 dark:text-gray-300">
                  Gérez vos articles, catégories et prix en temps réel.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <Calendar className="h-8 w-8 text-blue-600 mb-2" />
                <CardTitle>Réservations</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 dark:text-gray-300">
                  Système de réservation complet avec confirmation automatique.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <Users className="h-8 w-8 text-green-600 mb-2" />
                <CardTitle>Gestion Clients</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 dark:text-gray-300">
                  Base de données clients avec programme de fidélité.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <Star className="h-8 w-8 text-purple-600 mb-2" />
                <CardTitle>Analytics</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 dark:text-gray-300">
                  Rapports détaillés et statistiques de performance.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
    </div>
  );
}