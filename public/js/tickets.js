import { showSection, elements, statusLocales } from './utils.js';
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

const filterTickets = () => {
    const searchTerm = document.getElementById('clientTicketSearch')?.value.toLowerCase();
    const statusFilter = document.getElementById('clientStatusFilter')?.value;
    const dateFromFilter = document.getElementById('clientDateFromFilter')?.value;
    const dateToFilter = document.getElementById('clientDateToFilter')?.value;

    const filteredTickets = ticketsCache.filter(ticket => {
        // Поиск по теме
        const matchesSearch = !searchTerm || 
            ticket.subject?.toLowerCase().includes(searchTerm);

        // Фильтр по статусу
        const matchesStatus = statusFilter === 'all' || ticket.status === statusFilter;

        // Фильтр по датам
        const ticketDate = new Date(ticket.created_at).setHours(0, 0, 0, 0);
        const matchesDateFrom = !dateFromFilter || ticketDate >= new Date(dateFromFilter).setHours(0, 0, 0, 0);
        const matchesDateTo = !dateToFilter || ticketDate <= new Date(dateToFilter).setHours(0, 0, 0, 0);

        return matchesSearch && matchesStatus && matchesDateFrom && matchesDateTo;
    });

    displayTickets(filteredTickets);
};

const displayTickets = (tickets) => {
    const ticketsContainer = document.getElementById('ticketsContainer');
    if (!ticketsContainer) return;

    if (tickets.length === 0) {
        ticketsContainer.innerHTML = '<p>У вас пока нет тикетов</p>';
        return;
    }

    ticketsContainer.innerHTML = tickets.map(ticket => `
        <div class="ticket-item" data-ticket-id="${ticket.id}" data-subject="${ticket.subject}">
            <p><strong>Тема:</strong> ${ticket.subject || 'Без темы'}</p>
            <p><strong>Статус:</strong> ${ticket.status ? statusLocales[ticket.status] : 'Неизвестен'}</p>
            <p><strong>Создан:</strong> ${new Date(ticket.created_at).toLocaleString()}</p>
        </div>
    `).join('');

    ticketsContainer.querySelectorAll('.ticket-item').forEach(item => {
        item.addEventListener('click', () => {
            showSection(elements.chatContainer);
            document.querySelector('#chatContainer h2').innerHTML = 
                `Чат по заявке (${item.dataset.subject})<span id="ticketId" class="hidden">${item.dataset.ticketId}</span>`;
            window.loadChatMessages(item.dataset.ticketId);
        });
    });
};

export const initTickets = () => {
    document.getElementById('clientTicketSearch')?.addEventListener('input', filterTickets);
    document.getElementById('clientStatusFilter')?.addEventListener('change', filterTickets);
    document.getElementById('clientDateFromFilter')?.addEventListener('change', filterTickets);
    document.getElementById('clientDateToFilter')?.addEventListener('change', filterTickets);
    const loadTicketList = async () => {
        const ticketsContainer = document.getElementById('ticketsContainer');
        if (!ticketsContainer) return;

        const user = JSON.parse(localStorage.getItem('user') || '{}');
        try {
            const tickets = await api.getTickets();
            ticketsCache = tickets; 

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
        const fileInput = document.getElementById('ticketFileInput');
        const attachBtn = document.getElementById('ticketAttachFileBtn');
        let selectedFile = null;

        if (user.email && emailInput) emailInput.value = user.email;

        // Обработчик кнопки прикрепления файла
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
                    selectedFile = null;
                    return;
                }

                selectedFile = file;
                attachBtn.textContent = `📎 ${file.name}`;
            });
        }

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

                    // Если есть прикрепленный файл, отправляем его
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
        
                    ticketForm.reset();
                    if (user.email) emailInput.value = user.email;
                    if (attachBtn) attachBtn.textContent = '📎 Прикрепить файл';
                    selectedFile = null;
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