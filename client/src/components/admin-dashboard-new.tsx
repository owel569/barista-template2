import React, { useState } from "react";
import { useAuth } from "@/lib/auth";
import { useLocation } from "wouter";

export default function AdminDashboardNew() {
  const { user, isAuthenticated, loading } = useAuth();
  const [location, navigate] = useLocation();

  // Redirect to login if not authenticated
  React.useEffect(() => {
    if (!loading && !isAuthenticated) {
      navigate("/login");
    }
  }, [isAuthenticated, loading, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-8 h-8 bg-amber-500 rounded-lg animate-pulse mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return null;
  }

  // Pour l'instant, utiliser un composant de test simple
  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          Interface {user.role === "directeur" ? "Directeur" : "Employé"} - Barista Café
        </h1>
        
        <div className="mb-6 bg-white p-4 rounded-lg shadow">
          <h2 className="text-lg font-semibold text-gray-800 mb-2">
            Utilisateur connecté
          </h2>
          <p className="text-gray-600">
            Nom d'utilisateur: {user.username}<br />
            Rôle: {user.role}<br />
            ID: {user.id}
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">
              Réservations
            </h2>
            <p className="text-gray-600">
              Gestion des réservations client
            </p>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">
              Commandes
            </h2>
            <p className="text-gray-600">
              Suivi des commandes en cours
            </p>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">
              Menu
            </h2>
            <p className="text-gray-600">
              Gestion du menu et des prix
            </p>
          </div>
          
          {(user.role === "directeur" || user.role === "admin") && (
            <>
              <div className="bg-white p-6 rounded-lg shadow">
                <h2 className="text-xl font-semibold text-gray-800 mb-4">
                  Employés
                </h2>
                <p className="text-gray-600">
                  Gestion des employés et permissions
                </p>
              </div>
              
              <div className="bg-white p-6 rounded-lg shadow">
                <h2 className="text-xl font-semibold text-gray-800 mb-4">
                  Statistiques
                </h2>
                <p className="text-gray-600">
                  Rapports et analytics avancés
                </p>
              </div>
              
              <div className="bg-white p-6 rounded-lg shadow">
                <h2 className="text-xl font-semibold text-gray-800 mb-4">
                  Paramètres
                </h2>
                <p className="text-gray-600">
                  Configuration générale du café
                </p>
              </div>
            </>
          )}
        </div>
        
        <div className="mt-8 bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">
            Statut du système
          </h2>
          <div className="space-y-2">
            <p className="text-green-600">✅ Interface admin fonctionnelle</p>
            <p className="text-green-600">✅ Authentification avec rôles</p>
            <p className="text-green-600">✅ Base de données avec doublons éliminés</p>
            <p className="text-amber-600">⚠️ Interface complète en cours de développement</p>
          </div>
        </div>
        
        <div className="mt-6">
          <button 
            onClick={() => {
              // Utiliser l'ancien système de logout pour l'instant
              localStorage.removeItem("auth_token");
              navigate("/login");
            }}
            className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
          >
            Déconnexion
          </button>
        </div>
      </div>
    </div>
  );
}