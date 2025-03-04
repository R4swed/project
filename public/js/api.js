const API_URL = 'http://localhost:3000/api';

const api = {
    // Аутентификация
    async login(email, password) {
        const response = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, password })
        });
        return await response.json();
    },

    async register(email, password) {
        try {
            console.log('Отправка запроса на регистрацию:', { email, password });
            const response = await fetch(`${API_URL}/auth/register`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email, password })
            });
            console.log('Ответ получен:', response);
            return response; // Убеждаемся, что возвращаем объект Response
        } catch (error) {
            console.error('Ошибка в fetch:', error);
            throw error; // Передаем ошибку дальше
        }
    },

    // Тикеты
    async getTickets() {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_URL}/tickets`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        return await response.json();
    },

    async createTicket(ticketData) {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_URL}/tickets`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(ticketData)
        });
        return await response.json();
    },

    async updateTicketStatus(ticketId, status) {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_URL}/tickets/${ticketId}/status`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ status })
        });
        return await response.json();
    }
};