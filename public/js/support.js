import { showSection, elements } from './utils.js';
import { initChat } from './chat.js';
import { api } from './api.js';

export const showSupportDashboard = () => {
    showSection(elements.supportDashboard);
    loadSupportTickets('new');
};

export const loadSupportTickets = async (status) => {
    try {
        ['new', 'in_progress', 'completed'].forEach(s => {
            document.getElementById(`${s}TicketsContainer`)?.classList.add('hidden');
        });
        
        const containerId = status === 'in_progress' ? 'inProgressTickets' : `${status}Tickets`;
        const containerWrapper = document.getElementById(`${status}TicketsContainer`);
        const currentContainer = document.getElementById(containerId);
        
        if (!currentContainer || !containerWrapper) return;
        
        containerWrapper.classList.remove('hidden');
        currentContainer.innerHTML = '';

        // Получаем тикеты с правильным фильтром
        const tickets = await api.getTickets(status);
        
        if (tickets.length > 0) {
            tickets.forEach(ticket => {
                const ticketElement = createTicketElement(ticket);
                currentContainer.appendChild(ticketElement);
            });
        } else {
            currentContainer.innerHTML = '<p>Нет тикетов с данным статусом</p>';
        }
    } catch (error) {
        console.error('Ошибка в loadSupportTickets:', error);
    }
};

window.loadSupportTickets = loadSupportTickets;

const createTicketElement = (ticket) => {
    const ticketElement = document.createElement('div');
    ticketElement.className = 'ticket-item';
    ticketElement.setAttribute('data-ticket-id', ticket.id);
    ticketElement.innerHTML = `
        <p><strong>Тема:</strong> ${ticket.subject || 'Нет темы'}</p>
        <p><strong>Компания:</strong> ${ticket.company || 'Не указана'}</p>
        <p><strong>Продукт:</strong> ${ticket.product || 'Не указан'}</p>
    `;

    ticketElement.addEventListener('click', () => {
        showSection(elements.chatContainer);
        document.querySelector('#chatContainer h2').innerHTML = 
            `Чат по заявке (${ticket.subject})<span id="ticketId" class="hidden">${ticket.id}</span>`;
        
        // Показываем кнопку только для новых тикетов
        const takeTicketBtn = document.getElementById('takeTicketBtn');
        if (takeTicketBtn) {
            takeTicketBtn.classList.toggle('hidden', ticket.status !== 'new');
        }
        
        window.loadChatMessages(ticket.id);
    });

    return ticketElement;
};
export const initSupport = () => {
    document.getElementById('filterNewTickets')?.addEventListener('click', () => loadSupportTickets('new'));
    document.getElementById('filterInProgressTickets')?.addEventListener('click', () => loadSupportTickets('in_progress'));
    document.getElementById('filterCompletedTickets')?.addEventListener('click', () => loadSupportTickets('completed'));
};