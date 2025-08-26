import React from 'react';
import { Router, Route, Switch } from 'wouter';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/toaster';
import { AuthProvider } from '@/components/auth/AuthProvider';

// Pages
import HomePage from '@/pages/HomePage';
import LoginSimple from '@/pages/LoginSimple';

// Layout
import AdminLayout from '@/layouts/AdminLayout';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';

// Admin Components
import Dashboard from '@/components/admin/dashboard';
import MenuManagement from '@/components/admin/menu-management';
import Orders from '@/components/admin/orders';
import Reservations from '@/components/admin/reservations';
import Customers from '@/components/admin/customers';
import Statistics from '@/components/admin/statistics';
import InventoryManagement from '@/components/admin/inventory-management';
import WorkSchedule from '@/components/admin/work-schedule/WorkSchedule';
import { PermissionsManagementImproved } from '@/components/admin/permissions-management-improved';
import ComprehensiveReportsManager from '@/components/admin/ComprehensiveReportsManager';
import UserProfileEnhanced from '@/components/admin/user-profile-enhanced-optimized';

// Configuration React Query
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000,
    },
  },
});

// Page simple pour les routes manquantes
const SimplePage = ({ title, description }: { title: string; description: string }) => (
  <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
    <div className="text-center">
      <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">{title}</h1>
      <p className="text-xl text-gray-600 dark:text-gray-300">{description}</p>
    </div>
  </div>
);

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router>
          <div className="min-h-screen bg-background flex flex-col">
            <Switch>
              {/* ========== ROUTES ADMIN (sans navbar/footer) ========== */}
              <Route path="/admin" nest>
                <AdminLayout>
                  <Switch>
                    <Route path="/" component={Dashboard} />
                    <Route path="/dashboard" component={Dashboard} />
                    <Route path="/menu">
                      <MenuManagement userRole="directeur" />
                    </Route>
                    <Route path="/orders" component={Orders} />
                    <Route path="/reservations" component={Reservations} />
                    <Route path="/customers">
                      {(user: any) => <Customers userRole="directeur" user={user} />}
                    </Route>
                    <Route path="/statistics">
                      <Statistics userRole="directeur" />
                    </Route>
                    <Route path="/inventory" component={InventoryManagement} />
                    <Route path="/schedule">
                      <WorkSchedule userRole="directeur" />
                    </Route>
                    <Route path="/permissions" component={PermissionsManagementImproved} />
                    <Route path="/reports" component={ComprehensiveReportsManager} />
                    <Route path="/profile" component={UserProfileEnhanced} />
                  </Switch>
                </AdminLayout>
              </Route>

              {/* ========== ROUTES PUBLIQUES (avec navbar/footer) ========== */}
              <Route>
                <Navbar />
                <main className="flex-1">
                  <Switch>
                    {/* Page d'accueil */}
                    <Route path="/" component={HomePage} />
                    
                    {/* Authentification */}
                    <Route path="/login" component={LoginSimple} />
                    
                    {/* Pages simples pour développement */}
                    <Route path="/menu">
                      <SimplePage 
                        title="Menu du Restaurant" 
                        description="Découvrez notre carte de spécialités" 
                      />
                    </Route>
                    
                    <Route path="/reservations">
                      <SimplePage 
                        title="Réservations" 
                        description="Réservez votre table en ligne" 
                      />
                    </Route>
                    
                    <Route path="/contact">
                      <SimplePage 
                        title="Contact" 
                        description="Contactez-nous pour plus d'informations" 
                      />
                    </Route>
                    
                    <Route path="/register">
                      <SimplePage 
                        title="Inscription" 
                        description="Créez votre compte" 
                      />
                    </Route>
                    
                    {/* 404 */}
                    <Route>
                      <SimplePage 
                        title="Page non trouvée" 
                        description="La page que vous cherchez n'existe pas" 
                      />
                    </Route>
                  </Switch>
                </main>
                <Footer />
              </Route>
            </Switch>
            
            {/* Notifications Toast */}
            <Toaster />
          </div>
        </Router>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;