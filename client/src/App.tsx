import React from 'react';
import { Router, Route, Switch } from 'wouter';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/toaster';
import { AuthProvider } from '@/components/auth/AuthProvider';
import { LanguageProvider } from '@/contexts/LanguageContext';

// Pages
import HomePage from '@/pages/HomePage';
import LoginSimple from '@/pages/LoginSimple';
import MenuPage from '@/pages/MenuPage';
import GalleryPage from '@/pages/GalleryPage';
import ContactPage from '@/pages/ContactPage';
import ReservationPage from '@/pages/ReservationPage';

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

// Debug Component
import { DebugCSS } from '@/components/debug-css';


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
  // Ensure CSS is loaded
  if (typeof window !== 'undefined') {
    // Force CSS application
    document.documentElement.classList.add('css-loaded');
  }

  return (
    <QueryClientProvider client={queryClient}>
      <LanguageProvider>
        <AuthProvider>
          <Router>
            <div className="min-h-screen w-full bg-coffee-light text-coffee-dark" style={{
              backgroundColor: 'hsl(42, 33%, 96%)',
              color: 'hsl(30, 67%, 16%)',
              fontFamily: "'Inter', system-ui, sans-serif"
            }}>
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
                        <Customers userRole="directeur" user={null} />
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

                {/* ========== ROUTES PUBLIQUES (sans navbar pour HomePage) ========== */}
                <Route path="/" component={HomePage} />

                {/* Authentification */}
                <Route path="/login" component={LoginSimple} />

                {/* Routes publiques avec leurs composants dédiés */}
                <Route path="/menu" component={MenuPage} />
                <Route path="/gallery" component={GalleryPage} />
                <Route path="/galerie" component={GalleryPage} />
                <Route path="/contact" component={ContactPage} />
                <Route path="/reservations" component={ReservationPage} />
                <Route path="/reservation" component={ReservationPage} />

                {/* Autres routes avec navbar/footer */}
                <Route>
                  <Navbar />
                  <main className="flex-1">
                    <Switch>
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

              {/* Debug CSS Component */}
              <DebugCSS />

              {/* Notifications Toast */}
              <Toaster />
            </div>
          </Router>
        </AuthProvider>
      </LanguageProvider>
    </QueryClientProvider>
  );
}

export default App;