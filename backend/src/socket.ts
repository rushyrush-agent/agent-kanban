import { Server as SocketIOServer } from 'socket.io';
import type { Server as HTTPServer } from 'http';
import type { Task, Comment } from './types';

let io: SocketIOServer;

export function initSocket(httpServer: HTTPServer): SocketIOServer {
  io = new SocketIOServer(httpServer, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST']
    }
  });

  io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);

    socket.on('disconnect', () => {
      console.log('Client disconnected:', socket.id);
    });
  });

  return io;
}

export function emitTaskCreated(task: Task): void {
  io?.emit('task:created', task);
}

export function emitTaskUpdated(task: Task): void {
  io?.emit('task:updated', task);
}

export function emitTaskDeleted(taskId: number): void {
  io?.emit('task:deleted', { id: taskId });
}

export function emitCommentAdded(comment: Comment): void {
  io?.emit('comment:added', comment);
}

export { io };