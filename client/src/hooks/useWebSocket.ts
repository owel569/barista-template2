import { useEffect, useRef } from 'react';
import { useToast } from '@/hooks/use-toast';

export const useWebSocket = () => {
  const { toast } = useToast();
  const ws = useRef<WebSocket | null>(null);
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 5;
  
  useEffect(() => {
    const connectWebSocket = () => {
      try {
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const wsUrl = `${protocol}//${window.location.host}/api/ws`;
        
        ws.current = new WebSocket(wsUrl);
        
        ws.current.onopen = () => {
          console.log('WebSocket connecté');
          reconnectAttempts.current = 0;
        };
        
        ws.current.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            
            switch (data.type) {
              case 'new_reservation':
                toast({
                  title: "Nouvelle réservation",
                  description: `Réservation de ${data.data.customerName}`,
                });
                break;
              case 'new_order':
                toast({
                  title: "Nouvelle commande",
                  description: `Commande de ${data.data.customerName}`,
                });
                break;
              case 'new_message':
                toast({
                  title: "Nouveau message",
                  description: `Message de ${data.data.email}`,
                });
                break;
              case 'update':
                // Actualiser les données
                window.dispatchEvent(new CustomEvent('data-update', { detail: data.data }));
                break;
            }
          } catch (error) {
            console.error('Erreur lors du parsing du message WebSocket:', error);
          }
        };
        
        ws.current.onclose = () => {
          console.log('WebSocket fermé');
          
          // Reconnexion automatique
          if (reconnectAttempts.current < maxReconnectAttempts) {
            reconnectAttempts.current++;
            setTimeout(connectWebSocket, 2000 * reconnectAttempts.current);
          }
        };
        
        ws.current.onerror = (error) => {
          console.error('Erreur WebSocket:', error);
        };
        
      } catch (error) {
        console.error('Erreur lors de la connexion WebSocket:', error);
      }
    };
    
    connectWebSocket();
    
    return () => {
      if (ws.current) {
        ws.current.close();
      }
    };
  }, [toast]);
  
  return ws.current;
};