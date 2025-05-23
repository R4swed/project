import express from 'express';
import { queries } from '../db/queries.js';
import multer from 'multer';
import { v2 as cloudinary } from 'cloudinary';
import { Readable } from 'stream';
import { getIO } from '../index.js';

const router = express.Router();

cloudinary.config({ 
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
    api_key: process.env.CLOUDINARY_API_KEY, 
    api_secret: process.env.CLOUDINARY_API_SECRET
});

const storage = multer.memoryStorage();
const upload = multer({
    storage: storage,
    limits: { fileSize: 10 * 1024 * 1024 }, 
    fileFilter: (req, file, cb) => {
        const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'video/mp4'];
        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Недопустимый формат файла'), false);
        }
    }
});

const uploadToCloudinary = async (buffer, options = {}) => {
    return new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
            {
                ...options,
                resource_type: "auto",
                folder: "support-chat"
            },
            (error, result) => {
                if (error) return reject(error);
                resolve(result);
            }
        );

        const bufferStream = new Readable();
        bufferStream.push(buffer);
        bufferStream.push(null);
        bufferStream.pipe(uploadStream);
    });
};


router.get('/:ticketId', async (req, res) => {
    const { ticketId } = req.params;
    const messages = await queries.getChatMessages(ticketId);
    res.json(messages);
});

router.post('/', async (req, res) => {
    const { ticket_id, message } = req.body;
    const senderId = req.user.userId;
    if (!ticket_id || !message) return res.status(400).json({ error: 'Missing ticket_id or message' });
    
    try {
        const newMessage = await queries.createChatMessage(ticket_id, senderId, message);
        
        const io = getIO();
        io.to(`ticket-${ticket_id}`).emit('new-message', ticket_id); 
        
        res.json(newMessage);
    } catch (error) {
        res.status(500).json({ error: 'Ошибка отправки сообщения' });
    }
});

router.post('/upload', upload.single('file'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'Файл не загружен' });
        }

        const result = await uploadToCloudinary(req.file.buffer);

        const { ticket_id } = req.body;
        const senderId = req.user.userId;

        const message = await queries.createChatMessage(
            ticket_id, 
            senderId, 
            `[FILE]${result.secure_url}[/FILE]`
        );

        const io = getIO();
        io.to(`ticket-${ticket_id}`).emit('new-message', ticket_id); 

        res.json({ message, fileUrl: result.secure_url });
    } catch (error) {
        console.error('Ошибка загрузки файла:', error);
        res.status(500).json({ error: 'Ошибка загрузки файла' });
    }
});

export { router as chatRoutes };