import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createServer } from 'http';
import { Server } from 'socket.io';
import authRoutes from './routes/auth.js';
import messageRoutes from './routes/messages.js';
import conversationRoutes from './routes/conversations.js';
import userRoutes from './routes/users.js';
import { initDatabase } from './database/init.js';
import { authenticateToken } from './middleware/auth.js';
import recordingsRoutes from './routes/recordings.js';

dotenv.config();

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: ['http://localhost:5173', 'http://localhost:5174', 'http://127.0.0.1:5173', 'http://127.0.0.1:5174'],
    methods: ["GET", "POST", "PATCH", "PUT", "DELETE"]
  }
});

const PORT = process.env.PORT || 3001;


// Middleware
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:5174', 'http://127.0.0.1:5173', 'http://127.0.0.1:5174'],
  credentials: true,
  methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  optionsSuccessStatus: 200
}));
app.use(express.json());
// Serve avatars directory for profile images
import path from 'path';
import { fileURLToPath } from 'url';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const avatarStaticPath = path.resolve(__dirname, 'public', 'avatars');
console.log('[Backend] Serving avatars from:', avatarStaticPath);
app.use('/avatars', express.static(avatarStaticPath));
// Debug: 404 handler for avatars
app.use('/avatars/:file', (req, res) => {
  console.warn('[Backend] Avatar not found:', req.params.file);
  res.status(404).send('Avatar not found');
});
app.use('/uploads', express.static('uploads'));
app.use('/uploads', recordingsRoutes);

// Initialize database
initDatabase();

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/messages', authenticateToken, messageRoutes);
app.use('/api/conversations', authenticateToken, conversationRoutes);
app.use('/api/users', authenticateToken, userRoutes);

// Socket.io for real-time messaging
io.use((socket, next) => {
  const token = socket.handshake.auth.token;
  // Add token verification here if needed
  next();
});

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  socket.on('join-conversation', (conversationId) => {
    socket.join(`conversation-${conversationId}`);
  });

  socket.on('leave-conversation', (conversationId) => {
    socket.leave(`conversation-${conversationId}`);
  });

  socket.on('send-message', (data) => {
    // Broadcast message to conversation room
    socket.to(`conversation-${data.conversationId}`).emit('new-message', data);
  });

  socket.on('typing', (data) => {
    socket.to(`conversation-${data.conversationId}`).emit('user-typing', {
      userId: data.userId,
      isTyping: data.isTyping
    });
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Avian Backend is running!' });
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`🚀 Server also accessible on http://127.0.0.1:${PORT}`);
  console.log(`🗄️ Database initialized`);
}).on('error', (err) => {
  console.error('❌ Server failed to start:', err);
});