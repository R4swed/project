import express from 'express';
import { queries } from '../db/queries.js';

const router = express.Router();

router.get('/', async (req, res) => {
    try {
        let tickets;
        if (req.user.role === 'support') {
            if (req.query.filter === 'new') {
                tickets = await queries.getAllNewTickets();
            } else if (req.query.filter === 'completed') {
                tickets = await queries.getSupportTicketsByStatus(req.user.userId, 'completed');
            } else if (req.query.filter === 'in_progress') {
                tickets = await queries.getSupportTicketsByStatus(req.user.userId, 'in_progress');
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
        const { company, email, product, subject, description } = req.body;
        const userId = req.user.userId;
        const ticket = await queries.createTicket({
            company, email, product, subject, description, userId
        });
        res.json(ticket);
    } catch (error) {
        res.status(500).json({ error: 'Ошибка создания тикета' });
    }
});

router.patch('/:id/status', async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        const supportId = req.user.userId;
        
        console.log('Updating ticket status:', { id, status, supportId }); // Добавим лог
        
        const ticket = await queries.updateTicketStatus(id, status, supportId);
        
        console.log('Updated ticket:', ticket); // Добавим лог результата
        
        res.json(ticket);
    } catch (error) {
        console.error('Ошибка при обновлении статуса:', error);
        res.status(500).json({ error: 'Внутренняя ошибка сервера' });
    }
});

export default router;