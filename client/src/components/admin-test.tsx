import React from "react";

export default function AdminTest() {
  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          Test Admin Dashboard
        </h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">
              Réservations
            </h2>
            <p className="text-gray-600">
              Système de gestion des réservations
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
        </div>
        
        <div className="mt-8 bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">
            Statut du système
          </h2>
          <div className="space-y-2">
            <p className="text-green-600">✅ Interface admin fonctionnelle</p>
            <p className="text-green-600">✅ Système de navigation</p>
            <p className="text-amber-600">⚠️ Authentification en cours d'intégration</p>
          </div>
        </div>
      </div>
    </div>
  );
}