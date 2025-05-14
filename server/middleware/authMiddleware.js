
import jwt from 'jsonwebtoken';

const authMiddleware = (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ error: 'Нет токена авторизации' });
    }
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    req.user = decoded;

    if (req.baseUrl.includes('/admin') && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Доступ запрещен' });
  }

    next();
  } catch (error) {
    return res.status(401).json({ error: 'Неверный токен' });
  }
};

export default authMiddleware;