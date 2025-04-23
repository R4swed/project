import { showSection, elements, statusLocales, productLocales} from './utils.js';
import { api } from './api.js';

let allTicketsCache = []; 
let staffAnalyticsCache = [];

export const showAdminDashboard = () => {
    showSection(elements.adminDashboard);
    
    const today = new Date();
    const monthAgo = new Date();
    monthAgo.setMonth(monthAgo.getMonth() - 1);

    const dateFromInput = document.getElementById('adminDateFromFilter');
    const dateToInput = document.getElementById('adminDateToFilter');

    if (dateFromInput && dateToInput) {
        dateFromInput.valueAsDate = monthAgo;
        dateToInput.valueAsDate = today;
    }

    loadAnalytics(monthAgo.toISOString().split('T')[0], today.toISOString().split('T')[0]);
    loadAllTickets();

    const allTicketsBtn = document.getElementById('showAllTickets');
    if (allTicketsBtn) {
        setActiveButton(allTicketsBtn);
    }

    document.getElementById('adminDateFromFilter')?.addEventListener('change', updateDataByDate);
    document.getElementById('adminDateToFilter')?.addEventListener('change', updateDataByDate);
    document.getElementById('ticketSearch')?.addEventListener('input', filterTickets);
    document.getElementById('statusFilter')?.addEventListener('change', filterTickets);
    document.getElementById('productFilter')?.addEventListener('change', filterTickets);

    
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    document.getElementById('adminUserEmail').textContent = user.email;
};

const loadAllTickets = async () => {
    try {
        const tickets = await api.getAllTickets();
        allTicketsCache = tickets;
        filterTickets(); 
    } catch (error) {
        console.error('Ошибка загрузки тикетов:', error);
    }
};

const updateDataByDate = () => {
    const dateFrom = document.getElementById('adminDateFromFilter')?.value;
    const dateTo = document.getElementById('adminDateToFilter')?.value;
    
    if (dateFrom && dateTo && new Date(dateFrom) <= new Date(dateTo)) {
        loadAnalytics(dateFrom, dateTo);
        filterTickets();
        if (document.getElementById('statisticsContainer')?.classList.contains('hidden') === false) {
            loadStatistics();
        }
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

        const filterStaff = (searchTerm = '') => {
            return staff.filter(employee => 
                !searchTerm || 
                employee.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                employee.last_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                employee.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                employee.middle_name?.toLowerCase().includes(searchTerm.toLowerCase())
            );
        };

        const renderStaffList = (filteredStaff, sortBy = 'response_time') => {
            const sortedStaff = filteredStaff.map(employee => {
                const stats = analytics.find(a => a.support_id === employee.id) || {};
                return {
                    ...employee,
                    stats: {
                        avgResponseTime: stats.avg_response_time || Infinity,
                        completedTickets: stats.completed_tickets || 0
                    }
                };
            }).sort((a, b) => {
                if (sortBy === 'response_time') {
                    if (a.stats.avgResponseTime === Infinity) return 1;
                    if (b.stats.avgResponseTime === Infinity) return -1;
                    return a.stats.avgResponseTime - b.stats.avgResponseTime;
                } else {
                    return b.stats.completedTickets - a.stats.completedTickets;
                }
            });

            const content = document.getElementById('staffListContent');
            if (!content) return;

            if (!sortedStaff.length) {
                content.innerHTML = '<p>Сотрудники не найдены</p>';
                return;
            }

            content.innerHTML = sortedStaff.map((employee, index) => {
                const responseTime = employee.stats.avgResponseTime === Infinity ? 
                    'Нет данных' : 
                    employee.stats.avgResponseTime < 60 ?
                        `${employee.stats.avgResponseTime} мин` :
                        `${Math.floor(employee.stats.avgResponseTime/60)} ч ${employee.stats.avgResponseTime%60} мин`;
            
                const fullName = [
                    employee.last_name || '',
                    employee.first_name || '',
                    employee.middle_name || ''
                ].filter(Boolean).join(' ') || 'Не указано';
            
                return `
                    <div class="staff-list-item" data-staff-id="${employee.id}" data-staff-email="${employee.email}">
                        <div class="staff-rank">#${index + 1}</div>
                        <div class="staff-info">
                            <p><strong>${fullName}</strong></p>
                            <p class="text-sm">${employee.email}</p>
                            <p class="text-sm">С нами с ${new Date(employee.created_at).toLocaleDateString()}</p>
                            <div class="staff-metrics">
                                <span class="metric">
                                    <i class="fas fa-clock"></i>
                                    Среднее время ответа: ${responseTime}
                                </span>
                                <span class="metric">
                                    <i class="fas fa-check-circle"></i>
                                    Закрытых заявок: ${employee.stats.completedTickets}
                                </span>
                            </div>
                            <div class="staff-actions">
                                <button class="delete-staff-btn danger-button" data-staff-id="${employee.id}">
                                    Удалить сотрудника
                                </button>
                            </div>
                        </div>
                    </div>
                `;
            }).join('');

            content.querySelectorAll('.staff-list-item').forEach(item => {
                item.addEventListener('click', () => showStaffStats(item.dataset.staffId, item.dataset.staffEmail));
            });

            content.querySelectorAll('.delete-staff-btn').forEach(btn => {
                btn.addEventListener('click', async (e) => {
                    e.stopPropagation(); 
                    
                    if (confirm('Вы действительно хотите удалить этого сотрудника?')) {
                        try {
                            const staffId = btn.dataset.staffId;
                            await api.deleteStaff(staffId);
                            await loadStaffList(); 
                            alert('Сотрудник успешно удален');
                        } catch (error) {
                            alert(error.message || 'Ошибка при удалении сотрудника');
                        }
                    }
                });
            });
        };

        container.innerHTML = `<div id="staffListContent"></div>`;

        const sortSelect = document.getElementById('staffSortSelect');
        const searchInput = document.getElementById('staffSearch');

        if (searchInput) {
            searchInput.addEventListener('input', () => {
                const filteredStaff = filterStaff(searchInput.value);
                renderStaffList(filteredStaff, sortSelect?.value || 'response_time');
            });
        }

        if (sortSelect) {
            sortSelect.addEventListener('change', () => {
                const filteredStaff = filterStaff(searchInput?.value || '');
                renderStaffList(filteredStaff, sortSelect.value);
            });
        }

        const addStaffBtn = document.getElementById('addStaffBtn');
        const addStaffModal = document.getElementById('addStaffModal');
        const addStaffForm = document.getElementById('addStaffForm');

        if (addStaffBtn && addStaffModal) {
            addStaffBtn.addEventListener('click', () => {
                addStaffModal.classList.remove('hidden');
            });

            addStaffModal.querySelector('.close-modal')?.addEventListener('click', () => {
                addStaffModal.classList.add('hidden');
                addStaffForm?.reset();
            });

            addStaffModal.addEventListener('click', (e) => {
                if (e.target === addStaffModal) {
                    addStaffModal.classList.add('hidden');
                    addStaffForm?.reset();
                }
            });
        }


        if (addStaffForm) {
            addStaffForm.addEventListener('submit', async (e) => {
                e.preventDefault();

                const email = document.getElementById('staffEmail').value.trim();
                const password = document.getElementById('staffPassword').value.trim();
                const lastName = document.getElementById('staffLastName').value.trim();
                const firstName = document.getElementById('staffFirstName').value.trim();

                if (!email || !password || !lastName || !firstName) {
                    alert('Пожалуйста, заполните все обязательные поля');
                    return;
                }

                try {
                    const staffData = {
                        email,
                        password,
                        last_name: lastName,
                        first_name: firstName,
                        middle_name: document.getElementById('staffMiddleName').value.trim()
                    };
        
                    await api.addStaff(staffData);
                    addStaffModal.classList.add('hidden');
                    addStaffForm.reset();
                    await loadStaffList(); 
                    alert('Сотрудник успешно добавлен');
                } catch (error) {
                    alert(error.message || 'Ошибка при добавлении сотрудника');
                }
            });
        }

        renderStaffList(staff, 'response_time');

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

    modal.querySelector('.close-modal')?.addEventListener('click', () => {
        modal.classList.add('hidden');
    });

    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.classList.add('hidden');
        }
    });

    const updateStats = async (dateFrom, dateTo) => {
        try {
            const analytics = await api.getStaffAnalytics(dateFrom, dateTo);
            const staffStats = analytics.find(s => s.support_id === parseInt(currentStaffId)) || {};
            
            document.getElementById('staffPeriodTickets').textContent = staffStats.total_tickets || '0';
            document.getElementById('staffTodayTickets').textContent = staffStats.today_tickets || '0';
            document.getElementById('staffInProgressTickets').textContent = staffStats.in_progress_tickets || '0';
            document.getElementById('staffCompletedTickets').textContent = staffStats.completed_tickets || '0';
            document.getElementById('staffResponseRate').textContent = `${staffStats.response_rate || 0}%`;
            
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

const setActiveButton = (activeBtn) => {
    document.querySelectorAll('.filter-buttons button').forEach(btn => {
        btn.classList.remove('active');
    });
    activeBtn.classList.add('active');
};

const filterTickets = () => {
    const searchTerm = document.getElementById('ticketSearch')?.value.toLowerCase();
    const statusFilter = document.getElementById('statusFilter')?.value;
    const productFilter = document.getElementById('productFilter')?.value;
    const dateFromFilter = document.getElementById('adminDateFromFilter')?.value;
    const dateToFilter = document.getElementById('adminDateToFilter')?.value;

    const filteredTickets = allTicketsCache.filter(ticket => {
        const matchesSearch = !searchTerm || 
            ticket.subject?.toLowerCase().includes(searchTerm) ||
            ticket.user_email?.toLowerCase().includes(searchTerm) ||
            ticket.support_email?.toLowerCase().includes(searchTerm);

        const matchesStatus = statusFilter === 'all' || ticket.status === statusFilter;
        
        const matchesProduct = productFilter === 'all' || ticket.product === productFilter;

        const ticketDate = new Date(ticket.created_at).setHours(0, 0, 0, 0);
        const matchesDateFrom = !dateFromFilter || ticketDate >= new Date(dateFromFilter).setHours(0, 0, 0, 0);
        const matchesDateTo = !dateToFilter || ticketDate <= new Date(dateToFilter).setHours(0, 0, 0, 0);

        return matchesSearch && matchesStatus && matchesProduct && matchesDateFrom && matchesDateTo;
    });

    displayTickets(filteredTickets);
};

const displayTickets = (tickets) => {
    const container = document.getElementById('adminTicketsList');
    
    if (!tickets.length) {
        container.innerHTML = '<p>Нет заявок с данным статусом</p>';
        return;
    }

    container.innerHTML = tickets.map(ticket => `
        <div class="ticket-item" 
             data-ticket-id="${ticket.id}" 
             data-ticket-status="${ticket.status}"
             data-subject="${ticket.subject}">
            <p><strong>Тема:</strong> ${ticket.subject || 'Без темы'}</p>
            <p><strong>Клиент:</strong> ${ticket.user_email}</p>
            <p><strong>Продукт:</strong> ${ticket.product ? productLocales[ticket.product] : 'Не указан'}</p>
            <p><strong>Сотрудник:</strong> ${ticket.support_email || 'Не назначен'}</p>
            <p><strong>Статус:</strong> ${ticket.status ? statusLocales[ticket.status] : 'Неизвестен'}</p>
            <p><strong>Создан:</strong> ${new Date(ticket.created_at).toLocaleString()}</p>
        </div>
    `).join('');

    container.querySelectorAll('.ticket-item').forEach(item => {
        item.addEventListener('click', () => {
            const ticketId = item.dataset.ticketId;
            const ticket = tickets.find(t => t.id === parseInt(ticketId));
            
            showSection(elements.chatContainer);
            document.querySelector('#chatContainer h2').innerHTML = 
                `Чат по заявке ${ticket.subject}<span id="ticketId" class="hidden">${ticketId}</span>`;
            
            const takeTicketBtn = document.getElementById('takeTicketBtn');
            if (takeTicketBtn) {
                takeTicketBtn.classList.toggle('hidden', item.dataset.ticketStatus !== 'new');
            }
            
            window.loadChatMessages(ticketId);
        });
    });
};

const loadAnalytics = async (dateFrom = null, dateTo = null) => {
    try {
        const analytics = await api.getAnalytics(dateFrom, dateTo);
        let productsChart = null;

        document.getElementById('todayTickets').textContent = analytics.today_tickets || '0';
        document.getElementById('responseRate').textContent = `${analytics.response_rate || 0}%`;
        document.getElementById('newTickets').textContent = analytics.new_tickets || '0';
        document.getElementById('inProgressTickets').textContent = analytics.in_progress_tickets || '0';
        document.getElementById('completedTickets').textContent = analytics.completed_tickets || '0';
        document.getElementById('overdueResponseRate').textContent = 
            `${analytics.overdue_response_rate || 0}%`;
        document.getElementById('overdueResolutionRate').textContent = 
            `${analytics.overdue_resolution_rate || 0}%`;
        
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
            'completedTickets',
            'overdueResponseRate',
            'overdueResolutionRate'
        ].forEach(id => {
            document.getElementById(id).textContent = '-';
        });
    }
};

const loadStatistics = async () => {
    try {
        const dateFrom = document.getElementById('adminDateFromFilter')?.value;
        const dateTo = document.getElementById('adminDateToFilter')?.value;

        const productChartData = Object.keys(productLocales)
            .map(key => ({
                product: productLocales[key],
                count: allTicketsCache.filter(ticket => {
                    const ticketDate = new Date(ticket.created_at).setHours(0, 0, 0, 0);
                    const matchesDateFrom = !dateFrom || ticketDate >= new Date(dateFrom).setHours(0, 0, 0, 0);
                    const matchesDateTo = !dateTo || ticketDate <= new Date(dateTo).setHours(23, 59, 59, 999);
                    return ticket.product === key && matchesDateFrom && matchesDateTo;
                }).length
            }))
            .filter(item => item.count > 0) 
            .sort((a, b) => b.count - a.count);

        const responseTimeRanges = {
            'До 10 мин': 0,
            '10-30 мин': 0,
            '30-60 мин': 0,
            'Более часа': 0
        };

        const filteredTickets = allTicketsCache.filter(ticket => {
            const ticketDate = new Date(ticket.created_at).setHours(0, 0, 0, 0);
            const matchesDateFrom = !dateFrom || ticketDate >= new Date(dateFrom).setHours(0, 0, 0, 0);
            const matchesDateTo = !dateTo || ticketDate <= new Date(dateTo).setHours(23, 59, 59, 999);
            return matchesDateFrom && matchesDateTo;
        });

        filteredTickets.forEach(ticket => {
            const responseTime = ticket.response_time || 0;
            if (responseTime <= 10) {
                responseTimeRanges['До 10 мин']++;
            } else if (responseTime <= 30) {
                responseTimeRanges['10-30 мин']++;
            } else if (responseTime <= 60) {
                responseTimeRanges['30-60 мин']++;
            } else {
                responseTimeRanges['Более часа']++;
            }
        });

        ['productsChart', 'responseTimeChart'].forEach(chartId => {
            const chartElement = document.getElementById(chartId);
            if (chartElement) {
                chartElement.innerHTML = '';
            }
        });

        const productsChartOptions = {
            series: productChartData.map(item => item.count),
            chart: {
                type: 'donut',
                height: 400
            },
            labels: productChartData.map(item => item.product),
            legend: {
                position: 'right',
                offsetY: 0,
                height: 350,
                formatter: function(seriesName, opts) {
                    const value = opts.w.globals.series[opts.seriesIndex];
                    const total = opts.w.globals.series.reduce((a, b) => a + b, 0);
                    const percentage = ((value / total) * 100).toFixed(1);
                    return `${seriesName} - ${value} (${percentage}%)`;
                }
            },
            plotOptions: {
                pie: {
                    donut: {
                        size: '70%',
                        labels: {
                            show: true,
                            total: {
                                show: true,
                                label: 'Всего заявок',
                                formatter: function(w) {
                                    return w.globals.series.reduce((a, b) => a + b, 0);
                                }
                            }
                        }
                    }
                }
            },
            colors: [
                '#3b82f6', '#ef4444', '#22c55e', '#f59e0b', 
                '#6366f1', '#ec4899', '#14b8a6', '#8b5cf6',
                '#64748b'
            ]
        };

        const responseTimeChartOptions = {
            series: [{
                name: 'Количество заявок',
                data: Object.values(responseTimeRanges)
            }],
            chart: {
                type: 'bar',
                height: 400,
                toolbar: {
                    show: false
                }
            },
            plotOptions: {
                bar: {
                    borderRadius: 8,
                    dataLabels: {
                        position: 'top'
                    },
                    distributed: true
                }
            },
            dataLabels: {
                enabled: true,
                formatter: function(val) {
                    const total = Object.values(responseTimeRanges).reduce((a, b) => a + b, 0);
                    const percentage = ((val / total) * 100).toFixed(1);
                    return `${val}\n(${percentage}%)`;
                },
                offsetY: -20,
                style: {
                    fontSize: '12px',
                    colors: ["#304758"]
                }
            },
            xaxis: {
                categories: Object.keys(responseTimeRanges),
                position: 'bottom',
                labels: {
                    style: {
                        fontSize: '12px'
                    }
                }
            },
            yaxis: {
                title: {
                    text: 'Количество заявок',
                    style: {
                        fontSize: '1rem',
                        fontWeight: 500,
                        fontFamily: "'Inter', sans-serif",
                        color: '#1e293b'
                    }
                },
                labels: {
                    style: {
                        fontSize: '0.875rem',
                        fontFamily: "'Inter', sans-serif",
                        colors: '#64748b'
                    },
                    formatter: (value) => Math.round(value)
                }
            },
            colors: ['#3b82f6', '#22c55e', '#f59e0b', '#ef4444']
        };

        if (document.getElementById('productsChart')) {
            const productsChart = new ApexCharts(
                document.getElementById('productsChart'), 
                productsChartOptions
            );
            await productsChart.render();
        }

        if (document.getElementById('responseTimeChart')) {
            const responseTimeChart = new ApexCharts(
                document.getElementById('responseTimeChart'), 
                responseTimeChartOptions
            );
            await responseTimeChart.render();
        }

    } catch (error) {
        console.error('Ошибка загрузки статистики:', error);
        ['productsChart', 'responseTimeChart'].forEach(chartId => {
            const chartElement = document.getElementById(chartId);
            if (chartElement) {
                chartElement.innerHTML = 'Ошибка загрузки графика';
            }
        });
    }
};

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

document.getElementById('showStatistics')?.addEventListener('click', (e) => {
    const containers = document.querySelectorAll('#adminContent > div');
    containers.forEach(el => el.classList.add('hidden'));
    document.getElementById('statisticsContainer').classList.remove('hidden');
    setActiveButton(e.target);
    loadStatistics();
});

document.getElementById('applyStatsDateFilter')?.addEventListener('click', loadStatistics);

document.getElementById('adminLogoutBtn')?.addEventListener('click', () => {
    localStorage.clear();
    window.location.reload();
});

export const initAdmin = () => {
    return { showAdminDashboard };
};