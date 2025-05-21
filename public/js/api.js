const cache = {
    data: new Map(),
    timestamp: new Map(),
    TTL: 5 * 60 * 1000, // 5 минут
    async get(key) {
        const data = this.data.get(key);
        const timestamp = this.timestamp.get(key);
        if (data && timestamp && (Date.now() - timestamp) < this.TTL) {
            return data;
        }
        return null;
    },
    set(key, data) {
        this.data.set(key, data);
        this.timestamp.set(key, Date.now());
    },
    clear() {
        this.data.clear();
        this.timestamp.clear();
    }
};

export const api = {
    async login(email, password) {
        try {
            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json'
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
        const cacheKey = `tickets-${status}`;
        const cachedData = await cache.get(cacheKey);
        if (cachedData) return cachedData;

        const token = localStorage.getItem('token');
        const response = await fetch(`/api/tickets?filter=${status}`, {
            headers: { 
                'Authorization': `Bearer ${token}`
            }
        });
        if (!response.ok) throw new Error('Ошибка получения тикетов');
        const data = await response.json();
        cache.set(cacheKey, data);
        return data;
    },

    async getAllTickets() {
        const cacheKey = 'all-tickets';
        const cachedData = await cache.get(cacheKey);
        if (cachedData) return cachedData;

        const token = localStorage.getItem('token');
        const response = await fetch('/api/admin/all', {
            headers: { 
                'Authorization': `Bearer ${token}`
            }
        });
        if (!response.ok) throw new Error('Ошибка получения тикетов');
        const data = await response.json();
        cache.set(cacheKey, data);
        return data;
    },
    
    async getAllStaff() {
        const cacheKey = 'all-staff';
        const cachedData = await cache.get(cacheKey);
        if (cachedData) return cachedData;

        const token = localStorage.getItem('token');
        const response = await fetch('/api/admin/staff', {
            headers: { 
                'Authorization': `Bearer ${token}`
            }
        });
        if (!response.ok) throw new Error('Ошибка получения списка сотрудников');
        const data = await response.json();
        cache.set(cacheKey, data);
        return data;
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
        cache.clear(); // Инвалидируем кэш после создания тикета
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
        cache.clear(); // Инвалидируем кэш после изменения статуса
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
        cache.clear(); // Инвалидируем кэш после завершения тикета
        return response.json();
    },

    async getAnalytics(dateFrom = null, dateTo = null) {
        const cacheKey = `analytics-${dateFrom}-${dateTo}`;
        const cachedData = await cache.get(cacheKey);
        if (cachedData) return cachedData;

        const token = localStorage.getItem('token');
        let url = '/api/admin/analytics';
        
        if (dateFrom || dateTo) {
            const params = new URLSearchParams();
            if (dateFrom) params.append('dateFrom', dateFrom);
            if (dateTo) params.append('dateTo', dateTo);
            url += '?' + params.toString();
        }
        
        const response = await fetch(url, {
            headers: { 
                'Authorization': `Bearer ${token}`
            }
        });
        if (!response.ok) throw new Error('Ошибка получения аналитики');
        const data = await response.json();
        cache.set(cacheKey, data);
        return data;
    },

    async getStaffAnalytics(dateFrom = null, dateTo = null) {
        const cacheKey = `staff-analytics-${dateFrom}-${dateTo}`;
        const cachedData = await cache.get(cacheKey);
        if (cachedData) return cachedData;

        const token = localStorage.getItem('token');
        let url = '/api/admin/staff-analytics';
        
        if (dateFrom || dateTo) {
            const params = new URLSearchParams();
            if (dateFrom) params.append('dateFrom', dateFrom);
            if (dateTo) params.append('dateTo', dateTo);
            url += '?' + params.toString();
        }
        
        const response = await fetch(url, {
            headers: { 
                'Authorization': `Bearer ${token}`
            }
        });
        if (!response.ok) throw new Error('Ошибка получения статистики сотрудников');
        const data = await response.json();
        cache.set(cacheKey, data);
        return data;
    },

    async addStaff(staffData) {
        const token = localStorage.getItem('token');
        const response = await fetch('/api/admin/add/staff', {
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
        cache.clear(); // Инвалидируем кэш после добавления сотрудника
        return response.json();
    },

    async deleteStaff(staffId) {
        const token = localStorage.getItem('token');
        const response = await fetch(`/api/admin/staff/${staffId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Ошибка удаления сотрудника');
        }
        cache.clear(); // Инвалидируем кэш после удаления сотрудника
        return response.json();
    }
};