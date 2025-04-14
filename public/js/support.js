import { showSection, elements } from './utils.js';
import { api } from './api.js';

let ticketsCache = {
    new: [],
    in_progress: [],
    completed: []
};

export const showSupportDashboard = () => {
    showSection(elements.supportDashboard);
    loadSupportTickets('new');
    
    // Устанавливаем email сотрудника
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    document.getElementById('supportUserEmail').textContent = user.email;

    // Инициализируем начальные даты
    const today = new Date();
    const monthAgo = new Date();
    monthAgo.setMonth(monthAgo.getMonth() - 1);

    const dateFromInput = document.getElementById('supportDateFromFilter');
    const dateToInput = document.getElementById('supportDateToFilter');

    if (dateFromInput && dateToInput) {
        dateFromInput.valueAsDate = monthAgo;
        dateToInput.valueAsDate = today;
    }

    // Добавляем обработчики для фильтров
    document.getElementById('supportTicketSearch')?.addEventListener('input', filterTickets);
    document.getElementById('supportDateFromFilter')?.addEventListener('change', filterTickets);
    document.getElementById('supportDateToFilter')?.addEventListener('change', filterTickets);
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
        
        const tickets = await api.getTickets(status);
        ticketsCache[status] = tickets; // Сохраняем в кэш
        
        // Применяем текущие фильтры к новым данным
        const searchTerm = document.getElementById('supportTicketSearch')?.value.toLowerCase();
        const dateFromFilter = document.getElementById('supportDateFromFilter')?.value;
        const dateToFilter = document.getElementById('supportDateToFilter')?.value;

        if (searchTerm || dateFromFilter || dateToFilter) {
            const filteredTickets = tickets.filter(ticket => {
                // Поиск по теме и email
                const matchesSearch = !searchTerm || 
                    ticket.subject?.toLowerCase().includes(searchTerm) ||
                    ticket.email?.toLowerCase().includes(searchTerm) ||
                    ticket.company?.toLowerCase().includes(searchTerm);

                // Фильтр по датам
                const ticketDate = new Date(ticket.created_at).setHours(0, 0, 0, 0);
                const matchesDateFrom = !dateFromFilter || ticketDate >= new Date(dateFromFilter).setHours(0, 0, 0, 0);
                const matchesDateTo = !dateToFilter || ticketDate <= new Date(dateToFilter).setHours(0, 0, 0, 0);

                return matchesSearch && matchesDateFrom && matchesDateTo;
            });
            displayTickets(filteredTickets, currentContainer);
        } else {
            displayTickets(tickets, currentContainer);
        }
    } catch (error) {
        console.error('Ошибка в loadSupportTickets:', error);
    }
};

const displayTickets = (tickets, container) => {
    if (!tickets.length) {
        container.innerHTML = '<p>Нет тикетов с данным статусом</p>';
        return;
    }

    container.innerHTML = tickets.map(ticket => `
        <div class="ticket-item" data-ticket-id="${ticket.id}" data-ticket-status="${ticket.status}">
            <p><strong>Тема:</strong> ${ticket.subject || 'Нет темы'}</p>
            <p><strong>Компания:</strong> ${ticket.company || 'Не указана'}</p>
            <p><strong>Email:</strong> ${ticket.email}</p>
            <p><strong>Продукт:</strong> ${ticket.product || 'Не указан'}</p>
            <p><strong>Создан:</strong> ${new Date(ticket.created_at).toLocaleString()}</p>
        </div>
    `).join('');

    container.querySelectorAll('.ticket-item').forEach(item => {
        item.addEventListener('click', () => {
            showSection(elements.chatContainer);
            document.querySelector('#chatContainer h2').innerHTML = 
                `Чат по заявке <span id="ticketId" class="hidden">${item.dataset.ticketId}</span>`;
            
            // Показываем кнопку только для новых тикетов
            const takeTicketBtn = document.getElementById('takeTicketBtn');
            if (takeTicketBtn) {
                takeTicketBtn.classList.toggle('hidden', item.dataset.ticketStatus !== 'new');
            }
            
            window.loadChatMessages(item.dataset.ticketId);
        });
    });
};

const filterTickets = () => {
    const searchTerm = document.getElementById('supportTicketSearch')?.value.toLowerCase();
    const dateFromFilter = document.getElementById('supportDateFromFilter')?.value;
    const dateToFilter = document.getElementById('supportDateToFilter')?.value;

    // Определяем текущий активный статус
    const currentStatus = ['new', 'in_progress', 'completed'].find(status => 
        !document.getElementById(`${status}TicketsContainer`).classList.contains('hidden')
    );

    if (!currentStatus) return;

    const tickets = ticketsCache[currentStatus];
    const filteredTickets = tickets.filter(ticket => {
        // Поиск по теме и email
        const matchesSearch = !searchTerm || 
            ticket.subject?.toLowerCase().includes(searchTerm) ||
            ticket.email?.toLowerCase().includes(searchTerm) ||
            ticket.company?.toLowerCase().includes(searchTerm);

        // Фильтр по датам
        const ticketDate = new Date(ticket.created_at).setHours(0, 0, 0, 0);
        const matchesDateFrom = !dateFromFilter || ticketDate >= new Date(dateFromFilter).setHours(0, 0, 0, 0);
        const matchesDateTo = !dateToFilter || ticketDate <= new Date(dateToFilter).setHours(0, 0, 0, 0);

        return matchesSearch && matchesDateFrom && matchesDateTo;
    });

    const containerId = currentStatus === 'in_progress' ? 'inProgressTickets' : `${currentStatus}Tickets`;
    const container = document.getElementById(containerId);
    if (container) {
        displayTickets(filteredTickets, container);
    }
};

export const initSupport = () => {
    document.getElementById('filterNewTickets')?.addEventListener('click', () => loadSupportTickets('new'));
    document.getElementById('filterInProgressTickets')?.addEventListener('click', () => loadSupportTickets('in_progress'));
    document.getElementById('filterCompletedTickets')?.addEventListener('click', () => loadSupportTickets('completed'));
};

window.loadSupportTickets = loadSupportTickets;