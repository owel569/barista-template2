import { WebSocketServer, WebSocket } from 'ws';
import { Server } from 'http';

export interface WebSocketMessage {
  type: 'notification' | 'update' | 'refresh';
  data: Record<string, unknown> | string | number | boolean | null;
  timestamp: string;
}

class WebSocketManager {
  private wss: WebSocketServer | null = null;
  private clients: Set<WebSocket> = new Set();

  initialize(server: Server) {
    this.wss = new WebSocketServer({ 
      server, 
      path: '/ws',
      verifyClient: (info) => {
        // Vérification simple pour l'authentification
        return true;
      }
    });

    this.wss.on('connection', (ws: WebSocket, req) => {
      console.log('📡 Nouvelle connexion WebSocket');
      this.clients.add(ws);

      // Heartbeat pour maintenir la connexion
      const heartbeat = setInterval(() => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.ping();
        }
      }, 30000);

      ws.on('message', (message: Buffer) => {
        try {
          const data = JSON.parse(message.toString());
          this.handleMessage(ws, data);
        } catch (error) {
          console.error('Erreur parsing message WebSocket:', error);
        }
      });

      ws.on('close', () => {
        console.log('📡 Connexion WebSocket fermée');
        this.clients.delete(ws);
        clearInterval(heartbeat);
      });

      ws.on('error', (error) => {
        console.error('Erreur WebSocket:', error);
        this.clients.delete(ws);
        clearInterval(heartbeat);
      });

      // Envoyer un message de bienvenue
      try {
        this.sendToClient(ws, {
          type: 'notification',
          data: { message: 'Connexion établie' },
          timestamp: new Date().toISOString()
        });
      } catch (error) {
        console.error('Erreur envoi message de bienvenue:', error);
      }
    });

    console.log('🚀 Serveur WebSocket initialisé sur /ws');
  }

  private handleMessage(ws: WebSocket, message: any) {
    // Traitement des messages entrants si nécessaire
    console.log('Message reçu:', message);
  }

  private sendToClient(ws: WebSocket, message: WebSocketMessage) {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(message));
    }
  }

  // Diffuser à tous les clients connectés
  broadcast(message: WebSocketMessage) {
    this.clients.forEach((client) => {
      this.sendToClient(client, message);
    });
  }

  // Envoyer une notification de nouvelle réservation
  notifyNewReservation(reservation: any) {
    this.broadcast({
      type: 'notification',
      data: {
        type: 'new_reservation',
        title: 'Nouvelle réservation',
        message: `Réservation pour ${reservation.customerName} le ${reservation.date}`,
        reservation
      },
      timestamp: new Date().toISOString()
    });
  }

  // Envoyer une notification de nouvelle commande
  notifyNewOrder(order: any) {
    this.broadcast({
      type: 'notification',
      data: {
        type: 'new_order',
        title: 'Nouvelle commande',
        message: `Commande #${order.id} de ${order.total}€`,
        order
      },
      timestamp: new Date().toISOString()
    });
  }

  // Envoyer une notification de nouveau message
  notifyNewMessage(message: any) {
    this.broadcast({
      type: 'notification',
      data: {
        type: 'new_message',
        title: 'Nouveau message',
        message: `Message de ${message.name}`,
        contactMessage: message
      },
      timestamp: new Date().toISOString()
    });
  }

  // Notifier les mises à jour de données
  notifyDataUpdate(type: string, data?: any) {
    this.broadcast({
      type: 'update',
      data: {
        type,
        data
      },
      timestamp: new Date().toISOString()
    });
  }

  // Forcer le rafraîchissement des statistiques
  notifyStatsRefresh() {
    this.broadcast({
      type: 'refresh',
      data: {
        type: 'stats'
      },
      timestamp: new Date().toISOString()
    });
  }
}

export const wsManager = new WebSocketManager();