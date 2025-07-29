import { Server } from 'socket.io';

let io: Server;

export function initSocket(httpServer: any) {
  io = new Server(httpServer, {
    cors: {
      origin: process.env.ALLOWED_ORIGINS?.split(',') || '*'
    }
  });
  return io;
}

export function emitOrderUpdate(order: any) {
  if (io) {
    io.emit('order-updated', {
      event: 'ORDER_CREATED',
      data: order,
      timestamp: new Date()
    });
  }
}