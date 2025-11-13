/**
 * Socket.IO Server Singleton for Next.js
 * Initializes Socket.IO server once and manages game rooms
 */

import { Server as HTTPServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import { GameRoomManager } from './GameRoomManager';
import type {
  ServerToClientEvents,
  ClientToServerEvents,
  InterServerEvents,
  SocketData,
} from './events';

let io: SocketIOServer<
  ClientToServerEvents,
  ServerToClientEvents,
  InterServerEvents,
  SocketData
> | null = null;

let roomManager: GameRoomManager | null = null;

/**
 * Initialize Socket.IO server (called once)
 */
export function initSocketServer(httpServer: HTTPServer): SocketIOServer {
  if (io) {
    console.log('[Socket.IO] Server already initialized');
    return io;
  }

  console.log('[Socket.IO] Initializing server...');

  io = new SocketIOServer<
    ClientToServerEvents,
    ServerToClientEvents,
    InterServerEvents,
    SocketData
  >(httpServer, {
    cors: {
      origin: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
      methods: ['GET', 'POST'],
    },
    path: '/api/socket/io',
    addTrailingSlash: false,
  });

  // Create room manager
  roomManager = new GameRoomManager(io);

  // Setup connection handler
  io.on('connection', (socket) => {
    console.log('[Socket.IO] Client connected:', socket.id);

    // Handle join game
    socket.on('join_game', async ({ matchId, player }) => {
      console.log('[Socket.IO] Player joining game:', player.fid, 'Match:', matchId);

      // Store player data in socket
      socket.data.matchId = matchId;
      socket.data.playerFid = player.fid;
      socket.data.playerUsername = player.username;

      // Get or create room
      const room = await roomManager!.getOrCreateRoom(matchId);

      if (!room) {
        socket.emit('error', { message: 'Failed to create game room' });
        return;
      }

      // Add player to room
      room.addPlayer(player.fid, socket);
    });

    // Handle player ready
    socket.on('player_ready', ({ matchId, fid }) => {
      console.log('[Socket.IO] Player ready:', fid);

      const room = roomManager!.getRoom(matchId);
      if (room) {
        room.markPlayerReady(fid);
      }
    });

    // Handle answer submission
    socket.on('submit_answer', ({ matchId, fid, questionId, answer, clientTimestamp }) => {
      console.log('[Socket.IO] Answer from', fid, ':', answer);

      const room = roomManager!.getRoom(matchId);
      if (room) {
        room.handleAnswer(fid, answer, clientTimestamp);
      }
    });

    // Handle disconnection
    socket.on('disconnect', () => {
      console.log('[Socket.IO] Client disconnected:', socket.id);

      if (socket.data.matchId && socket.data.playerFid) {
        const room = roomManager!.getRoom(socket.data.matchId);
        if (room) {
          room.handleDisconnect(socket.data.playerFid);
        }
      }
    });

    // Handle graceful leave
    socket.on('leave_game', ({ matchId, fid }) => {
      console.log('[Socket.IO] Player leaving:', fid);

      const room = roomManager!.getRoom(matchId);
      if (room) {
        room.handleDisconnect(fid);
      }

      socket.leave(matchId);
    });
  });

  console.log('[Socket.IO] Server initialized successfully');

  return io;
}

/**
 * Get Socket.IO server instance
 */
export function getSocketServer(): SocketIOServer | null {
  return io;
}

/**
 * Get Room Manager instance
 */
export function getRoomManager(): GameRoomManager | null {
  return roomManager;
}
