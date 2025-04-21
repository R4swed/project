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

    async getTickets(status) {
        const token = localStorage.getItem('token');
        const response = await fetch(`/api/tickets?filter=${status}`, {
            headers: { 
                'Authorization': `Bearer ${token}`,
                'Cache-Control': 'no-cache',
                'Pragma': 'no-cache'
            }
        });
        if (!response.ok) throw new Error('Ошибка получения тикетов');
        return response.json();
    },

    async getAllTickets() {
        const token = localStorage.getItem('token');
        const response = await fetch('/api/tickets/admin/all?' + new Date().getTime(), {
            headers: { 
                'Authorization': `Bearer ${token}`,
                'Cache-Control': 'no-cache',
                'Pragma': 'no-cache'
            }
        });
        if (!response.ok) throw new Error('Ошибка получения тикетов');
        return response.json();
    },
    
    async getAllStaff() {
        const token = localStorage.getItem('token');
        const response = await fetch('/api/tickets/admin/staff?' + new Date().getTime(), {
            headers: { 
                'Authorization': `Bearer ${token}`,
                'Cache-Control': 'no-cache',
                'Pragma': 'no-cache'
            }
        });
        if (!response.ok) throw new Error('Ошибка получения списка сотрудников');
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
    },

    async getAnalytics(dateFrom = null, dateTo = null) {
        const token = localStorage.getItem('token');
        let url = '/api/tickets/admin/analytics';
        
        if (dateFrom || dateTo) {
            const params = new URLSearchParams();
            if (dateFrom) params.append('dateFrom', dateFrom);
            if (dateTo) params.append('dateTo', dateTo);
            url += '?' + params.toString();
        }
        
        const response = await fetch(url + (url.includes('?') ? '&' : '?') + new Date().getTime(), {
            headers: { 
                'Authorization': `Bearer ${token}`,
                'Cache-Control': 'no-cache',
                'Pragma': 'no-cache'
            }
        });
        if (!response.ok) throw new Error('Ошибка получения аналитики');
        return response.json();
    },

    async getStaffAnalytics(dateFrom = null, dateTo = null) {
        const token = localStorage.getItem('token');
        let url = '/api/tickets/admin/staff-analytics';
        
        if (dateFrom || dateTo) {
            const params = new URLSearchParams();
            if (dateFrom) params.append('dateFrom', dateFrom);
            if (dateTo) params.append('dateTo', dateTo);
            url += '?' + params.toString();
        }
        
        const response = await fetch(url + (url.includes('?') ? '&' : '?') + new Date().getTime(), {
            headers: { 
                'Authorization': `Bearer ${token}`,
                'Cache-Control': 'no-cache',
                'Pragma': 'no-cache'
            }
        });
        if (!response.ok) throw new Error('Ошибка получения статистики сотрудников');
        return response.json();
    },

    async addStaff(staffData) {
        const token = localStorage.getItem('token');
        const response = await fetch('/api/tickets/admin/add/staff', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(staffData)
        });
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Ошибка добавления сотрудника');
        }
        return response.json();
    },

    async deleteStaff(staffId) {
        const token = localStorage.getItem('token');
        const response = await fetch(`/api/tickets/admin/staff/${staffId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Ошибка удаления сотрудника');
        }
        return response.json();
    }
};