import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useUser } from "@/hooks/use-user";
import DashboardLayout from "./dashboard/layout";
import DashboardMain from "./dashboard/dashboard-main";
import { useLocation } from "wouter";

export default function AdminDashboardNew() {
  const { user } = useUser();
  const [location] = useLocation();

  if (!user) {
    return null;
  }

  // Route to appropriate dashboard content based on current path
  const renderContent = () => {
    switch (location) {
      case "/admin":
      case "/employe":
        return <DashboardMain />;
      case "/admin/reservations":
        return <div>Réservations (à implémenter)</div>;
      case "/admin/orders":
        return <div>Commandes (à implémenter)</div>;
      case "/admin/customers": 
        return <div>Clients (à implémenter)</div>;
      case "/admin/menu":
        return <div>Menu (à implémenter)</div>;
      case "/admin/messages":
        return <div>Messages (à implémenter)</div>;
      case "/admin/employees":
        if (user.role === "directeur") {
          return <div>Employés (à implémenter)</div>;
        }
        return <div>Accès non autorisé</div>;
      case "/admin/analytics":
        if (user.role === "directeur") {
          return <div>Statistiques avancées (à implémenter)</div>;
        }
        return <div>Accès non autorisé</div>;
      case "/admin/activity":
        if (user.role === "directeur") {
          return <div>Historique des activités (à implémenter)</div>;
        }
        return <div>Accès non autorisé</div>;
      case "/admin/settings":
        if (user.role === "directeur") {
          return <div>Paramètres généraux (à implémenter)</div>;
        }
        return <div>Accès non autorisé</div>;
      default:
        return <DashboardMain />;
    }
  };

  return (
    <DashboardLayout>
      {renderContent()}
    </DashboardLayout>
  );
}