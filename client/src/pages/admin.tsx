import React, { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useLocation, Redirect } from 'wouter';
import { AdminLayout } from '@/components/admin/admin-layout';
import { AdminDashboard } from '@/components/admin/admin-dashboard';
import ReservationsManagement from '@/components/admin/reservations-management';
import OrdersManagement from '@/components/admin/orders-management';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

interface User {
  id: number;
  username: string;
  role: 'directeur' | 'employe';
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  isActive: boolean;
  lastLogin?: string;
  createdAt: string;
  updatedAt: string;
}

export default function AdminPage() {
  const [location] = useLocation();
  const { toast } = useToast();
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check authentication on component mount
  useEffect(() => {
    const token = localStorage.getItem('admin-token');
    if (!token) {
      setIsLoading(false);
      return;
    }

    // Verify token and get user info
    const verifyToken = async () => {
      try {
        const response = await fetch('/api/auth/verify', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (response.ok) {
          const userData = await response.json();
          setUser(userData);
        } else {
          throw new Error('Token invalide');
        }
      } catch (error) {
        localStorage.removeItem('admin-token');
        toast({
          title: "Session expirée",
          description: "Veuillez vous reconnecter",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    verifyToken();
  }, [toast]);

  const handleLogout = () => {
    localStorage.removeItem('admin-token');
    setUser(null);
    toast({
      title: "Déconnexion réussie",
      description: "Vous avez été déconnecté avec succès",
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Chargement...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Redirect to="/login" />;
  }

  const renderContent = () => {
    const path = location.replace('/admin', '') || '/';
    
    switch (path) {
      case '/':
        return <AdminDashboard userRole={user.role} />;
      case '/reservations':
        return <ReservationsManagement userRole={user.role} />;
      case '/orders':
        return <OrdersManagement userRole={user.role} />;
      case '/customers':
        return <CustomersManagement userRole={user.role} />;
      case '/menu':
        return <MenuManagement userRole={user.role} />;
      case '/messages':
        return <MessagesManagement userRole={user.role} />;
      case '/employees':
        return user.role === 'directeur' ? <EmployeesManagement /> : <Redirect to="/admin" />;
      case '/settings':
        return user.role === 'directeur' ? <SettingsManagement /> : <Redirect to="/admin" />;
      case '/statistics':
        return user.role === 'directeur' ? <StatisticsManagement /> : <Redirect to="/admin" />;
      case '/logs':
        return user.role === 'directeur' ? <LogsManagement /> : <Redirect to="/admin" />;
      default:
        return <AdminDashboard userRole={user.role} />;
    }
  };

  return (
    <AdminLayout
      userRole={user.role}
      username={user.username}
      onLogout={handleLogout}
    >
      {renderContent()}
    </AdminLayout>
  );
}

// Placeholder components for other admin sections
function CustomersManagement({ userRole }: { userRole: 'directeur' | 'employe' }) {
  const isReadonly = userRole === 'employe';
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Gestion des Clients
        </h1>
        {isReadonly && (
          <div className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-sm">
            Mode lecture seule
          </div>
        )}
      </div>
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm">
        <p className="text-gray-600 dark:text-gray-400">
          Interface de gestion des clients à implémenter
        </p>
      </div>
    </div>
  );
}

function MenuManagement({ userRole }: { userRole: 'directeur' | 'employe' }) {
  const canDelete = userRole === 'directeur';
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Gestion du Menu
        </h1>
        {!canDelete && (
          <div className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">
            Ajout/Modification seulement
          </div>
        )}
      </div>
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm">
        <p className="text-gray-600 dark:text-gray-400">
          Interface de gestion du menu à implémenter
        </p>
      </div>
    </div>
  );
}

function MessagesManagement({ userRole }: { userRole: 'directeur' | 'employe' }) {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
        Gestion des Messages
      </h1>
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm">
        <p className="text-gray-600 dark:text-gray-400">
          Interface de gestion des messages à implémenter
        </p>
      </div>
    </div>
  );
}

function EmployeesManagement() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
        Gestion des Employés
      </h1>
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm">
        <p className="text-gray-600 dark:text-gray-400">
          Interface de gestion des employés à implémenter
        </p>
      </div>
    </div>
  );
}

function SettingsManagement() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
        Paramètres Généraux
      </h1>
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm">
        <p className="text-gray-600 dark:text-gray-400">
          Interface de paramètres généraux à implémenter
        </p>
      </div>
    </div>
  );
}

function StatisticsManagement() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
        Statistiques Avancées
      </h1>
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm">
        <p className="text-gray-600 dark:text-gray-400">
          Interface de statistiques avancées à implémenter
        </p>
      </div>
    </div>
  );
}

function LogsManagement() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
        Historique des Actions
      </h1>
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm">
        <p className="text-gray-600 dark:text-gray-400">
          Interface d'historique des actions à implémenter
        </p>
      </div>
    </div>
  );
}