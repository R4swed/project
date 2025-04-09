export const api = {
    async login(email, password) {
        try {
            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Cache-Control': 'no-cache',
                    'Pragma': 'no-cache'
                },
                body: JSON.stringify({ email, password })
            });
            
            if (!response.ok) {
                const errorData = await response.text();
                let errorMessage;
                try {
                    const jsonError = JSON.parse(errorData);
                    errorMessage = jsonError.error;
                } catch (e) {
                    errorMessage = errorData;
                }
                throw new Error(errorMessage || 'Ошибка входа');
            }
            
            const data = await response.json();
            return data;
        } catch (error) {
            console.error('API login error:', error);
            throw error;
        }
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
            body: JSON.stringify({ status: 'completed' }) 
        });
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Ошибка завершения тикета');
        }
        return response.json();
    },

    async getChatMessages(ticketId) {
        const token = localStorage.getItem('token');
        const response = await fetch(`/api/chats/${ticketId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!response.ok) throw new Error('Ошибка получения сообщений');
        return response.json();
    },

    async getTicket(ticketId) {
        const token = localStorage.getItem('token');
        const response = await fetch(`/api/tickets/${ticketId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!response.ok) throw new Error('Ошибка получения тикета');
        return response.json();
    }
};