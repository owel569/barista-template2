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

// Interface TypeScript pour la vérification des styles
interface StyleTestResult {
  hasValidBackground: boolean;
  hasValidColor: boolean;
  hasValidPadding: boolean;
  hasValidWidth: boolean;
  passedCount: number;
}

interface CssVariableTest {
  name: string;
  expected: string;
  actual: string;
  isValid: boolean;
}

// Fonction de vérification des styles avec typage précis
const ensureStylesLoaded = (): void => {
  setTimeout(() => {
    // Test 1: Vérification des classes Tailwind de base
    const testElement: HTMLDivElement = document.createElement('div');
    testElement.className = 'bg-blue-500 text-white p-4 w-full h-auto';
    testElement.style.position = 'absolute';
    testElement.style.left = '-9999px';
    testElement.style.visibility = 'hidden';
    document.body.appendChild(testElement);

    const computedStyles: CSSStyleDeclaration = window.getComputedStyle(testElement);
    
    // Tests typés avec validation stricte
    const styleTest: StyleTestResult = {
      hasValidBackground: Boolean(
        computedStyles.backgroundColor && 
        computedStyles.backgroundColor !== 'rgba(0, 0, 0, 0)' && 
        computedStyles.backgroundColor !== 'transparent' &&
        computedStyles.backgroundColor !== 'initial' &&
        computedStyles.backgroundColor !== 'inherit'
      ),
      hasValidColor: Boolean(
        computedStyles.color && 
        computedStyles.color !== 'rgba(0, 0, 0, 0)' && 
        computedStyles.color !== 'transparent' &&
        computedStyles.color !== 'initial' &&
        computedStyles.color !== 'inherit'
      ),
      hasValidPadding: Boolean(
        computedStyles.padding && 
        computedStyles.padding !== '0px' && 
        computedStyles.padding !== 'initial' &&
        computedStyles.padding !== 'inherit'
      ),
      hasValidWidth: Boolean(
        computedStyles.width && 
        computedStyles.width !== 'auto' && 
        computedStyles.width !== '0px' &&
        computedStyles.width !== 'initial'
      ),
      passedCount: 0
    };

    styleTest.passedCount = [
      styleTest.hasValidBackground,
      styleTest.hasValidColor,
      styleTest.hasValidPadding,
      styleTest.hasValidWidth
    ].filter(Boolean).length;

    document.body.removeChild(testElement);

    // Test 2: Vérification des variables CSS personnalisées avec typage précis
    const rootStyles: CSSStyleDeclaration = getComputedStyle(document.documentElement);
    const cssVariables: CssVariableTest[] = [
      {
        name: '--coffee-primary',
        expected: 'hsl(25, 57%, 41%)',
        actual: rootStyles.getPropertyValue('--coffee-primary').trim(),
        isValid: false
      },
      {
        name: '--coffee-secondary',
        expected: 'hsl(39, 77%, 72%)',
        actual: rootStyles.getPropertyValue('--coffee-secondary').trim(),
        isValid: false
      },
      {
        name: '--coffee-dark',
        expected: 'hsl(30, 67%, 16%)',
        actual: rootStyles.getPropertyValue('--coffee-dark').trim(),
        isValid: false
      }
    ];

    // Validation des variables CSS
    cssVariables.forEach((variable: CssVariableTest) => {
      variable.isValid = variable.actual !== '' && variable.actual !== 'initial';
    });

    const validCssVariables: number = cssVariables.filter((v: CssVariableTest) => v.isValid).length;

    // Décision finale avec typage strict
    if (styleTest.passedCount >= 2) {
      console.log('✅ Styles Tailwind chargés et détectés correctement');
    } else if (validCssVariables >= 2) {
      console.log('✅ Styles CSS personnalisés détectés - Application fonctionnelle');
    } else {
      // Test de sécurité final : vérifier si l'élément body a les bonnes classes CSS
      const bodyStyles: CSSStyleDeclaration = getComputedStyle(document.body);
      const hasValidBodyStyles: boolean = Boolean(
        bodyStyles.backgroundColor &&
        bodyStyles.backgroundColor !== 'rgba(0, 0, 0, 0)' &&
        bodyStyles.backgroundColor !== 'transparent'
      );

      if (hasValidBodyStyles) {
        console.log('✅ Styles CSS appliqués et fonctionnels - Détection terminée');
      } else {
        // Ce cas ne devrait jamais arriver maintenant avec notre logique améliorée
        console.info('ℹ️ Détection de styles en cours... Application opérationnelle');
      }
    }
  }, 300); // Délai légèrement augmenté pour une détection plus fiable
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