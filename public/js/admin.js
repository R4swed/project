import { showSection, elements, statusLocales } from './utils.js';
import { api } from './api.js';

export const initAdmin = () => {
    const showAdminDashboard = () => {
        showSection(elements.adminDashboard);
        
        // Показываем контейнер с тикетами по умолчанию
        document.querySelectorAll('#adminContent > div').forEach(el => el.classList.add('hidden'));
        document.getElementById('allTicketsContainer').classList.remove('hidden');
        
        // Устанавливаем активную кнопку
        document.querySelectorAll('.filter-buttons button').forEach(btn => btn.classList.remove('active'));
        document.getElementById('showAllTickets').classList.add('active');
        
        // Загружаем тикеты
        loadAllTickets();
        
        // Устанавливаем email администратора
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        document.getElementById('adminUserEmail').textContent = user.email;
    };

    const loadAllTickets = async () => {
        try {
            const tickets = await api.getAllTickets();
            const container = document.getElementById('adminTicketsList');
            
            if (!tickets.length) {
                container.innerHTML = '<p>Нет тикетов</p>';
                return;
            }

            container.innerHTML = tickets.map(ticket => `
                <div class="ticket-item" data-ticket-id="${ticket.id}" data-subject="${ticket.subject}">
                    <p><strong>Тема:</strong> ${ticket.subject || 'Без темы'}</p>
                    <p><strong>Клиент:</strong> ${ticket.user_email}</p>
                    <p><strong>Сотрудник:</strong> ${ticket.support_email || 'Не назначен'}</p>
                    <p><strong>Статус:</strong> ${ticket.status ? statusLocales[ticket.status] : 'Неизвестен'}</p>
                    <p><strong>Создан:</strong> ${new Date(ticket.created_at).toLocaleString()}</p>
                </div>
            `).join('');

            container.querySelectorAll('.ticket-item').forEach(item => {
                item.addEventListener('click', () => {
                    showSection(elements.chatContainer);
                    document.querySelector('#chatContainer h2').innerHTML = 
                        `Чат по заявке <span id="ticketId" class="hidden">${item.dataset.ticketId}</span>`;
                    window.loadChatMessages(item.dataset.ticketId);
                });
            });
        } catch (error) {
            console.error('Ошибка загрузки тикетов:', error);
        }
    };

    const loadStaffList = async () => {
        try {
            const staff = await api.getAllStaff();
            const container = document.getElementById('staffList');
            
            if (!staff.length) {
                container.innerHTML = '<p>Нет сотрудников поддержки</p>';
                return;
            }

            container.innerHTML = staff.map(employee => `
                <div class="staff-item">
                    <p><strong>Email:</strong> ${employee.email}</p>
                    <p><strong>Дата регистрации:</strong> ${new Date(employee.created_at).toLocaleString()}</p>
                </div>
            `).join('');
        } catch (error) {
            console.error('Ошибка загрузки сотрудников:', error);
        }
    };

    const loadUsersList = async () => {
        try {
            const users = await api.getAllUsers();
            const container = document.getElementById('usersList');
            
            if (!users.length) {
                container.innerHTML = '<p>Нет пользователей</p>';
                return;
            }

            container.innerHTML = users.map(user => `
                <div class="user-item">
                    <p><strong>Email:</strong> ${user.email}</p>
                    <p><strong>Роль:</strong> ${user.role}</p>
                    <p><strong>Дата регистрации:</strong> ${new Date(user.created_at).toLocaleString()}</p>
                </div>
            `).join('');
        } catch (error) {
            console.error('Ошибка загрузки пользователей:', error);
        }
    };

    const setActiveButton = (activeBtn) => {
        document.querySelectorAll('.filter-buttons button').forEach(btn => {
            btn.classList.remove('active');
        });
        activeBtn.classList.add('active');
    };
    
    // Изменим обработчики кнопок
    document.getElementById('showAllTickets')?.addEventListener('click', (e) => {
        const containers = document.querySelectorAll('#adminContent > div');
        containers.forEach(el => el.classList.add('hidden'));
        document.getElementById('allTicketsContainer').classList.remove('hidden');
        setActiveButton(e.target);
        loadAllTickets();
    });
    
    document.getElementById('showAllStaff')?.addEventListener('click', (e) => {
        const containers = document.querySelectorAll('#adminContent > div');
        containers.forEach(el => el.classList.add('hidden'));
        document.getElementById('allStaffContainer').classList.remove('hidden');
        setActiveButton(e.target);
        loadStaffList();
    });
    
    document.getElementById('showAllUsers')?.addEventListener('click', (e) => {
        const containers = document.querySelectorAll('#adminContent > div');
        containers.forEach(el => el.classList.add('hidden'));
        document.getElementById('allUsersContainer').classList.remove('hidden');
        setActiveButton(e.target);
        loadUsersList();
    });

    document.getElementById('adminLogoutBtn')?.addEventListener('click', () => {
        localStorage.clear();
        window.location.reload();
    });

    return { showAdminDashboard };
};