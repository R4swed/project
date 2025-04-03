import { showSection, elements } from './utils.js';
import { api } from './api.js';

export const initChat = () => {
    // Обработчик формы сообщений
    const messageForm = document.getElementById('messageForm');
    const newMessageForm = messageForm?.cloneNode(true);
    if (messageForm && newMessageForm) {
        messageForm.parentNode.replaceChild(newMessageForm, messageForm);
    }

    const updateFormState = (status) => {
        const messageInput = document.getElementById('messageInput');
        const submitButton = document.getElementById('messageForm')?.querySelector('button[type="submit"]');
        const isDisabled = status === 'new' || status === 'completed';
        
        if (messageInput && submitButton) {
            messageInput.disabled = isDisabled;
            submitButton.disabled = isDisabled;
            
            messageInput.placeholder = isDisabled ? 
                (status === 'new' ? 'Возьмите тикет в работу, чтобы начать переписку' : 'Тикет завершён') : 
                'Введите сообщение...';
        }
    };

    const attachFileBtn = document.getElementById('attachFileBtn');
const fileInput = document.getElementById('fileInput');

if (attachFileBtn && fileInput) {
    attachFileBtn.addEventListener('click', () => {
        fileInput.click();
    });

    fileInput.addEventListener('change', async () => {
        const file = fileInput.files[0];
        if (!file) return;

        if (file.size > 10 * 1024 * 1024) {
            alert('Файл слишком большой. Максимальный размер 10 МБ');
            return;
        }

        const ticketId = document.getElementById('ticketId')?.textContent;
        if (!ticketId) return;

        const formData = new FormData();
        formData.append('file', file);
        formData.append('ticket_id', ticketId);

        try {
            const token = localStorage.getItem('token');
            const response = await fetch('/api/chats/upload', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                body: formData
            });

            if (!response.ok) throw new Error('Ошибка загрузки файла');
            
            await loadChatMessages(ticketId);
            fileInput.value = '';
        } catch (error) {
            alert('Не удалось загрузить файл');
        }
    });
}


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
                
                const fileMatch = msg.message.match(/\[FILE\](.*?)\[\/FILE\]/);
                if (fileMatch) {
                    const fileUrl = fileMatch[1];
                    const isImage = fileUrl.match(/\.(jpg|jpeg|png|gif)$/i);
                    
                    messageDiv.innerHTML = `
                        <div class="message-info">
                            ${isSent ? 'Вы' : 'Собеседник'}
                        </div>
                        ${isImage 
                            ? `<img src="${fileUrl}" alt="Изображение" onclick="window.open('${fileUrl}', '_blank')">`
                            : `<video controls><source src="${fileUrl}" type="video/mp4"></video>`
                        }
                    `;
                } else {
                    messageDiv.innerHTML = `
                        <div class="message-info">
                            ${isSent ? 'Вы' : 'Собеседник'}
                        </div>
                        <p>${msg.message}</p>
                    `;
                }
                
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

        updateFormState(currentTicket.status);
    } else {
        // Для клиента форма всегда активна
        const messageInput = document.getElementById('messageInput');
        const submitButton = document.getElementById('messageForm')?.querySelector('button[type="submit"]');
        
        if (messageInput && submitButton) {
            messageInput.disabled = false;
            submitButton.disabled = false;
            messageInput.placeholder = 'Введите сообщение...';
        }
    }
        } catch (error) {
            console.error('Ошибка загрузки чата:', error);
        }
    };

    window.loadChatMessages = loadChatMessages;

    if (newMessageForm) {
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