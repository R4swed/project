import pool from './db.js';

export const queries = {
    async createUser(email, passwordHash) {
        const result = await pool.query(
            'INSERT INTO users (email, password_hash) VALUES ($1, $2) RETURNING id, email, role',
            [email, passwordHash]
        );
        return result.rows[0];
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
        const result = await pool.query(
            'SELECT id, company, email, product, subject, description, status, created_at, user_id FROM tickets WHERE user_id = $1 ORDER BY created_at DESC',
            [userId]
        );
        return result.rows;
    },

    async getAllTickets() {
        const query = `
            SELECT id, company, email, product, subject, description, 
                   status, created_at, user_id 
            FROM tickets 
            ORDER BY created_at DESC
        `;
        const result = await pool.query(query);
        console.log('Все тикеты из базы данных:', result.rows);
        return result.rows;
    },

    async updateTicketStatus(ticketId, status) {
        const result = await pool.query(
            'UPDATE tickets SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING id, status, updated_at',
            [status, ticketId]
        );
        return result.rows[0];
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
    }
};