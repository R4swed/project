import express from 'express';
import { queries } from '../db/queries.js';

const router = express.Router();

router.get('/:ticketId', async (req, res) => {
    const { ticketId } = req.params;
    const messages = await queries.getChatMessages(ticketId);
    res.json(messages);
});

router.post('/', async (req, res) => {
    const { ticket_id, message } = req.body;
    const senderId = req.user.userId;
    if (!ticket_id || !message) return res.status(400).json({ error: 'Missing ticket_id or message' });
    const newMessage = await queries.createChatMessage(ticket_id, senderId, message);
    res.json(newMessage);
});

export { router as chatRoutes };