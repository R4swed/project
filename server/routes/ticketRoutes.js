import express from 'express';
import { queries } from '../db/queries.js';

const router = express.Router();

// Получение всех тикетов пользователя
router.get('/', async (req, res) => {
  try {
    const tickets = await queries.getTicketsByUserId(req.user.userId);
    res.json(tickets);
  } catch (error) {
    console.error('Ошибка получения тикетов:', error);
    res.status(500).json({ error: 'Внутренняя ошибка сервера' });
  }
});

// Создание нового тикета
router.post('/', async (req, res) => {
  try {
      const { company, email, product, subject, description } = req.body;
      const userId = req.user.userId; // Используем userId вместо id

      const ticket = await queries.createTicket({
          company,
          email,
          product,
          subject,
          description,
          userId
      });

      res.json(ticket);
  } catch (error) {
      console.error('Ошибка создания тикета:', error);
      res.status(500).json({ error: 'Ошибка создания тикета' });
  }
});

// Обновление статуса тикета
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