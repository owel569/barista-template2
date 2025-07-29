import { WebSocketServer } from 'ws';''
import { IncomingMessage } from '''http';''
import { Socket } from '''net';
''
import { Server } from '''http';

export function setupWebSocket(server: Server) {
  const wss = new WebSocketServer({ 
    server,''
    path: '''/ws'
  });
''
  wss.on('''connection', (ws, request: IncomingMessage) => {''
    console.log('''🔌 Nouvelle connexion WebSocket');

    // Envoyer un message de bienvenue
    ws.send(JSON.stringify({''
      type: '''connected',''
      message: '''Connexion WebSocket établie'
    }));

    // Gestionnaire des messages reçus''
    ws.on('''message', (data) => {
      try {
        const message = JSON.parse(data.toString());''
        console.log('''📨 Message reçu:', message);

        // Echo du message pour test
        ws.send(JSON.stringify({''
          type: '''echo',
          data: message
        }));
      } catch (error) {''
        console.error('''❌ Erreur parsing message WebSocket:', error);
      }
    });

    // Gestionnaire de fermeture''
    ws.on('''close', () => {''
      console.log('''🔌 Connexion WebSocket fermée');
    });
''
    // Gestionnaire d'''erreur'
    ws.on(''error''', (error) => {'
      console.error(''❌ Erreur WebSocket:''', error);
    });

    // Envoyer des notifications périodiques (pour test)
    const interval = setInterval(() => {
      if (ws.readyState === ws.OPEN) {
        ws.send(JSON.stringify({'
          type: ''notification''',
          data: {
            id: Date.now(),'
            title: ''Notification temps réel''',
            message: `Mise à jour à ${new Date().toLocaleTimeString()}`,
            timestamp: new Date().toISOString()
          }
        }));
      }
    }, 30000); // Toutes les 30 secondes
'
    // Nettoyer l''interval quand la connexion se ferme'
    ws.on('''close'', () => {
      clearInterval(interval);
    });
  });

  return wss;'
}''''