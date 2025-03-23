import { showSection, elements } from './utils.js';
import { api } from './api.js';

export const initChat = () => {
    const loadChatMessages = async (ticketId) => {
        const chatMessages = document.getElementById('chatMessages');
        if (!chatMessages) return;
        
        const token = localStorage.getItem('token');
        if (!token) return;
    
        try {
            const userResponse = await fetch('/api/auth/me', {
                headers: { 
                    'Authorization': `Bearer ${token}`,
                    'Cache-Control': 'no-cache'
                }
            });
            
            if (!userResponse.ok) throw new Error('Ошибка получения данных пользователя');
            const currentUser = await userResponse.json();
    
            const messagesResponse = await fetch(`/api/chats/${ticketId}`, {
                headers: { 
                    'Authorization': `Bearer ${token}`,
                    'Cache-Control': 'no-cache'
                }
            });
            
            if (!messagesResponse.ok) throw new Error('Ошибка получения сообщений');
            const messages = await messagesResponse.json();
            
            chatMessages.innerHTML = '';
            
            messages.forEach(msg => {
                const messageDiv = document.createElement('div');
                const isSent = msg.sender_id === currentUser.id;
                
                messageDiv.className = `message ${isSent ? 'sent' : 'received'}`;
                messageDiv.innerHTML = `
                    <div class="message-info">
                        ${isSent ? 'Вы' : 'Собеседник'}
                    </div>
                    <p>${msg.message}</p>
                `;
                chatMessages.appendChild(messageDiv);
            });
            
            chatMessages.scrollTop = chatMessages.scrollHeight;
    
            const user = JSON.parse(localStorage.getItem('user') || '{}');
            if (user.role === 'support') {
                const response = await fetch(`/api/tickets/${ticketId}?t=${Date.now()}`, {
                    headers: { 
                        'Authorization': `Bearer ${token}`,
                        'Cache-Control': 'no-cache',
                        'Pragma': 'no-cache'
                    }
                });
                
                if (!response.ok) throw new Error('Ошибка получения тикетов');
                const currentTicket = await response.json();
                
                const takeTicketBtn = document.getElementById('takeTicketBtn');
                const completeTicketBtn = document.getElementById('completeTicketBtn');
                
                if (takeTicketBtn) {
                    takeTicketBtn.classList.toggle('hidden', currentTicket.status !== 'new');
                }
                
                if (completeTicketBtn) {
                    completeTicketBtn.classList.toggle('hidden', currentTicket.status !== 'in_progress');
                }
            }
        } catch (error) {
            console.error('Ошибка загрузки чата:', error);
        }
    };

    window.loadChatMessages = loadChatMessages;

    // Обработчик формы сообщений
    const messageForm = document.getElementById('messageForm');
    if (messageForm) {
        const newMessageForm = messageForm.cloneNode(true);
        messageForm.parentNode.replaceChild(newMessageForm, messageForm);
        
        newMessageForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const messageInput = document.getElementById('messageInput');
            const message = messageInput.value.trim();
            if (!message) return;
        
            const ticketId = document.getElementById('ticketId')?.textContent;
            if (!ticketId) return;
        
            try {
                const token = localStorage.getItem('token');
                const response = await fetch('/api/chats', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({ ticket_id: ticketId, message })
                });
        
                if (response.ok) {
                    messageInput.value = '';
                    await loadChatMessages(ticketId);
                } else {
                    throw new Error('Ошибка отправки сообщения');
                }
            } catch (error) {
                alert('Не удалось отправить сообщение');
            }
        });
    }

    // Кнопка "Назад"
    const backButton = document.getElementById('backBtn');
    if (backButton) {
        const newBackButton = backButton.cloneNode(true);
        backButton.parentNode.replaceChild(newBackButton, backButton);
        
        newBackButton.addEventListener('click', () => {
            const user = JSON.parse(localStorage.getItem('user') || '{}');
            showSection(user.role === 'support' ? elements.supportDashboard : elements.ticketList);
            
            if (user.role === 'support') {
                window.loadSupportTickets('new');
            } else {
                window.loadTicketList();
            }
        });
    }

    // Кнопка "Взять в работу"
    const takeTicketBtn = document.getElementById('takeTicketBtn');
    if (takeTicketBtn) {
        const newTakeTicketBtn = takeTicketBtn.cloneNode(true);
        takeTicketBtn.parentNode.replaceChild(newTakeTicketBtn, takeTicketBtn);
        
        newTakeTicketBtn.addEventListener('click', async () => {
            const ticketId = document.getElementById('ticketId')?.textContent;
            if (!ticketId) return;

            try {
                await api.takeTicketInProgress(ticketId);
                newTakeTicketBtn.classList.add('hidden');
                const completeTicketBtn = document.getElementById('completeTicketBtn');
                if (completeTicketBtn) {
                    completeTicketBtn.classList.remove('hidden');
                }
                window.loadChatMessages(ticketId);
            } catch (error) {
                alert('Не удалось взять тикет в работу');
            }
        });
    }

    // Кнопка "Завершить тикет"
    const completeTicketBtn = document.getElementById('completeTicketBtn');
    if (completeTicketBtn) {
        const newCompleteTicketBtn = completeTicketBtn.cloneNode(true);
        completeTicketBtn.parentNode.replaceChild(newCompleteTicketBtn, completeTicketBtn);
        
        newCompleteTicketBtn.addEventListener('click', async () => {
            const ticketId = document.getElementById('ticketId')?.textContent;
            if (!ticketId) return;

            try {
                await api.completeTicket(ticketId);
                newCompleteTicketBtn.classList.add('hidden');
                window.loadChatMessages(ticketId);
            } catch (error) {
                alert('Не удалось завершить тикет');
            }
        });
    }
};