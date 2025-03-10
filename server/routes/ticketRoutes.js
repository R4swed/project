import express from 'express';
import { queries } from '../db/queries.js';

const router = express.Router();

router.get('/', async (req, res) => {
    try {
        console.log('Получение тикетов для пользователя:', req.user.userId, 'роль:', req.user.role);
        let tickets;
        
        // Если пользователь - сотрудник поддержки, получаем все тикеты
        if (req.user.role === 'support') {
            tickets = await queries.getAllTickets();
        } else {
            // Для обычных пользователей получаем только их тикеты
            tickets = await queries.getTicketsByUserId(req.user.userId);
        }
        
        console.log('Тикеты из базы данных:', tickets);
        res.json(tickets);
    } catch (error) {
        console.error('Ошибка получения тикетов:', error);
        res.status(500).json({ error: 'Внутренняя ошибка сервера' });
    }
});

router.post('/', async (req, res) => {
    try {
        const { company, email, product, subject, description } = req.body;
        const userId = req.user.userId; // Используем userId вместо id

        console.log('Создание тикета с данными:', { company, email, product, subject, description, userId }); // Логирование
        const ticket = await queries.createTicket({
            company,
            email,
            product,
            subject,
            description,
            userId
        });

        console.log('Созданный тикет:', ticket); // Логирование
        res.json(ticket);
    } catch (error) {
        console.error('Ошибка создания тикета:', error);
        res.status(500).json({ error: 'Ошибка создания тикета' });
    }
});

router.patch('/:id/status', async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        const ticket = await queries.updateTicketStatus(id, status);
        res.json(ticket);
    } catch (error) {
        console.error('Ошибка обновления статуса:', error);
        res.status(500).json({ error: 'Внутренняя ошибка сервера' });
    }
});

export default router;