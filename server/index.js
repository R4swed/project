
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { createServer } from 'http';
import { Server } from 'socket.io';
import authRoutes from './routes/authRoutes.js';
import ticketRoutes from './routes/ticketRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import authMiddleware from './middleware/authMiddleware.js';
import { chatRoutes } from './routes/chatRoutes.js';

dotenv.config();
const app = express();
const httpServer = createServer(app);

app.use(cors());
app.use(express.json());
app.use(express.static(join(dirname(fileURLToPath(import.meta.url)), '../public')));

app.use('/api/auth', authRoutes);
app.use('/api/tickets', authMiddleware, ticketRoutes);
app.use('/api/chats', authMiddleware, chatRoutes);
app.use('/api/admin', authMiddleware, adminRoutes);

const io = new Server(httpServer, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

io.on('connection', socket => {
    console.log('Client connected:', socket.id);
    socket.on('join-ticket', (ticketId) => socket.join(`ticket-${ticketId}`));
    socket.on('leave-ticket', (ticketId) => socket.leave(`ticket-${ticketId}`));
});

export const getIO = () => io;

const PORT = process.env.PORT || 3000;
httpServer.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});