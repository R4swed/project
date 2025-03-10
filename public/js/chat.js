document.addEventListener('DOMContentLoaded', () => {
    const chatContainer = document.getElementById('chatContainer');
    if (!chatContainer) return;

    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const chatMessages = document.getElementById('chatMessages');

    window.loadChatMessages = async (ticketId) => {
        const token = localStorage.getItem('token');
        const response = await fetch(`/api/chats/${ticketId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!response.ok) return;

        const messages = await response.json();
        chatMessages.innerHTML = messages.map(msg =>
            `<p class="${msg.sender_id === user.id ? 'sent' : ''}">${msg.sender_id === user.id ? 'Вы' : 'Сотрудник'}: ${msg.message}</p>`
        ).join('');
        chatMessages.scrollTop = chatMessages.scrollHeight;
    };

    window.loadTicketList = async () => {
        const token = localStorage.getItem('token');
        const response = await fetch('/api/tickets', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!response.ok) return [];

        const tickets = await response.json();
        document.getElementById('ticketsContainer').innerHTML = tickets.map(ticket => `
            <div class="ticket-item" data-ticket-id="${ticket.id}" data-subject="${ticket.subject}">
                <p><strong>Тема:</strong> ${ticket.subject}</p>
                <p><strong>Статус:</strong> ${ticket.status}</p>
                <p><strong>Создан:</strong> ${new Date(ticket.created_at).toLocaleString()}</p>
            </div>
        `).join('');

        document.querySelectorAll('.ticket-item').forEach(item => {
            item.addEventListener('click', () => {
                document.getElementById('ticketList').classList.add('hidden');
                chatContainer.classList.remove('hidden');
                document.querySelector('#chatContainer h2').innerHTML = `Чат по заявке (${item.dataset.subject})<span id="ticketId" class="hidden">${item.dataset.ticketId}</span>`;
                window.loadChatMessages(item.dataset.ticketId);
            });
        });

        document.getElementById('ticketListUserEmail').textContent = user.email;
        return tickets;
    };

    document.getElementById('messageForm')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const messageInput = document.getElementById('messageInput');
        const message = messageInput.value.trim();
        if (!message) return;

        const ticketId = document.getElementById('ticketId')?.textContent;
        if (!ticketId) return;

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
            window.loadChatMessages(ticketId);
        }
    });

    document.getElementById('backBtn')?.addEventListener('click', () => {
        chatContainer.classList.add('hidden');
        document.getElementById('ticketList').classList.remove('hidden');
        window.loadTicketList();
    });
});