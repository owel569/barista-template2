
import React from 'react';
import { Route, Switch } from 'wouter';
import HomePage from '@/pages/HomePage';
import MenuPage from '@/pages/MenuPage';
import GalleryPage from '@/pages/GalleryPage';
import AdminFinal from '@/pages/AdminFinal';
import LoginSimple from '@/pages/LoginSimple';
import Reservations from '@/pages/Reservations';
import ReservationWithCart from '@/pages/reservation-with-cart';
import NotFound from '@/pages/not-found';

const AppRoutes: React.FC = () => {
  return (
    <Switch>
      {/* Page d'accueil */}
      <Route path="/" component={HomePage} />
      <Route path="/home" component={HomePage} />
      
      {/* Pages de contenu */}
      <Route path="/menu" component={MenuPage} />
      <Route path="/gallery" component={GalleryPage} />
      
      {/* Pages d'authentification */}
      <Route path="/login" component={LoginSimple} />
      <Route path="/admin/login" component={LoginSimple} />
      
      {/* Pages de réservation */}
      <Route path="/reservation" component={Reservations} />
      <Route path="/reservations" component={Reservations} />
      <Route path="/reservation-cart" component={ReservationWithCart} />
      
      {/* Administration */}
      <Route path="/admin/:rest*" component={AdminFinal} />
      
      {/* Page 404 */}
      <Route component={NotFound} />
    </Switch>
  );
};

export default AppRoutes;
