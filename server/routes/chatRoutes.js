import express from 'express';
import { queries } from '../db/queries.js';

const router = express.Router();

// Получение сообщений чата для тикета
router.get('/:ticketId', async (req, res) => {
    try {
        const { ticketId } = req.params;
        const messages = await queries.getChatMessages(ticketId);
        res.json(messages);
    } catch (error) {
        console.error('Ошибка получения сообщений:', error);
        res.status(500).json({ error: 'Внутренняя ошибка сервера' });
    }
});

// Отправка нового сообщения
router.post('/', async (req, res) => {
    try {
        const { ticket_id, message } = req.body;
        const senderId = req.user.userId; // Из authMiddleware
        if (!ticket_id || !message) {
            return res.status(400).json({ error: 'Не указан ticket_id или message' });
        }
        const newMessage = await queries.createChatMessage(ticket_id, senderId, message);
        res.json(newMessage);
    } catch (error) {
        console.error('Ошибка отправки сообщения:', error);
        res.status(500).json({ error: 'Внутренняя ошибка сервера' });
    }
});

export { router as chatRoutes };