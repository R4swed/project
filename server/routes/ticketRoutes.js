import express from 'express';
import { queries } from '../db/queries.js';
import { getIO } from '../index.js';

const router = express.Router();

router.get('/', async (req, res) => {
    try {
        res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
        res.setHeader('Pragma', 'no-cache');
        res.setHeader('Expires', '0');
        
        let tickets;
        if (req.user.role === 'support') {
            const filter = req.query.filter;
            
            if (filter === 'new') {
                tickets = await queries.getAllNewTickets();
            } else if (filter === 'completed' || filter === 'in_progress') {
                tickets = await queries.getSupportTicketsByStatus(req.user.userId, filter);
            } else {
                tickets = await queries.getSupportTickets(req.user.userId);
            }
        } else {
            tickets = await queries.getTicketsByUserId(req.user.userId);
        }
        res.json(tickets);
    } catch (error) {
        console.error('Ошибка при получении тикетов:', error);
        res.status(500).json({ error: 'Внутренняя ошибка сервера' });
    }
});

router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const ticket = await queries.getTicketById(id);
        
        if (!ticket) {
            return res.status(404).json({ error: 'Тикет не найден' });
        }
        
        res.json(ticket);
    } catch (error) {
        console.error('Ошибка при получении тикета:', error);
        res.status(500).json({ error: 'Внутренняя ошибка сервера' });
    }
});

router.post('/', async (req, res) => {
    try {
        const { company, email, product, subject, description} = req.body;
        const userId = req.user.userId;

        if (!company || !email || !subject || !description) {
            return res.status(400).json({ error: 'Все поля обязательны для заполнения' });
        }

        const ticket = await queries.createTicket({
            company,
            email,
            product,
            subject,
            description,
            userId
        });

        const fullTicket = await queries.getTicketById(ticket.id);

        const io = getIO();
        io.emit('ticket-created', fullTicket);

        res.json(fullTicket);
    } catch (error) {
        console.error('Create ticket error:', error);
        res.status(500).json({ error: 'Ошибка создания тикета' });
    }
});

router.patch('/:id/status', async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        const supportId = req.user.userId;
        
        const ticket = await queries.updateTicketStatus(id, status, supportId);
        
        const io = getIO();
        io.to(`ticket-${id}`).emit('ticket-updated', id);
        
        res.json(ticket);
    } catch (error) {
        console.error('Ошибка при обновлении статуса:', error);
        res.status(500).json({ error: 'Внутренняя ошибка сервера' });
    }
});

router.get('/:id/participants', async (req, res) => {
    try {
        const { id } = req.params;
        const ticket = await queries.getTicketById(id);
        
        if (!ticket) {
            return res.status(404).json({ error: 'Тикет не найден' });
        }

        const participants = await queries.getTicketParticipants(id);
        res.json(participants);
    } catch (error) {
        console.error('Ошибка при получении участников:', error);
        res.status(500).json({ error: 'Внутренняя ошибка сервера' });
    }
});

export default router;