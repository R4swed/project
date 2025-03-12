document.addEventListener('DOMContentLoaded', () => {
    const elements = {
        loginForm: document.getElementById('loginForm'),
        registerForm: document.getElementById('registerForm'),
        ticketForm: document.getElementById('ticketForm'),
        ticketList: document.getElementById('ticketList'),
        chatContainer: document.getElementById('chatContainer'),
        supportDashboard: document.getElementById('supportDashboard'),
        newTickets: document.getElementById('newTickets'),
        inProgressTickets: document.getElementById('inProgressTickets'),
        completedTickets: document.getElementById('completedTickets'),
        takeTicketBtn: document.getElementById('takeTicketBtn')
    };

    const showSection = (activeSection) => {
        Object.values(elements).forEach(el => el?.classList.add('hidden'));
        activeSection?.classList.remove('hidden');
    };

    const init = () => {
        const token = localStorage.getItem('token');
        if (!token) return showSection(elements.loginForm);

        const user = JSON.parse(localStorage.getItem('user') || '{}');
        user.role === 'support' ? showSupportDashboard() : showTicketListOrForm();
    };

    const showTicketListOrForm = async () => {
        const token = localStorage.getItem('token');
        const response = await fetch('/api/tickets', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const tickets = response.ok ? await response.json() : [];
        if (tickets.length) {
            showSection(elements.ticketList);
            window.loadTicketList();
        } else {
            showSection(elements.ticketForm);
        }
    };

    const showSupportDashboard = () => {
        showSection(elements.supportDashboard);
        loadSupportTickets('new');
    };

    const loadSupportTickets = async (status) => {
        try {
            const token = localStorage.getItem('token');
            console.log('Загрузка тикетов с токеном:', token);
            
            const response = await fetch('/api/tickets', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            
            console.log('Статус ответа:', response.status);
            if (!response.ok) {
                throw new Error(`Ошибка загрузки тикетов: ${response.statusText}`);
            }
    
            const tickets = await response.json();
            console.log('Полученные тикеты:', tickets);
    
            // Преобразуем 'in_progress' в 'inProgress' для соответствия HTML
            const containerId = status === 'in_progress' ? 'inProgressTickets' : `${status}Tickets`;
            const currentContainer = document.getElementById(containerId);
            console.log('Контейнер для статуса:', currentContainer);
    
            if (!currentContainer) {
                console.error(`Контейнер с id="${containerId}" не найден`);
                return; // Прерываем выполнение, если контейнер не найден
            }
    
            currentContainer.innerHTML = ''; // Очистка контейнера
    
            // Управление видимостью контейнеров
            ['new', 'in_progress', 'completed'].forEach(type => {
                const containerWrapper = document.getElementById(`${type === 'in_progress' ? 'inProgress' : type}TicketsContainer`);
                const ticketList = document.getElementById(`${type === 'in_progress' ? 'inProgress' : type}Tickets`);
                if (containerWrapper && ticketList) {
                    if (type === status) {
                        containerWrapper.classList.remove('hidden');
                        ticketList.classList.remove('hidden');
                        containerWrapper.style.display = 'block';
                        ticketList.style.display = 'block';
                    } else {
                        containerWrapper.classList.add('hidden');
                        ticketList.classList.add('hidden');
                        containerWrapper.style.display = 'none';
                        ticketList.style.display = 'none';
                    }
                }
            });
    
            const filteredTickets = tickets.filter(ticket => ticket.status === status);
            console.log(`Тикеты для статуса ${status}:`, filteredTickets);
    
            if (filteredTickets.length > 0) {
                filteredTickets.forEach(ticket => {
                    const ticketElement = document.createElement('div');
                    ticketElement.className = 'ticket-item';
                    ticketElement.setAttribute('data-ticket-id', ticket.id);
                    ticketElement.innerHTML = `
                        <p><strong>Тема:</strong> ${ticket.subject || 'Нет темы'}</p>
                        <p><strong>Email:</strong> ${ticket.email || 'Нет email'}</p>
                        <p><strong>Статус:</strong> ${ticket.status || 'Нет статуса'}</p>
                    `;
                    ticketElement.addEventListener('click', () => {
                        document.getElementById('supportDashboard').classList.add('hidden');
                        const chatContainer = document.getElementById('chatContainer');
                        chatContainer.classList.remove('hidden');
                        document.querySelector('#chatContainer h2').innerHTML = 
                            `Чат по заявке (${ticket.subject})<span id="ticketId" class="hidden">${ticket.id}</span>`;
                            window.loadChatMessages = async (ticketId) => {
                                const token = localStorage.getItem('token');
                                const user = JSON.parse(localStorage.getItem('user') || '{}');
                                
                                const response = await fetch(`/api/chats/${ticketId}`, {
                                    headers: { 'Authorization': `Bearer ${token}` }
                                });
                                if (!response.ok) return;
                            
                                const messages = await response.json();
                                chatMessages.innerHTML = messages.map(msg => {
                                    const isSent = msg.sender_id === user.id;
                                    return `
                                        <div class="message ${isSent ? 'sent' : 'received'}">
                                            <div class="message-info">
                                                ${isSent ? 'Вы' : 'Собеседник'}
                                            </div>
                                            <p>${msg.message}</p>
                                        </div>
                                    `;
                                }).join('');
                                chatMessages.scrollTop = chatMessages.scrollHeight;
                            };
                            window.loadChatMessages(ticket.id);
                    });
                    
                    console.log('Создан элемент тикета:', ticketElement.outerHTML);
                    currentContainer.appendChild(ticketElement);
                });
            } else {
                currentContainer.innerHTML = '<p>Нет тикетов с данным статусом</p>';
            }
        } catch (error) {
            console.error('Ошибка в loadSupportTickets:', error);
        }
    };

    elements.loginForm?.querySelector('form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const [email, password] = [document.getElementById('login-email').value, document.getElementById('login-password').value];
        try {
            const response = await api.login(email, password);
            localStorage.setItem('token', response.token);
            localStorage.setItem('user', JSON.stringify(response.user));
            response.user.role === 'support' ? showSupportDashboard() : showTicketListOrForm();
        } catch {
            alert('Ошибка входа');
        }
    });

    elements.registerForm?.querySelector('form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const [email, password] = [document.getElementById('register-email').value, document.getElementById('register-password').value];
        try {
            const response = await api.register(email, password);
            localStorage.setItem('token', response.token);
            localStorage.setItem('user', JSON.stringify(response.user));
            showTicketListOrForm();
        } catch {
            alert('Ошибка регистрации');
        }
    });

    document.querySelectorAll('#logoutBtn, #ticketListLogoutBtn, #supportLogoutBtn').forEach(btn => {
        btn.addEventListener('click', () => {
            localStorage.clear();
            showSection(elements.loginForm);
        });
    });

    document.getElementById('newTicketBtn')?.addEventListener('click', () => showSection(elements.ticketForm));
    document.getElementById('filterNewTickets')?.addEventListener('click', () => loadSupportTickets('new'));
    document.getElementById('filterInProgressTickets')?.addEventListener('click', () => loadSupportTickets('in_progress'));
    document.getElementById('filterCompletedTickets')?.addEventListener('click', () => loadSupportTickets('completed'));
    document.getElementById('show-register')?.addEventListener('click', e => { e.preventDefault(); showSection(elements.registerForm); });
    document.getElementById('show-login')?.addEventListener('click', e => { e.preventDefault(); showSection(elements.loginForm); });

    init();
});