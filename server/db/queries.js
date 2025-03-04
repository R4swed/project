import pool from './config.js';

export const queries = {
  // Пользователи
  async createUser(email, passwordHash) {
    const query = `
      INSERT INTO users (email, password_hash)
      VALUES ($1, $2)
      RETURNING id, email, role
    `;
    const result = await pool.query(query, [email, passwordHash]);
    return result.rows[0];
  },

  async getUserByEmail(email) {
    const query = 'SELECT * FROM users WHERE email = $1';
    const result = await pool.query(query, [email]);
    return result.rows[0] || null;
  },

  // Тикеты
  async createTicket({ company, email, product, subject, description, userId }) {
    const query = `
        INSERT INTO tickets (company, email, product, subject, description, user_id, status, created_at)
        VALUES ($1, $2, $3, $4, $5, $6, 'new', CURRENT_TIMESTAMP)
        RETURNING *
    `;
    const values = [company, email, product, subject, description, userId];
    const result = await pool.query(query, values);
    return result.rows[0];
  },

  async getTicketsByUserId(userId) {
    const query = 'SELECT * FROM tickets WHERE user_id = $1 ORDER BY created_at DESC';
    const result = await pool.query(query, [userId]);
    return result.rows;
  },

  async updateTicketStatus(ticketId, status) {
    const query = `
      UPDATE tickets 
      SET status = $1, updated_at = CURRENT_TIMESTAMP
      WHERE id = $2
      RETURNING *
    `;
    const result = await pool.query(query, [status, ticketId]);
    return result.rows[0];
  },
  async getChatMessages(ticketId) {
    const query = `
        SELECT * FROM chats 
        WHERE ticket_id = $1 
        ORDER BY created_at ASC
    `;
    const result = await pool.query(query, [ticketId]);
    return result.rows;
},

async createChatMessage(ticketId, senderId, message) {
    const query = `
        INSERT INTO chats (ticket_id, sender_id, message, created_at)
        VALUES ($1, $2, $3, CURRENT_TIMESTAMP)
        RETURNING *
    `;
    const values = [ticketId, senderId, message];
    const result = await pool.query(query, values);
    return result.rows[0];
}
};