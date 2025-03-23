import { showSection, elements, statusLocales } from './utils.js';
import { api } from './api.js';

export const showTicketListOrForm = () => {
    showSection(elements.ticketList);
    loadTicketList();
};

export const initTickets = () => {
    const loadTicketList = async () => {
        const ticketsContainer = document.getElementById('ticketsContainer');
        if (!ticketsContainer) return;

        const user = JSON.parse(localStorage.getItem('user') || '{}');
        try {
            const tickets = await api.getTickets();
            
            if (tickets.length > 0) {
                ticketsContainer.innerHTML = tickets.map(ticket => `
                    <div class="ticket-item" data-ticket-id="${ticket.id}" data-subject="${ticket.subject}">
                        <p><strong>Тема:</strong> ${ticket.subject || 'Без темы'}</p>
                        <p><strong>Статус:</strong> ${ticket.status ? statusLocales[ticket.status] : 'Неизвестен'}</p>
                        <p><strong>Создан:</strong> ${new Date(ticket.created_at).toLocaleString()}</p>
                    </div>
                `).join('');

                document.querySelectorAll('.ticket-item').forEach(item => {
                    item.addEventListener('click', () => {
                        showSection(elements.chatContainer);
                        document.querySelector('#chatContainer h2').innerHTML = 
                            `Чат по заявке (${item.dataset.subject})<span id="ticketId" class="hidden">${item.dataset.ticketId}</span>`;
                        window.loadChatMessages(item.dataset.ticketId);
                    });
                });
            } else {
                ticketsContainer.innerHTML = '<p>У вас пока нет тикетов</p>';
            }

            document.getElementById('ticketListUserEmail').textContent = user.email;
        } catch (error) {
            console.error('Ошибка при загрузке тикетов:', error);
            ticketsContainer.innerHTML = '<p>Ошибка загрузки тикетов</p>';
        }
    };

    window.loadTicketList = loadTicketList;

    const ticketForm = document.getElementById('ticketForm')?.querySelector('form');
    if (ticketForm) {
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
        
            try {
                const response = await api.createTicket(ticketData);
                if (response.id) {
                    // Отправляем описание в чат как первое сообщение
                    if (ticketData.description) {
                        await api.sendChatMessage(response.id, ticketData.description);
                    }
        
                    ticketForm.reset();
                    if (user.email) emailInput.value = user.email;
                    showSection(elements.chatContainer);
                    document.querySelector('#chatContainer h2').innerHTML = 
                        `Чат по заявке (${ticketData.subject})<span id="ticketId" class="hidden">${response.id}</span>`;
                    window.loadChatMessages(response.id);
                }
            } catch {
                alert('Не удалось создать тикет');
            }
        });
    }

    document.getElementById('newTicketBtn')?.addEventListener('click', () => {
        showSection(elements.ticketForm);
    });
};