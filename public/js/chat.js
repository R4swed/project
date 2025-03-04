document.addEventListener('DOMContentLoaded', () => {
    const chatContainer = document.getElementById('chatContainer');
    if (!chatContainer) return;

    const user = JSON.parse(localStorage.getItem('user') || '{}');

    window.loadChatMessages = async function(ticketId) {
        try {
            const response = await fetch(`/api/chats/${ticketId}`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });
            const messages = await response.json();
            const chatMessages = document.getElementById('chatMessages');
            chatMessages.innerHTML = '';
            messages.forEach(msg => {
                const p = document.createElement('p');
                p.textContent = `${msg.sender_id === user.id ? 'Вы' : 'Сотрудник'}: ${msg.message}`;
                if (msg.sender_id === user.id) p.classList.add('sent');
                chatMessages.appendChild(p);
            });
            chatMessages.scrollTop = chatMessages.scrollHeight;
        } catch (error) {
            console.error('Ошибка загрузки сообщений:', error);
        }
    };

    window.loadTicketList = async function() {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch('/api/tickets', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const tickets = await response.json();
            const ticketsContainer = document.getElementById('ticketsContainer');
            ticketsContainer.innerHTML = '';
            tickets.forEach(ticket => {
                const div = document.createElement('div');
                div.classList.add('ticket-item');
                div.innerHTML = `
                    <p><strong>Тема:</strong> ${ticket.subject}</p>
                    <p><strong>Статус:</strong> ${ticket.status}</p>
                    <p><strong>Создан:</strong> ${new Date(ticket.created_at).toLocaleString()}</p>
                `;
                div.addEventListener('click', () => {
                    document.getElementById('ticketList').classList.add('hidden');
                    chatContainer.classList.remove('hidden');
                    updateChatHeader(ticket.subject, user.email);
                    window.loadChatMessages(ticket.id);
                });
                ticketsContainer.appendChild(div);
            });
            document.getElementById('ticketListUserEmail').textContent = user.email;
            return tickets;
        } catch (error) {
            console.error('Ошибка загрузки тикетов:', error);
            return [];
        }
    };

    function updateChatHeader(subject, userEmail) {
        const h2 = document.querySelector('#chatContainer h2');
        if (h2) {
            h2.textContent = `Чат по заявке: ${subject}`;
        } else {
            console.error('Элемент h2 не найден для обновления заголовка');
        }

        const emailElement = document.getElementById('chatUserEmail');
        if (!emailElement) {
            const emailSpan = document.createElement('span');
            emailSpan.id = 'chatUserEmail';
            emailSpan.textContent = userEmail;
            const backBtn = document.getElementById('backBtn');
            backBtn.parentNode.insertBefore(emailSpan, backBtn);
        } else {
            emailElement.textContent = userEmail;
        }
    }

    const messageForm = document.getElementById('messageForm');
    if (messageForm) {
        messageForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const messageInput = document.getElementById('messageInput');
            if (!messageInput) {
                console.error('Элемент ввода сообщения не найден');
                return;
            }
            
            const message = messageInput.value.trim();
            if (!message) {
                console.log('Сообщение пустое');
                return;
            }
            
            let ticketIdElement = document.getElementById('ticketId');
            if (!ticketIdElement) {
                console.error('Элемент с ID тикета не найден');
                alert('Ошибка: ID тикета не указан. Перейдите в чат заново.');
                return;
            }

            const ticketId = ticketIdElement.textContent;
            if (!ticketId) {
                console.error('ID тикета не найден');
                alert('Ошибка: ID тикета не указан. Перейдите в чат заново.');
                return;
            }

            try {
                const token = localStorage.getItem('token');
                if (!token) {
                    console.error('Токен авторизации отсутствует');
                    alert('Необходимо авторизоваться');
                    return;
                }

                const response = await fetch('/api/chats', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({
                        ticket_id: ticketId,
                        message: message
                    })
                });

                if (!response.ok) {
                    const errorData = await response.json().catch(() => ({}));
                    console.error('Ошибка при отправке сообщения:', response.status, errorData);
                    alert(`Ошибка при отправке сообщения: ${errorData.message || response.statusText}`);
                    return;
                }

                messageInput.value = '';
                await window.loadChatMessages(ticketId);

            } catch (error) {
                console.error('Ошибка при отправке сообщения:', error);
                alert('Произошла ошибка при отправке сообщения');
            }
        });
    } else {
        console.error('Форма отправки сообщений не найдена');
    }

    document.getElementById('backBtn').addEventListener('click', () => {
        chatContainer.classList.add('hidden');
        document.getElementById('ticketList').classList.remove('hidden');
        window.loadTicketList();
    });
});