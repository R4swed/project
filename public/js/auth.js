document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    const ticketForm = document.getElementById('ticketForm');
    const ticketList = document.getElementById('ticketList');
    const chatContainer = document.getElementById('chatContainer');

    function init() {
        const token = localStorage.getItem('token');
        if (!token) {
            showLoginForm();
        } else {
            showTicketListOrForm();
        }
    }

    function showLoginForm() {
        loginForm.classList.remove('hidden');
        registerForm.classList.add('hidden');
        ticketForm.classList.add('hidden');
        ticketList.classList.add('hidden');
        chatContainer.classList.add('hidden');
    }

    function showRegisterForm() {
        loginForm.classList.add('hidden');
        registerForm.classList.remove('hidden');
        ticketForm.classList.add('hidden');
        ticketList.classList.add('hidden');
        chatContainer.classList.add('hidden');
    }

    function showTicketForm() {
        loginForm.classList.add('hidden');
        registerForm.classList.add('hidden');
        ticketForm.classList.remove('hidden');
        ticketList.classList.add('hidden');
        chatContainer.classList.add('hidden');
    }

    function showTicketList() {
        loginForm.classList.add('hidden');
        registerForm.classList.add('hidden');
        ticketForm.classList.add('hidden');
        ticketList.classList.remove('hidden');
        chatContainer.classList.add('hidden');
    }

    async function showTicketListOrForm() {
        try {
            const token = localStorage.getItem('token');
            console.log('Запрос тикетов с токеном:', token);
            const response = await fetch('/api/tickets', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!response.ok) {
                throw new Error(`Ошибка сервера: ${response.status}`);
            }
            const tickets = await response.json();
            console.log('Полученные тикеты:', tickets);
            const user = JSON.parse(localStorage.getItem('user') || '{}');
    
            if (tickets && tickets.length > 0) {
                showTicketList();
                window.loadTicketList(); // Оставляем вызов глобальной функции
            } else {
                console.log('Тикетов нет, показываем форму');
                showTicketForm();
            }
        } catch (error) {
            console.error('Ошибка загрузки тикетов:', error);
            showTicketForm();
        }
    }

    window.loadTicketList = async function() {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch('/api/tickets', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const tickets = await response.json();
            const ticketsContainer = document.getElementById('ticketsContainer');
            ticketsContainer.innerHTML = '';
            tickets.forEach(ticket => {
                const div = document.createElement('div');
                div.classList.add('ticket-item');
                div.innerHTML = `
                    <p><strong>Тема:</strong> ${ticket.subject}</p>
                    <p><strong>Статус:</strong> ${ticket.status}</p>
                    <p><strong>Создан:</strong> ${new Date(ticket.created_at).toLocaleString()}</p>
                `;
                div.addEventListener('click', () => {
                    document.getElementById('ticketList').classList.add('hidden');
                    const chatContainer = document.getElementById('chatContainer');
                    chatContainer.classList.remove('hidden');
                    const ticketIdElement = document.getElementById('ticketId');
                    if (ticketIdElement) {
                        ticketIdElement.textContent = ticket.id;
                    }
                    document.getElementById('chatUserEmail').textContent = user.email;
                    chatContainer.dataset.ticketSubject = ticket.subject;
                    document.getElementById('ticketId').parentElement.textContent = `Чат по заявке (${ticket.subject})`;
                    window.loadChatMessages(ticket.id);
                });
                ticketsContainer.appendChild(div);
            });
            document.getElementById('ticketListUserEmail').textContent = user.email;
            return tickets; // Возвращаем массив тикетов
        } catch (error) {
            console.error('Ошибка загрузки тикетов:', error);
            return []; // Возвращаем пустой массив в случае ошибки
        }
    };

    document.getElementById('show-register').addEventListener('click', (e) => {
        e.preventDefault();
        showRegisterForm();
    });

    document.getElementById('show-login').addEventListener('click', (e) => {
        e.preventDefault();
        showLoginForm();
    });

    loginForm.querySelector('form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('login-email').value;
        const password = document.getElementById('login-password').value;

        try {
            const data = await api.login(email, password);
            if (data.token) {
                localStorage.setItem('token', data.token);
                localStorage.setItem('user', JSON.stringify(data.user));
                showTicketListOrForm();
            }
        } catch (error) {
            alert('Ошибка входа');
            console.error('Ошибка входа:', error);
        }
    });

    registerForm.querySelector('form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('register-email').value;
        const password = document.getElementById('register-password').value;

        try {
            const response = await api.register(email, password);
            const data = await response.json();
            if (response.ok) {
                if (data.token) {
                    localStorage.setItem('token', data.token);
                    localStorage.setItem('user', JSON.stringify(data.user));
                    showTicketListOrForm();
                }
            } else {
                if (response.status === 400 && data.error === 'Пользователь уже существует') {
                    alert('Этот email уже зарегистрирован. Попробуйте войти или используйте другой email.');
                } else {
                    alert(`Ошибка регистрации: ${data.error || 'Неизвестная ошибка'}`);
                }
            }
        } catch (error) {
            console.error('Ошибка регистрации:', error);
            alert('Не удалось подключиться к серверу или обработать ответ: ' + error.message);
        }
    });

    document.getElementById('logoutBtn').addEventListener('click', () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        showLoginForm();
    });

    document.getElementById('ticketListLogoutBtn').addEventListener('click', () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        showLoginForm();
    });

    document.getElementById('newTicketBtn').addEventListener('click', () => {
        showTicketForm();
    });

    document.querySelectorAll('#loginForm, #registerForm, #ticketForm, #ticketList, #chatContainer').forEach(form => {
        form.classList.add('hidden');
    });

    init();
});