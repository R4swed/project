import { showSection, elements, statusLocales, productLocales} from './utils.js';
import { api } from './api.js';

let ticketsCache = {
    new: [],
    in_progress: [],
    completed: []
};

export let currentTicketStatus = 'new';

export const showSupportDashboard = () => {
    showSection(elements.supportDashboard);
    
    const today = new Date();
    const monthAgo = new Date();
    monthAgo.setMonth(monthAgo.getMonth() - 1);

    const dateFromInput = document.getElementById('supportDateFromFilter');
    const dateToInput = document.getElementById('supportDateToFilter');

    if (dateFromInput && dateToInput) {
        dateFromInput.valueAsDate = monthAgo;
        dateToInput.valueAsDate = today;
    }

    initSupport();
    loadSupportTickets('new');
};


export const loadSupportTickets = async (status) => {
    try {
        currentTicketStatus = status;
        ['new', 'in_progress', 'completed'].forEach(s => {
            document.getElementById(`${s}TicketsContainer`)?.classList.add('hidden');
        });
        
        const containerId = status === 'in_progress' ? 'inProgressTickets' : `${status}Tickets`;
        const containerWrapper = document.getElementById(`${status}TicketsContainer`);
        const currentContainer = document.getElementById(containerId);
        
        if (!currentContainer || !containerWrapper) return;
        
        containerWrapper.classList.remove('hidden');
        
        const tickets = await api.getTickets(status);
        ticketsCache[status] = tickets;
        
        const searchTerm = document.getElementById('supportTicketSearch')?.value || '';
        const dateFrom = document.getElementById('supportDateFromFilter')?.value || '';
        const dateTo = document.getElementById('supportDateToFilter')?.value || '';

        const filteredTickets = filterTickets(tickets, {
            search: searchTerm,
            dateFrom: dateFrom,
            dateTo: dateTo
        });

        displayTickets(filteredTickets, currentContainer);
    } catch (error) {
        console.error('Ошибка в loadSupportTickets:', error);
    }
};


const filterTickets = (tickets, filters) => {    
    if (!Array.isArray(tickets)) return [];
    
    return tickets.filter(ticket => {
        const matchesSearch = !filters.search || 
            ticket.subject?.toLowerCase().includes(filters.search.toLowerCase()) ||
            ticket.email?.toLowerCase().includes(filters.search.toLowerCase()) ||
            ticket.company?.toLowerCase().includes(filters.search.toLowerCase());
        
        const ticketDate = new Date(ticket.created_at);
        ticketDate.setHours(0, 0, 0, 0);
        
        let matchesDateFrom = true;
        if (filters.dateFrom) {
            const fromDate = new Date(filters.dateFrom + 'T00:00:00');
            matchesDateFrom = ticketDate >= fromDate;
        }
        
        let matchesDateTo = true;
        if (filters.dateTo) {
            const toDate = new Date(filters.dateTo + 'T23:59:59');
            matchesDateTo = ticketDate <= toDate;
        }

        return matchesSearch && matchesDateFrom && matchesDateTo;
    });
};


const displayTickets = (tickets, container) => {
    if (!tickets.length) {
        container.innerHTML = '<p>Нет заявок с данным статусом</p>';
        return;
    }

    container.innerHTML = tickets.map(ticket => renderTicket(ticket).outerHTML).join('');

    container.querySelectorAll('.ticket-item').forEach(item => {
        item.addEventListener('click', () => {
            showSection(elements.chatContainer);
            document.querySelector('#chatContainer h2').innerHTML = 
                `Чат по заявке <span id="ticketId" class="hidden">${item.dataset.ticketId}</span>`;
            
            const takeTicketBtn = document.getElementById('takeTicketBtn');
            if (takeTicketBtn) {
                takeTicketBtn.classList.toggle('hidden', item.dataset.ticketStatus !== 'new');
            }
            
            window.loadChatMessages(item.dataset.ticketId);
        });
    });
};

const renderTicket = (ticket) => {
    const ticketElement = document.createElement('div');
    ticketElement.className = 'ticket-item';
    ticketElement.dataset.ticketId = ticket.id;
    ticketElement.dataset.ticketStatus = ticket.status;
    ticketElement.innerHTML = `
        <h3>${ticket.subject}</h3>
        <p><strong>Компания:</strong> ${ticket.company || 'Не указана'}</p>
        <p><strong>Email:</strong> ${ticket.email}</p>
        <p><strong>Продукт:</strong> ${ticket.product ? productLocales[ticket.product] : 'Не указан'}</p>
        <p><strong>Статус:</strong> ${statusLocales[ticket.status]}</p>
        <p><strong>Создан:</strong> ${new Date(ticket.created_at).toLocaleString()}</p>
    `;
    return ticketElement;
};

export const initSupport = () => {    
    ticketsCache = {
        new: [],
        in_progress: [],
        completed: []
    };

    const filters = document.querySelectorAll('#supportTicketSearch, #supportDateFromFilter, #supportDateToFilter');
    filters.forEach(filter => {
        if (filter) {
            if (filter.id === 'supportTicketSearch') {
                filter.addEventListener('input', handleFilterChange);
            } 
            else {
                filter.addEventListener('change', handleFilterChange);
            }
        }
    });

    const filterButtons = {
        new: document.getElementById('filterNewTickets'),
        in_progress: document.getElementById('filterInProgressTickets'),
        completed: document.getElementById('filterCompletedTickets')
    };

    const setActiveButton = (status) => {
        Object.values(filterButtons).forEach(btn => btn?.classList.remove('active'));
        filterButtons[status]?.classList.add('active');
    };

    if (filterButtons.new) {
        filterButtons.new.addEventListener('click', () => {
            setActiveButton('new');
            loadSupportTickets('new');
        });
    }

    if (filterButtons.in_progress) {
        filterButtons.in_progress.addEventListener('click', () => {
            setActiveButton('in_progress');
            loadSupportTickets('in_progress');
        });
    }

    if (filterButtons.completed) {
        filterButtons.completed.addEventListener('click', () => {
            setActiveButton('completed');
            loadSupportTickets('completed');
        });
    }

    setActiveButton('new');
};

const handleFilterChange = () => {    
    const currentStatus = ['new', 'in_progress', 'completed'].find(status => 
        !document.getElementById(`${status}TicketsContainer`)?.classList.contains('hidden')
    );

    if (!currentStatus) {
        console.warn('No current status found');
        return;
    }

    const searchTerm = document.getElementById('supportTicketSearch')?.value || '';
    const dateFrom = document.getElementById('supportDateFromFilter')?.value || '';
    const dateTo = document.getElementById('supportDateToFilter')?.value || '';

    const tickets = ticketsCache[currentStatus] || [];

    const filteredTickets = filterTickets(tickets, {
        search: searchTerm,
        dateFrom: dateFrom,
        dateTo: dateTo
    });

    const containerId = currentStatus === 'in_progress' ? 'inProgressTickets' : `${currentStatus}Tickets`;
    const container = document.getElementById(containerId);
    if (container) {
        displayTickets(filteredTickets, container);
    }
};

window.loadSupportTickets = loadSupportTickets;