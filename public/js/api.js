export const api = {
    async login(email, password) {
        const response = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });
        if (!response.ok) throw new Error('Ошибка входа');
        return response.json();
    },

    async register(email, password) {
        const response = await fetch('/api/auth/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });
        if (!response.ok) throw new Error('Пользователь уже существует');
        return response.json();
    },

    async getTickets(filter = '') {
        const token = localStorage.getItem('token');
        const response = await fetch(`/api/tickets${filter ? `?filter=${filter}` : ''}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!response.ok) throw new Error('Ошибка получения тикетов');
        return response.json();
    },

    async createTicket(ticketData) {
        const token = localStorage.getItem('token');
        const response = await fetch('/api/tickets', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(ticketData)
        });
        if (!response.ok) throw new Error('Ошибка создания тикета');
        return response.json();
    },

    async sendChatMessage(ticketId, message) {
        const token = localStorage.getItem('token');
        const response = await fetch('/api/chats', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ ticket_id: ticketId, message })
        });
        if (!response.ok) throw new Error('Ошибка отправки сообщения');
        return response.json();
    },

    async updateTicketStatus(ticketId, status) {
        const token = localStorage.getItem('token');
        const response = await fetch(`/api/tickets/${ticketId}/status`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ status })
        });
        if (!response.ok) throw new Error('Ошибка обновления статуса');
        return response.json();
    },

    async takeTicketInProgress(ticketId) {
        const token = localStorage.getItem('token');
        const response = await fetch(`/api/tickets/${ticketId}/status`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ status: 'in_progress' })
        });
        if (!response.ok) throw new Error('Ошибка обновления статуса');
        return response.json();
    },
    
    async completeTicket(ticketId) {
        const token = localStorage.getItem('token');
        const response = await fetch(`/api/tickets/${ticketId}/status`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ status: 'completed' }) // Убедимся что передаем правильный статус
        });
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Ошибка завершения тикета');
        }
        return response.json();
    },
};