/**
 * Custom Next.js Server with Socket.IO
 * Run with: bun run dev
 */

import { createServer } from 'http';
import { parse } from 'url';
import next from 'next';
import { Server } from 'socket.io';
import { GameRoomManager } from './lib/socket/GameRoomManager.ts';

const dev = process.env.NODE_ENV !== 'production';
const hostname = 'localhost';
const port = parseInt(process.env.PORT || '3000', 10);

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

let roomManager;

app.prepare().then(() => {
  const httpServer = createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url, true);
      await handle(req, res, parsedUrl);
    } catch (err) {
      console.error('Error occurred handling', req.url, err);
      res.statusCode = 500;
      res.end('internal server error');
    }
  });

  // Initialize Socket.IO
  const io = new Server(httpServer, {
    cors: {
      origin: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
      methods: ['GET', 'POST'],
    },
    path: '/socket.io/',
  });

  // Create room manager
  roomManager = new GameRoomManager(io);

  // Setup connection handler
  io.on('connection', (socket) => {
    // Handle join game
    socket.on('join_game', async ({ matchId, player }) => {
      socket.data.matchId = matchId;
      socket.data.playerFid = player.fid;
      socket.data.playerUsername = player.username;

      const room = await roomManager.getOrCreateRoom(matchId);

      if (!room) {
        socket.emit('error', { message: 'Failed to create game room' });
        return;
      }

      room.addPlayer(player.fid, socket);

      // Confirm to client that join was successful
      socket.emit('join_confirmed', { matchId });
    });

    // Handle player ready
    socket.on('player_ready', async ({ matchId, fid }) => {
      // Wait for room to exist (in case join_game is still processing)
      let room = roomManager.getRoom(matchId);
      let attempts = 0;
      while (!room && attempts < 10) {
        await new Promise(resolve => setTimeout(resolve, 100));
        room = roomManager.getRoom(matchId);
        attempts++;
      }

      if (room) {
        room.markPlayerReady(fid);
      } else {
        console.error('[Socket.IO] Room not found after waiting:', matchId);
      }
    });

    // Handle answer submission
    socket.on('submit_answer', ({ matchId, fid, questionId, answer, clientTimestamp }) => {
      const room = roomManager.getRoom(matchId);
      if (room) {
        room.handleAnswer(fid, answer, clientTimestamp);
      }
    });

    // Handle disconnection
    socket.on('disconnect', () => {
      if (socket.data.matchId && socket.data.playerFid) {
        const room = roomManager.getRoom(socket.data.matchId);
        if (room) {
          room.handleDisconnect(socket.data.playerFid);
        }
      }
    });

    // Handle graceful leave
    socket.on('leave_game', ({ matchId, fid }) => {
      const room = roomManager.getRoom(matchId);
      if (room) {
        room.handleDisconnect(fid);
      }

      socket.leave(matchId);
    });
  });

  console.log('[Server] Socket.IO initialized on path: /socket.io/');

  httpServer
    .once('error', (err) => {
      console.error(err);
      process.exit(1);
    })
    .listen(port, () => {
      console.log(`> Ready on http://${hostname}:${port}`);
      console.log(`> Socket.IO ready`);
    });
});

