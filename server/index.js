import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import authRoutes from './routes/authRoutes.js';
import ticketRoutes from './routes/ticketRoutes.js';
import authMiddleware from './middleware/authMiddleware.js';
import { chatRoutes } from './routes/chatRoutes.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config();
const app = express();

app.use(cors({
    origin: process.env.NODE_ENV === 'development' ? 'http://localhost:3001' : undefined,
    credentials: true
}));
app.use(express.json());
app.use(express.static(join(__dirname, '../public')));

app.use('/api/auth', authRoutes);
app.use('/api/tickets', authMiddleware, ticketRoutes);
app.use('/api/chats', authMiddleware, chatRoutes);

app.get('*', (req, res) => res.sendFile(join(__dirname, '../public/index.html')));

const PORT = process.env.PORT || 3000;
if (process.env.NODE_ENV !== 'production') {
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
}

export default app;