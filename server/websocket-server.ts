/**
 * Serveur WebSocket professionnel et sécurisé
 * Logique métier optimisée pour la longévité du système
 */

import { WebSocketServer, WebSocket } from 'ws';
import { IncomingMessage } from 'http';
import { Server } from 'http';

// Types sécurisés pour les messages WebSocket
interface WebSocketMessage {
  type: string;
  data?: unknown;
  message?: string;
  timestamp?: string;
}

interface NotificationData {
  id: number;
  title: string;
  message: string;
  timestamp: string;
}

// Configuration sécurisée du WebSocket
export function setupWebSocket(server: Server): WebSocketServer {
  const wss = new WebSocketServer({ 
    server,
    path: '/ws'
  });

  wss.on('connection', (ws: WebSocket, request: IncomingMessage) => {
    console.log('🔌 Nouvelle connexion WebSocket');

    // Envoyer un message de bienvenue
    const welcomeMessage: WebSocketMessage = {
      type: 'connected',
      message: 'Connexion WebSocket établie',
      timestamp: new Date().toISOString()
    };
    
    ws.send(JSON.stringify(welcomeMessage));

    // Gestionnaire des messages reçus
    ws.on('message', (data: Buffer) => {
      try {
        const message: WebSocketMessage = JSON.parse(data.toString());
        console.log('📨 Message reçu:', message);

        // Validation du message
        if (!message.type) {
          ws.send(JSON.stringify({
            type: 'error',
            message: 'Type de message manquant'
          }));
          return;
        }

        // Echo du message pour test
        const echoMessage: WebSocketMessage = {
          type: 'echo',
          data: message,
          timestamp: new Date().toISOString()
        };
        
        ws.send(JSON.stringify(echoMessage));
      } catch (error) {
        console.error('❌ Erreur parsing message WebSocket:', error);
        ws.send(JSON.stringify({
          type: 'error',
          message: 'Message invalide'
        }));
      }
    });

    // Gestionnaire de fermeture
    ws.on('close', () => {
      console.log('🔌 Connexion WebSocket fermée');
    });

    // Gestionnaire d'erreur
    ws.on('error', (error: Error) => {
      console.error('❌ Erreur WebSocket:', error);
    });

    // Envoyer des notifications périodiques (pour test)
    const interval = setInterval(() => {
      if (ws.readyState === WebSocket.OPEN) {
        const notificationData: NotificationData = {
          id: Date.now(),
            title: 'Notification temps réel',
            message: `Mise à jour à ${new Date().toLocaleTimeString()}`,
            timestamp: new Date().toISOString()
        };

        const notificationMessage: WebSocketMessage = {
          type: 'notification',
          data: notificationData,
          timestamp: new Date().toISOString()
        };

        ws.send(JSON.stringify(notificationMessage));
      }
    }, 30000); // Toutes les 30 secondes

    // Nettoyer l'interval quand la connexion se ferme
    ws.on('close', () => {
      clearInterval(interval);
    });
  });

  return wss;
}