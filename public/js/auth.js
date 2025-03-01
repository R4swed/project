// Немедленно скрываем все формы
document.querySelectorAll('#loginForm, #registerForm, #ticketForm').forEach(form => {
    form.classList.add('hidden');
});

document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    const ticketForm = document.getElementById('ticketForm');

    // Инициализация при загрузке
    function init() {
        const token = localStorage.getItem('token');
        if (!token) {
            showLoginForm();
        } else {
            showTicketForm();
        }
    }

    // Показать форму входа
    function showLoginForm() {
        loginForm.classList.remove('hidden');
        registerForm.classList.add('hidden');
        ticketForm.classList.add('hidden');
    }

    // Показать форму регистрации
    function showRegisterForm() {
        loginForm.classList.add('hidden');
        registerForm.classList.remove('hidden');
        ticketForm.classList.add('hidden');
    }

    // Показать форму тикетов
    function showTicketForm() {
        loginForm.classList.add('hidden');
        registerForm.classList.add('hidden');
        ticketForm.classList.remove('hidden');
        
        // Показываем email пользователя
        const user = JSON.parse(localStorage.getItem('user'));
        if (user && user.email) {
            document.getElementById('userEmail').textContent = user.email;
            document.getElementById('email').value = user.email;
        }
    }

    // Обработчики переключения между формами
    document.getElementById('show-register').addEventListener('click', (e) => {
        e.preventDefault();
        showRegisterForm();
    });

    document.getElementById('show-login').addEventListener('click', (e) => {
        e.preventDefault();
        showLoginForm();
    });

    // Обработка входа
    loginForm.querySelector('form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('login-email').value;
        const password = document.getElementById('login-password').value;

        try {
            const data = await api.login(email, password);
            if (data.token) {
                localStorage.setItem('token', data.token);
                localStorage.setItem('user', JSON.stringify(data.user));
                showTicketForm();
            }
        } catch (error) {
            alert('Ошибка входа');
            console.error('Ошибка входа:', error);
        }
    });

    // Обработка регистрации
    registerForm.querySelector('form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('register-email').value;
        const password = document.getElementById('register-password').value;

        try {
            const data = await api.register(email, password);
            if (data.token) {
                localStorage.setItem('token', data.token);
                localStorage.setItem('user', JSON.stringify(data.user));
                showTicketForm();
            }
        } catch (error) {
            alert('Ошибка регистрации');
            console.error('Ошибка регистрации:', error);
        }
    });

    // Обработка выхода
    document.getElementById('logoutBtn').addEventListener('click', () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        showLoginForm();
    });

    // Запускаем инициализацию
    init();
});