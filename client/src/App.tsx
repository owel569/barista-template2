import React from 'react';
import { Switch, Route, useLocation } from "wouter";
import { useState, useEffect } from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import HomeSimple from "@/pages/home-simple";

function Router() {
  return (
    <div style={{ minHeight: '100vh' }}>
      <Switch>
        <Route path="/" component={() => <HomeSimple />} />
        <Route path="/login" component={() => <div><h1>Page de Connexion</h1><p>En cours de développement</p></div>} />
        <Route path="/admin" component={() => <div><h1>Page d'Administration</h1><p>En cours de développement</p></div>} />
        <Route component={() => <div><h1>Page non trouvée</h1></div>} />
      </Switch>
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <div style={{ minHeight: '100vh', padding: '20px' }}>
        <Router />
      </div>
    </QueryClientProvider>
  );
}

export default App;