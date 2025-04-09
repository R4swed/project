import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { queries } from '../db/queries.js';
import authMiddleware from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/register', async (req, res) => {
    const { email, password } = req.body;
    const existingUser = await queries.getUserByEmail(email);
    if (existingUser) return res.status(400).json({ error: 'User exists' });

    const passwordHash = await bcrypt.hash(password, 8);
    const user = await queries.createUser(email, passwordHash);
    const token = jwt.sign({ userId: user.id, email: user.email }, process.env.JWT_SECRET || 'your-secret-key');
    res.json({ user, token });
});

router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        
        if (!email || !password) {
            return res.status(400).json({ error: 'Email и пароль обязательны' });
        }
        
        const user = await queries.getUserByEmail(email);
        
        if (!user || !(await bcrypt.compare(password, user.password_hash))) {
            return res.status(401).json({ error: 'Неверный email или пароль' });
        }
        
        const token = jwt.sign(
            { userId: user.id, email: user.email, role: user.role }, 
            process.env.JWT_SECRET || 'your-secret-key'
        );
        
        res.json({ user, token });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Ошибка сервера' });
    }
});

router.get('/me', authMiddleware, async (req, res) => {
    try {
        const user = await queries.getUserById(req.user.userId);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        res.json(user);
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

export default router;