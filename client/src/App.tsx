import React, { useEffect } from 'react';
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

// Debug Component removed to fix import issues


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

// S'assurer que les styles sont appliqués au démarrage
const ensureStylesLoaded = () => {
  // Attendre un délai plus long pour que Vite traite complètement les styles
  setTimeout(() => {
    // Vérifier que Tailwind est chargé avec plusieurs tests
    const testElement = document.createElement('div');
    testElement.className = 'bg-blue-500 text-white p-4 w-full h-auto';
    testElement.style.position = 'absolute';
    testElement.style.left = '-9999px';
    testElement.style.visibility = 'hidden';
    document.body.appendChild(testElement);

    const styles = window.getComputedStyle(testElement);
    
    // Tests multiples pour une détection plus robuste
    const hasBackgroundColor = styles.backgroundColor && 
      styles.backgroundColor !== 'rgba(0, 0, 0, 0)' && 
      styles.backgroundColor !== 'transparent' &&
      styles.backgroundColor !== 'initial';
    
    const hasColor = styles.color && 
      styles.color !== 'rgba(0, 0, 0, 0)' && 
      styles.color !== 'transparent';
    
    const hasPadding = styles.padding && 
      styles.padding !== '0px' && 
      styles.padding !== 'initial';
    
    const hasWidth = styles.width && 
      styles.width !== 'auto' && 
      styles.width !== '0px';

    document.body.removeChild(testElement);

    // Si au moins 2 tests passent, Tailwind est probablement chargé
    const passedTests = [hasBackgroundColor, hasColor, hasPadding, hasWidth].filter(Boolean).length;
    
    if (passedTests >= 2) {
      console.log('✅ Styles Tailwind chargés et détectés correctement');
    } else {
      // Vérification alternative : regarder si les classes CSS personnalisées existent
      const hasCustomCoffeeVars = getComputedStyle(document.documentElement)
        .getPropertyValue('--coffee-primary').trim() !== '';
      
      if (hasCustomCoffeeVars) {
        console.log('✅ Styles CSS personnalisés détectés - Application fonctionnelle');
      } else {
        console.warn('⚠️ Styles Tailwind non détectés par les tests - mais l\'application fonctionne normalement');
      }
    }
  }, 200); // Délai plus long pour une détection plus fiabler les styles
};


function App() {
  useEffect(() => {
    ensureStylesLoaded();
  }, []);

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
                  <Switch>
                    {/* Route de connexion admin sans layout */}
                    <Route path="/login" component={LoginSimple} />

                    {/* Routes admin protégées avec layout */}
                    <Route>
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
                  </Switch>
                </Route>

                {/* ========== ROUTES PUBLIQUES (sans navbar pour HomePage) ========== */}
                <Route path="/" component={HomePage} />

                {/* Authentification */}
                <Route path="/login" component={LoginSimple} />

                {/* Routes publiques avec navbar/footer */}
                <Route path="/menu">
                  <Navbar />
                  <main className="flex-1">
                    <MenuPage />
                  </main>
                  <Footer />
                </Route>

                <Route path="/gallery">
                  <Navbar />
                  <main className="flex-1">
                    <GalleryPage />
                  </main>
                  <Footer />
                </Route>

                <Route path="/galerie">
                  <Navbar />
                  <main className="flex-1">
                    <GalleryPage />
                  </main>
                  <Footer />
                </Route>

                <Route path="/contact">
                  <Navbar />
                  <main className="flex-1">
                    <ContactPage />
                  </main>
                  <Footer />
                </Route>

                <Route path="/reservations">
                  <Navbar />
                  <main className="flex-1">
                    <ReservationPage />
                  </main>
                  <Footer />
                </Route>

                <Route path="/reservation">
                  <Navbar />
                  <main className="flex-1">
                    <ReservationPage />
                  </main>
                  <Footer />
                </Route>

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

              {/* Debug CSS Component removed */}

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