import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { queries } from '../db/queries.js';

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
    const { email, password } = req.body;
    const user = await queries.getUserByEmail(email);
    if (!user || !(await bcrypt.compare(password, user.password_hash))) {
        return res.status(401).json({ error: 'Invalid credentials' });
    }
    const token = jwt.sign({ userId: user.id, email: user.email, role: user.role }, process.env.JWT_SECRET || 'your-secret-key');
    res.json({ user, token });
});

export default router;