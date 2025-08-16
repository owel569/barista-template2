import { Server as HttpServer } from 'http';
import { Server as SocketServer } from 'socket.io';

interface OrderUpdate {
  id: number;
  status: string;
  updatedAt: string;
}

let io: SocketServer;

export function initSocket(httpServer: HttpServer) {
  io = new SocketServer(httpServer, {
    cors: {
      origin: process.env.ALLOWED_ORIGINS?.split(',') || '*'
    }
  });
  return io;
}

export function emitOrderUpdate(order: OrderUpdate) {
  if (io) {
    io.emit('order-updated', {
      event: 'ORDER_CREATED',
      data: order,
      timestamp: new Date()
    });
  }
}