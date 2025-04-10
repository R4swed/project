import pool from './db.js';

export const queries = {
    async createUser(email, passwordHash) {
        const result = await pool.query(
            'INSERT INTO users (email, password_hash) VALUES ($1, $2) RETURNING id, email, role',
            [email, passwordHash]
        );
        return result.rows[0];
    },

    async getAllSupportStaff() {
        const query = `
            SELECT id, email, role, created_at
            FROM users 
            WHERE role = 'support'
            ORDER BY created_at DESC
        `;
        const result = await pool.query(query);
        return result.rows;
    },

    async getAllUsers() {
        const query = `
            SELECT id, email, role, created_at
            FROM users
            ORDER BY created_at DESC
        `;
        const result = await pool.query(query);
        return result.rows;
    },

    async getUserByEmail(email) {
        const result = await pool.query('SELECT id, email, password_hash, role FROM users WHERE email = $1', [email]);
        return result.rows[0] || null;
    },

    async createTicket({ company, email, product, subject, description, userId }) {
        const result = await pool.query(
            'INSERT INTO tickets (company, email, product, subject, description, user_id, status, created_at) VALUES ($1, $2, $3, $4, $5, $6, \'new\', CURRENT_TIMESTAMP) RETURNING id, company, email, product, subject, description, user_id, status, created_at',
            [company, email, product, subject, description, userId]
        );
        return result.rows[0];
    },

    async getTicketsByUserId(userId) {
        const query = `
            SELECT id, company, email, product, subject, description, 
                   status, created_at, user_id, support_id
            FROM tickets 
            WHERE user_id = $1 
            ORDER BY created_at DESC
        `;
        const result = await pool.query(query, [userId]);
        return result.rows;
    },

    async getTicketById(ticketId) {
        const query = `
            SELECT id, company, email, product, subject, description, 
                   status, created_at, user_id, support_id
            FROM tickets 
            WHERE id = $1
        `;
        const result = await pool.query(query, [ticketId]);
        return result.rows[0];
    },

    async getAllTickets() {
        const query = `
            SELECT t.*, u.email as user_email, s.email as support_email 
            FROM tickets t
            LEFT JOIN users u ON t.user_id = u.id
            LEFT JOIN users s ON t.support_id = s.id
            ORDER BY t.created_at DESC
        `;
        const result = await pool.query(query);
        return result.rows;
    },

    async getUserById(userId) {
        const result = await pool.query(
            'SELECT id, email, role FROM users WHERE id = $1',
            [userId]
        );
        return result.rows[0] || null;
    },

    async getAllNewTickets() {
        const query = `
            SELECT id, company, email, product, subject, description, 
                   status, created_at, user_id, support_id
            FROM tickets 
            WHERE status = 'new'
            ORDER BY created_at DESC
        `;
        const result = await pool.query(query);
        return result.rows;
    },

    async getSupportTickets(supportId) {
        const query = `
            SELECT id, company, email, product, subject, description, 
                   status, created_at, user_id, support_id
            FROM tickets 
            WHERE status IN ('in_progress', 'completed') 
            AND support_id = $1
            ORDER BY created_at DESC
        `;
        const result = await pool.query(query, [supportId]);
        return result.rows;
    },

    async getSupportTicketsByStatus(supportId, status) {
        const query = `
            SELECT id, company, email, product, subject, description, 
                   status, created_at, user_id, support_id
            FROM tickets 
            WHERE status = $1 
            AND support_id = $2
            ORDER BY created_at DESC
        `;
        const result = await pool.query(query, [status, supportId]);
        return result.rows;
    },
    
    async updateTicketStatus(ticketId, status, supportId) {
        try {
            const query = `
                UPDATE tickets 
                SET status = $1, 
                    support_id = $2, 
                    updated_at = CURRENT_TIMESTAMP 
                WHERE id = $3 
                RETURNING id, company, email, product, subject, description, 
                         status, created_at, user_id, support_id
            `;
            console.log('Updating ticket:', { ticketId, status, supportId }); // Добавим лог для отладки
            const result = await pool.query(query, [status, supportId, ticketId]);
            
            if (result.rows.length === 0) {
                throw new Error('Тикет не найден');
            }
            
            return result.rows[0];
        } catch (error) {
            console.error('Ошибка в updateTicketStatus:', error);
            throw error;
        }
    },

    async getChatMessages(ticketId) {
        const result = await pool.query(
            'SELECT id, ticket_id, sender_id, message, created_at FROM chats WHERE ticket_id = $1 ORDER BY created_at ASC',
            [ticketId]
        );
        return result.rows;
    },

    async createChatMessage(ticketId, senderId, message) {
        const result = await pool.query(
            'INSERT INTO chats (ticket_id, sender_id, message, created_at) VALUES ($1, $2, $3, CURRENT_TIMESTAMP) RETURNING id, ticket_id, sender_id, message, created_at',
            [ticketId, senderId, message]
        );
        return result.rows[0];
    },

    async getTicketParticipants(ticketId) {
        const query = `
            SELECT DISTINCT u.id, u.email, u.role
            FROM users u
            LEFT JOIN tickets t ON t.user_id = u.id OR t.support_id = u.id
            LEFT JOIN chats c ON c.sender_id = u.id
            WHERE t.id = $1 OR c.ticket_id = $1
        `;
        const result = await pool.query(query, [ticketId]);
        return result.rows;
    }
};