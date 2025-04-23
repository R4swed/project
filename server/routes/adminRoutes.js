import express from 'express';
import { queries } from '../db/queries.js';
import bcrypt from 'bcryptjs';
import authMiddleware from '../middleware/authMiddleware.js';

const router = express.Router();

const isAdmin = (req, res, next) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Доступ запрещен' });
    }
    next();
};

router.get('/all', authMiddleware, isAdmin, async (req, res) => {
    try {
        res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
        res.setHeader('Pragma', 'no-cache');
        const tickets = await queries.getAllTickets();
        res.json(tickets);
    } catch (error) {
        console.error('Ошибка при получении всех тикетов:', error);
        res.status(500).json({ error: 'Внутренняя ошибка сервера' });
    }
});

router.get('/staff', authMiddleware, isAdmin, async (req, res) => {
    try {
        res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
        res.setHeader('Pragma', 'no-cache');
        const staff = await queries.getAllSupportStaff();
        res.json(staff);
    } catch (error) {
        console.error('Ошибка при получении списка сотрудников:', error);
        res.status(500).json({ error: 'Внутренняя ошибка сервера' });
    }
});

router.get('/analytics', authMiddleware, isAdmin, async (req, res) => {
    try {
        const { dateFrom, dateTo } = req.query;
        res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
        res.setHeader('Pragma', 'no-cache');
        const analytics = await queries.getTicketsAnalytics(dateFrom, dateTo);
        res.json(analytics);
    } catch (error) {
        console.error('Ошибка при получении аналитики:', error);
        res.status(500).json({ error: 'Внутренняя ошибка сервера' });
    }
});

router.get('/staff-analytics', authMiddleware, isAdmin, async (req, res) => {
    try {
        const { dateFrom, dateTo } = req.query;
        res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
        res.setHeader('Pragma', 'no-cache');
        const analytics = await queries.getStaffAnalytics(dateFrom, dateTo);
        res.json(analytics);
    } catch (error) {
        console.error('Ошибка при получении статистики сотрудников:', error);
        res.status(500).json({ error: 'Внутренняя ошибка сервера' });
    }
});

router.post('/add/staff', authMiddleware, isAdmin, async (req, res) => {
    try {
        const { email, password, last_name, first_name, middle_name } = req.body;
        
        if (!email || !password) {
            return res.status(400).json({ error: 'Email и пароль обязательны' });
        }

        const existingUser = await queries.getUserByEmail(email);
        if (existingUser) {
            return res.status(400).json({ error: 'Пользователь с таким email уже существует' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const newStaff = await queries.createStaff({
            email,
            password: hashedPassword,
            last_name,
            first_name,
            middle_name
        });

        res.json({ success: true, staff: newStaff });
    } catch (error) {
        console.error('Ошибка при добавлении сотрудника:', error);
        res.status(500).json({ error: 'Внутренняя ошибка сервера' });
    }
});

router.delete('/staff/:id', authMiddleware, isAdmin, async (req, res) => {
    try {
        const staffId = req.params.id;
        await queries.deleteStaff(staffId);
        res.json({ success: true });
    } catch (error) {
        console.error('Ошибка при удалении сотрудника:', error);
        res.status(500).json({ error: 'Ошибка при удалении сотрудника' });
    }
});

export default router;