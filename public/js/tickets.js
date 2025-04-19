import { showSection, elements, statusLocales, productLocales} from './utils.js';
import { api } from './api.js';

let ticketsCache = [];

export const showTicketListOrForm = () => {
    showSection(elements.ticketList);
    
    const today = new Date();
    const monthAgo = new Date();
    monthAgo.setMonth(monthAgo.getMonth() - 1);

    const dateFromInput = document.getElementById('clientDateFromFilter');
    const dateToInput = document.getElementById('clientDateToFilter');

    if (dateFromInput && dateToInput) {
        dateFromInput.valueAsDate = monthAgo;
        dateToInput.valueAsDate = today;
    }

    loadTicketList();
};

const filterTickets = (tickets, filters) => {
    return tickets.filter(ticket => {
        const matchesSearch = !filters.search || 
            ticket.subject.toLowerCase().includes(filters.search.toLowerCase());
        
        const matchesStatus = !filters.status || 
            filters.status === 'all' || 
            ticket.status === filters.status;
        
        const ticketDate = new Date(ticket.created_at);
        
        let matchesDateFrom = true;
        if (filters.dateFrom) {
            const fromDate = new Date(filters.dateFrom);
            fromDate.setHours(0, 0, 0, 0);
            matchesDateFrom = ticketDate >= fromDate;
        }
        
        let matchesDateTo = true;
        if (filters.dateTo) {
            const toDate = new Date(filters.dateTo);
            toDate.setHours(23, 59, 59, 999); 
            matchesDateTo = ticketDate <= toDate;
        }

        return matchesSearch && matchesStatus && 
               matchesDateFrom && matchesDateTo;
    });
};

const renderTicket = (ticket) => {
    const ticketElement = document.createElement('div');
    ticketElement.className = 'ticket-item';
    ticketElement.innerHTML = `
        <h3>${ticket.subject}</h3>
        <p><strong>Продукт:</strong> ${ticket.product ? productLocales[ticket.product] : 'Не указан'}</p>
        <p><strong>Статус:</strong> ${statusLocales[ticket.status]}</p>
        <p><strong>Дата создания:</strong> ${new Date(ticket.created_at).toLocaleString()}</p>
    `;
    ticketElement.addEventListener('click', () => {
        showSection(elements.chatContainer);
        document.querySelector('#chatContainer h2').innerHTML = 
            `Чат по заявке ${ticket.subject}<span id="ticketId" class="hidden">${ticket.id}</span>`;
        window.loadChatMessages(ticket.id);
    });
    return ticketElement;
};

export const updateTicketsList = async () => {
    try {
        const tickets = await api.getTickets();
        const container = document.getElementById('ticketsContainer');
        container.innerHTML = '';

        const search = document.getElementById('clientTicketSearch').value;
        const status = document.getElementById('clientStatusFilter').value;
        const dateFrom = document.getElementById('clientDateFromFilter').value;
        const dateTo = document.getElementById('clientDateToFilter').value;

        const filteredTickets = filterTickets(tickets, {
            search,
            status,
            dateFrom,
            dateTo
        });

        if (filteredTickets.length === 0) {
            container.innerHTML = '<p>Заявок не найдено</p>';
            return;
        }

        filteredTickets.forEach(ticket => {
            container.appendChild(renderTicket(ticket));
        });
    } catch (error) {
        console.error('Error updating tickets list:', error);
        alert('Ошибка при обновлении списка тикетов');
    }
};

export const createTicket = async (event) => {
    event.preventDefault();
    try {
        const ticketData = {
            company: document.getElementById('company').value,
            email: document.getElementById('email').value,
            product: document.getElementById('product').value,
            subject: document.getElementById('subject').value,
            description: document.getElementById('description').value
        };

        const response = await api.createTicket(ticketData);
        if (response.id) {
            const tickets = await api.getTickets();
            ticketsCache = tickets;
            
            if (ticketData.description) {
                await api.sendChatMessage(response.id, ticketData.description);
            }

            const fileInput = document.getElementById('ticketFileInput');
            const selectedFile = fileInput?.files[0];
            if (selectedFile) {
                const formData = new FormData();
                formData.append('file', selectedFile);
                formData.append('ticket_id', response.id);

                const token = localStorage.getItem('token');
                await fetch('/api/chats/upload', {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`
                    },
                    body: formData
                });
            }

            const ticketForm = document.getElementById('ticketForm')?.querySelector('form');
            ticketForm.reset();
            const emailInput = document.getElementById('email');
            const user = JSON.parse(localStorage.getItem('user') || '{}');
            if (user.email) emailInput.value = user.email;
            const attachBtn = document.getElementById('ticketAttachFileBtn');
            if (attachBtn) attachBtn.textContent = '📎 Прикрепить файл';
            showSection(elements.chatContainer);
            document.querySelector('#chatContainer h2').innerHTML = 
                `Чат по заявке (${ticketData.subject})<span id="ticketId" class="hidden">${response.id}</span>`;
            window.loadChatMessages(response.id);
        }
    } catch (error) {
        console.error('Error creating ticket:', error);
        alert('Ошибка при создании тикета');
    }
};

export const initTickets = () => {
    document.getElementById('clientTicketSearch')?.addEventListener('input', updateTicketsList);
    document.getElementById('clientStatusFilter')?.addEventListener('change', updateTicketsList);
    document.getElementById('clientDateFromFilter')?.addEventListener('change', updateTicketsList);
    document.getElementById('clientDateToFilter')?.addEventListener('change', updateTicketsList);

    const loadTicketList = async () => {
        const ticketsContainer = document.getElementById('ticketsContainer');
        if (!ticketsContainer) return;

        const user = JSON.parse(localStorage.getItem('user') || '{}');
        try {
            const tickets = await api.getTickets();
            ticketsCache = tickets; 

            updateTicketsList();

            document.getElementById('ticketListUserEmail').textContent = user.email;
        } catch (error) {
            console.error('Ошибка при загрузке тикетов:', error);
            ticketsContainer.innerHTML = '<p>Ошибка загрузки заявок</p>';
        }
    };

    window.loadTicketList = loadTicketList;

    const ticketForm = document.getElementById('ticketForm')?.querySelector('form');
    if (ticketForm) {
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        const emailInput = document.getElementById('email');
        const fileInput = document.getElementById('ticketFileInput');
        const attachBtn = document.getElementById('ticketAttachFileBtn');

        if (user.email && emailInput) emailInput.value = user.email;

        if (attachBtn && fileInput) {
            attachBtn.addEventListener('click', () => {
                fileInput.click();
            });

            fileInput.addEventListener('change', () => {
                const file = fileInput.files[0];
                if (!file) return;

                if (file.size > 10 * 1024 * 1024) {
                    alert('Файл слишком большой. Максимальный размер 10 МБ');
                    fileInput.value = '';
                    return;
                }

                attachBtn.textContent = `📎 ${file.name}`;
            });
        }

        ticketForm.addEventListener('submit', createTicket);
    }

    document.getElementById('newTicketBtn')?.addEventListener('click', () => {
        showSection(elements.ticketForm);
    });
};