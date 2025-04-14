import { showSection, elements, statusLocales } from './utils.js';
import { api } from './api.js';

let allTicketsCache = []; 
let staffAnalyticsCache = [];

export const showAdminDashboard = () => {
    showSection(elements.adminDashboard);
    
    // Инициализируем начальные даты
    const today = new Date();
    const monthAgo = new Date();
    monthAgo.setMonth(monthAgo.getMonth() - 1);

    const dateFromInput = document.getElementById('adminDateFromFilter');
    const dateToInput = document.getElementById('adminDateToFilter');

    if (dateFromInput && dateToInput) {
        dateFromInput.valueAsDate = monthAgo;
        dateToInput.valueAsDate = today;
    }

    // Загружаем начальные данные
    loadAnalytics(monthAgo.toISOString().split('T')[0], today.toISOString().split('T')[0]);
    loadAllTickets();

    // Добавляем обработчики для фильтров
    document.getElementById('applyAdminDateFilter')?.addEventListener('click', () => {
        const dateFrom = document.getElementById('adminDateFromFilter')?.value;
        const dateTo = document.getElementById('adminDateToFilter')?.value;
        loadAnalytics(dateFrom, dateTo);
        filterTickets(); // Применяем те же даты к фильтрации тикетов
    });

    document.getElementById('ticketSearch')?.addEventListener('input', filterTickets);
    document.getElementById('statusFilter')?.addEventListener('change', filterTickets);
    
    // Устанавливаем email администратора
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    document.getElementById('adminUserEmail').textContent = user.email;
};

const loadAllTickets = async () => {
    try {
        const tickets = await api.getAllTickets();
        allTicketsCache = tickets;
        filterTickets(); // Применяем текущие фильтры к новым данным
    } catch (error) {
        console.error('Ошибка загрузки тикетов:', error);
    }
};

const loadStaffList = async () => {
    try {
        const [staff, analytics] = await Promise.all([
            api.getAllStaff(),
            api.getStaffAnalytics()
        ]);
        
        staffAnalyticsCache = analytics;
        const container = document.getElementById('staffList');
        
        if (!staff.length) {
            container.innerHTML = '<p>Нет сотрудников поддержки</p>';
            return;
        }

        container.innerHTML = staff.map(employee => `
            <div class="staff-list-item" data-staff-id="${employee.id}" data-staff-email="${employee.email}">
                <div class="staff-info">
                    <p><strong>${employee.email}</strong></p>
                    <p class="text-sm">С нами с ${new Date(employee.created_at).toLocaleDateString()}</p>
                </div>
            </div>
        `).join('');

        container.querySelectorAll('.staff-list-item').forEach(item => {
            item.addEventListener('click', () => showStaffStats(item.dataset.staffId, item.dataset.staffEmail));
        });

        // Добавляем обработчик для закрытия модального окна
        document.querySelector('.close-modal')?.addEventListener('click', () => {
            document.getElementById('staffStatsModal').classList.add('hidden');
        });

        document.getElementById('staffStatsModal')?.addEventListener('click', (e) => {
            if (e.target === e.currentTarget) {
                e.target.classList.add('hidden');
            }
        });
    } catch (error) {
        console.error('Ошибка загрузки сотрудников:', error);
    }
};

const showStaffStats = async (staffId, staffEmail) => {
    const modal = document.getElementById('staffStatsModal');
    const currentStaffId = staffId;
    
    document.getElementById('staffEmail').textContent = staffEmail;
    
    const today = new Date();
    const monthAgo = new Date();
    monthAgo.setMonth(monthAgo.getMonth() - 1);

    const dateFromInput = document.getElementById('staffStatsFromDate');
    const dateToInput = document.getElementById('staffStatsToDate');

    if (dateFromInput && dateToInput) {
        dateFromInput.valueAsDate = monthAgo;
        dateToInput.valueAsDate = today;
    }

    const updateStats = async (dateFrom, dateTo) => {
        try {
            const analytics = await api.getStaffAnalytics(dateFrom, dateTo);
            const staffStats = analytics.find(s => s.support_id === parseInt(currentStaffId)) || {};
            
            // Обновляем все показатели
            document.getElementById('staffPeriodTickets').textContent = staffStats.total_tickets || '0';
            document.getElementById('staffTodayTickets').textContent = staffStats.today_tickets || '0';
            document.getElementById('staffInProgressTickets').textContent = staffStats.in_progress_tickets || '0';
            document.getElementById('staffCompletedTickets').textContent = staffStats.completed_tickets || '0';
            document.getElementById('staffResponseRate').textContent = `${staffStats.response_rate || 0}%`;
            
            // Форматируем среднее время ответа
            const avgTime = staffStats.avg_response_time;
            let timeDisplay = 'Нет данных';
            if (avgTime) {
                if (avgTime < 60) {
                    timeDisplay = `${avgTime} мин`;
                } else {
                    const hours = Math.floor(avgTime / 60);
                    const minutes = avgTime % 60;
                    timeDisplay = `${hours} ч ${minutes} мин`;
                }
            }
            document.getElementById('staffAvgResponse').textContent = timeDisplay;
        } catch (error) {
            console.error('Ошибка загрузки статистики:', error);
        }
    };

    document.getElementById('applyStaffStatsFilter')?.addEventListener('click', () => {
        const dateFrom = document.getElementById('staffStatsFromDate')?.value;
        const dateTo = document.getElementById('staffStatsToDate')?.value;
        updateStats(dateFrom, dateTo);
    });

    await updateStats(monthAgo.toISOString().split('T')[0], today.toISOString().split('T')[0]);
    modal.classList.remove('hidden');
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

const filterTickets = () => {
    const searchTerm = document.getElementById('ticketSearch')?.value.toLowerCase();
    const statusFilter = document.getElementById('statusFilter')?.value;
    const dateFromFilter = document.getElementById('adminDateFromFilter')?.value;
    const dateToFilter = document.getElementById('adminDateToFilter')?.value;

    const filteredTickets = allTicketsCache.filter(ticket => {
        // Поиск по теме и email
        const matchesSearch = !searchTerm || 
            ticket.subject?.toLowerCase().includes(searchTerm) ||
            ticket.user_email?.toLowerCase().includes(searchTerm) ||
            ticket.support_email?.toLowerCase().includes(searchTerm);

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

    // Добавляем обработчики кликов для тикетов
    container.querySelectorAll('.ticket-item').forEach(item => {
        item.addEventListener('click', () => {
            showSection(elements.chatContainer);
            document.querySelector('#chatContainer h2').innerHTML = 
                `Чат по заявке <span id="ticketId" class="hidden">${item.dataset.ticketId}</span>`;
            window.loadChatMessages(item.dataset.ticketId);
        });
    });
};

const loadAnalytics = async (dateFrom = null, dateTo = null) => {
    try {
        const analytics = await api.getAnalytics(dateFrom, dateTo);
        
        // Обновляем базовые показатели
        document.getElementById('todayTickets').textContent = analytics.today_tickets || '0';
        document.getElementById('responseRate').textContent = `${analytics.response_rate || 0}%`;
        
        // Обновляем статусы тикетов
        document.getElementById('newTickets').textContent = analytics.new_tickets || '0';
        document.getElementById('inProgressTickets').textContent = analytics.in_progress_tickets || '0';
        document.getElementById('completedTickets').textContent = analytics.completed_tickets || '0';
        
        // Форматируем среднее время ответа
        const avgTime = analytics.avg_response_time;
        let timeDisplay = 'Нет данных';
        
        if (avgTime) {
            if (avgTime < 60) {
                timeDisplay = `${avgTime} мин`;
            } else {
                const hours = Math.floor(avgTime / 60);
                const minutes = avgTime % 60;
                timeDisplay = `${hours} ч ${minutes} мин`;
            }
        }
        
        document.getElementById('avgResponseTime').textContent = timeDisplay;
    } catch (error) {
        console.error('Ошибка загрузки аналитики:', error);
        [
            'todayTickets', 
            'avgResponseTime', 
            'responseRate',
            'newTickets',
            'inProgressTickets',
            'completedTickets'
        ].forEach(id => {
            document.getElementById(id).textContent = '-';
        });
    }
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

export const initAdmin = () => {
    return { showAdminDashboard };
};