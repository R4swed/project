import { showSection, elements } from './utils.js';
import { api } from './api.js';
import { currentTicketStatus } from './support.js';

let socket;
let currentTicketId = null;

export const initChat = () => {
    
    if (!socket && window.io) {
        socket = window.io(window.location.origin, {
            transports: ['websocket'],
            reconnectionAttempts: 3,
            timeout: 20000
        });
    
        socket.on('connect', () => {
            console.log('Connected');
        });
    
        socket.on('connect_error', () => {
            console.warn('Connection error');
        });

        socket.on('new-message', (ticketId) => {
            const currentTicketId = document.getElementById('ticketId')?.textContent;
            if (currentTicketId === ticketId) {
                loadChatMessages(ticketId);
            }
        });

        socket.on('ticket-updated', (ticketId) => {
            const currentTicketId = document.getElementById('ticketId')?.textContent;
            if (currentTicketId === ticketId) {
                loadChatMessages(ticketId);
            }
        });
    }

    const messageInput = document.getElementById('messageInput');
    if (messageInput) {
        messageInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                const submitButton = document.getElementById('messageForm')?.querySelector('button[type="submit"]');
                if (submitButton && !submitButton.disabled) {
                    submitButton.click();
                }
            }
        });
    }

    const messageForm = document.getElementById('messageForm');
    const newMessageForm = messageForm?.cloneNode(true);
    if (messageForm && newMessageForm) {
        messageForm.parentNode.replaceChild(newMessageForm, messageForm);
        
        const newMessageInput = newMessageForm.querySelector('#messageInput');
        if (newMessageInput) {
            newMessageInput.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    const submitButton = newMessageForm.querySelector('button[type="submit"]');
                    if (submitButton && !submitButton.disabled) {
                        submitButton.click();
                    }
                }
            });
        }
    }

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

const canSendMessage = (userRole, ticketStatus) => {
    if (userRole === 'client' || userRole === 'user') {
        return ticketStatus !== 'completed';
    }
    return ticketStatus === 'in_progress';
};

const loadChatMessages = async (ticketId) => {
    if (currentTicketId) {
        socket.emit('leave-ticket', currentTicketId);
    }

    currentTicketId = ticketId;
    socket.emit('join-ticket', ticketId);

    const chatMessages = document.getElementById('chatMessages');
    if (!chatMessages) return;
    
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
        const [userResponse, ticketResponse, messagesResponse, participantsResponse] = await Promise.all([
            fetch('/api/auth/me', {
                headers: { 
                    'Authorization': `Bearer ${token}`,
                    'Cache-Control': 'no-cache'
                }
            }),
            fetch(`/api/tickets/${ticketId}`, {
                headers: { 
                    'Authorization': `Bearer ${token}`,
                    'Cache-Control': 'no-cache'
                }
            }),
            fetch(`/api/chats/${ticketId}`, {
                headers: { 
                    'Authorization': `Bearer ${token}`,
                    'Cache-Control': 'no-cache'
                }
            }),
            fetch(`/api/tickets/${ticketId}/participants`, {
                headers: { 
                    'Authorization': `Bearer ${token}`,
                    'Cache-Control': 'no-cache'
                }
            })
        ]);

        if (!userResponse.ok || !ticketResponse.ok || !messagesResponse.ok || !participantsResponse.ok) {
            throw new Error('Ошибка загрузки данных чата');
        }

        const [currentUser, ticketInfo, messages, participants] = await Promise.all([
            userResponse.json(),
            ticketResponse.json(),
            messagesResponse.json(),
            participantsResponse.json()
        ]);

        const user = JSON.parse(localStorage.getItem('user') || '{}');

        const takeTicketBtn = document.getElementById('takeTicketBtn');
        const completeTicketBtn = document.getElementById('completeTicketBtn');

        if (takeTicketBtn && completeTicketBtn) {
            if (user.role === 'user' || user.role === 'client') {
                takeTicketBtn.classList.add('hidden');
                completeTicketBtn.classList.add('hidden');
            } else {
                takeTicketBtn.classList.toggle('hidden', ticketInfo.status !== 'new');
                completeTicketBtn.classList.toggle('hidden', ticketInfo.status !== 'in_progress');
            }
        }
        
        chatMessages.innerHTML = '';
        
        messages.forEach(msg => {
            const messageDiv = document.createElement('div');
            const isSent = msg.sender_id === currentUser.id;
            let senderRole = 'Собеседник';
            let messageClass = 'received';
            
            if (isSent) {
                senderRole = 'Вы';
                messageClass = 'sent';
            } else {
                if (currentUser.role === 'support') {
                    const sender = participants.find(p => p.id === msg.sender_id);
                    if (sender && sender.role === 'admin') {
                        senderRole = 'Админ';
                        messageClass = 'received admin-message';
                    }
                } else if (currentUser.role === 'admin') {
                    const sender = participants.find(p => p.id === msg.sender_id);
                    if (sender) {
                        if (sender.id === ticketInfo.user_id) {
                            senderRole = 'Клиент';
                            messageClass = 'received client-message';
                        } else if (sender.id === ticketInfo.support_id) {
                            senderRole = 'Сотрудник';
                            messageClass = 'received support-message';
                        } else if (sender.role === 'admin') {
                            senderRole = 'Админ';
                            messageClass = 'sent admin-message';
                        }
                    }
                }
            }
            
            messageDiv.className = `message ${messageClass}`;
            
            const fileMatch = msg.message.match(/\[FILE\](.*?)\[\/FILE\]/);
            if (fileMatch) {
                const fileUrl = fileMatch[1];
                const isImage = fileUrl.match(/\.(jpg|jpeg|png|gif)$/i);
                
                messageDiv.innerHTML = `
                    <div class="message-info">
                        <span class="sender-role">${senderRole}</span>
                        <span class="message-time">${new Date(msg.created_at).toLocaleString()}</span>
                    </div>
                    ${isImage 
                        ? `<img src="${fileUrl}" alt="Изображение" onclick="window.open('${fileUrl}', '_blank')">`
                        : `<video controls><source src="${fileUrl}" type="video/mp4"></video>`
                    }
                `;
            } else {
                messageDiv.innerHTML = `
                    <div class="message-info">
                        <span class="sender-role">${senderRole}</span>
                        <span class="message-time">${new Date(msg.created_at).toLocaleString()}</span>
                    </div>
                    <p>${msg.message}</p>
                `;
            }
            
            chatMessages.appendChild(messageDiv);
        });

        const messageInput = document.getElementById('messageInput');
        const submitButton = document.getElementById('messageForm')?.querySelector('button[type="submit"]');
        const attachFileBtn = document.getElementById('attachFileBtn');
        
        const canSend = canSendMessage(user.role, ticketInfo.status);
        
        if (messageInput && submitButton) {
            messageInput.disabled = !canSend;
            submitButton.disabled = !canSend;
            if (attachFileBtn) {
                attachFileBtn.disabled = !canSend;
                attachFileBtn.style.opacity = canSend ? '1' : '0.5';
                attachFileBtn.style.cursor = canSend ? 'pointer' : 'not-allowed';
            }
            
            if (canSend) {
                messageInput.placeholder = 'Введите сообщение...';
            } else if (ticketInfo.status === 'completed') {
                messageInput.placeholder = 'Заявка завершена. Отправка сообщений недоступна';
            } else if (ticketInfo.status === 'new') {
                messageInput.placeholder = (user.role === 'client' || user.role === 'user') ? 
                    'Введите сообщение...' : 
                    'Возьмите заявку в работу, чтобы начать переписку';
            } else {
                messageInput.placeholder = 'Отправка сообщений недоступна';
            }
        }
        
        chatMessages.scrollTop = chatMessages.scrollHeight;
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

    const backButton = document.getElementById('backBtn');
    if (backButton) {
        const newBackButton = backButton.cloneNode(true);
        backButton.parentNode.replaceChild(newBackButton, backButton);
        
        newBackButton.addEventListener('click', () => {
            const ticketId = document.getElementById('ticketId')?.textContent;
            if (ticketId) {
                socket.emit('leave-ticket', ticketId);
            }
            
            const user = JSON.parse(localStorage.getItem('user') || '{}');
            if (user.role === 'admin') {
                showSection(elements.adminDashboard);
                document.getElementById('showAllTickets')?.click();
            } else if (user.role === 'support') {
                showSection(elements.supportDashboard);
                window.loadSupportTickets(currentTicketStatus);
            } else {
                showSection(elements.ticketList);
                window.loadTicketList();
            }
        });
    }

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
                alert('Не удалось взять заявку в работу');
            }
        });
    }

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
                alert('Не удалось завершить заявку');
            }
        });
    }
};