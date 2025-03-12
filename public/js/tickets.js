document.addEventListener('DOMContentLoaded', () => {
    const ticketForm = document.getElementById('ticketForm')?.querySelector('form');
    if (!ticketForm) return;

    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const emailInput = document.getElementById('email');
    if (user.email && emailInput) emailInput.value = user.email;

    ticketForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const ticketData = {
            company: document.getElementById('company')?.value || '',
            email: emailInput?.value || '',
            product: document.getElementById('product')?.value || '',
            subject: document.getElementById('subject')?.value || '',
            description: document.getElementById('description')?.value || ''
        };

        const response = await api.createTicket(ticketData);
        if (response.id) {
            ticketForm.reset();
            if (user.email) emailInput.value = user.email;
            document.getElementById('ticketForm').classList.add('hidden');
            const chatContainer = document.getElementById('chatContainer');
            chatContainer.classList.remove('hidden');
            
            const chatUserEmail = document.getElementById('chatUserEmail');
            if (chatUserEmail) chatUserEmail.textContent = user.email;
            
            document.querySelector('#chatContainer h2').innerHTML = 
                `Чат по заявке (${ticketData.subject})<span id="ticketId" class="hidden">${response.id}</span>`;
            
            if (typeof window.loadChatMessages === 'function') {
                window.loadChatMessages(response.id);
            }

            // Удаляем старый обработчик перед добавлением нового
            const messageForm = document.getElementById('messageForm');
            if (messageForm) {
                // Создаём новую копию формы, чтобы удалить все обработчики
                const newMessageForm = messageForm.cloneNode(true);
                messageForm.parentNode.replaceChild(newMessageForm, messageForm);
                
                // Добавляем новый обработчик
                newMessageForm.addEventListener('submit', async (event) => {
                    event.preventDefault();
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
            }
        }
    });
});