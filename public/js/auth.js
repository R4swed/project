import { showSection, elements } from './utils.js';
import { showSupportDashboard } from './support.js';
import { showTicketListOrForm } from './tickets.js';
import { api } from './api.js';

export const initAuth = () => {
    elements.loginForm?.querySelector('form').addEventListener('submit', async (e) => {
        e.preventDefault();
        try {
            const email = document.getElementById('login-email').value;
            const password = document.getElementById('login-password').value;
            
            if (!email || !password) {
                alert('Пожалуйста, заполните все поля');
                return;
            }
    
            const response = await api.login(email, password);
            if (!response || !response.token) {
                throw new Error('Некорректный ответ от сервера');
            }
    
            localStorage.setItem('token', response.token);
            localStorage.setItem('user', JSON.stringify(response.user));

            // Изменяем проверку роли здесь
            if (response.user.role === 'admin') {
                window.location.reload(); // Перезагружаем страницу для правильной инициализации
            } else if (response.user.role === 'support') {
                showSupportDashboard();
            } else {
                showTicketListOrForm();
            }
        } catch (error) {
            console.error('Ошибка входа:', error);
            alert('Ошибка входа: ' + (error.message || 'Неверный email или пароль'));
        }
    });

    elements.registerForm?.querySelector('form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const [email, password] = [
            document.getElementById('register-email').value,
            document.getElementById('register-password').value
        ];
        try {
            const response = await api.register(email, password);
            localStorage.setItem('token', response.token);
            localStorage.setItem('user', JSON.stringify(response.user));
            showTicketListOrForm();
        } catch (error) {
            if (error.message === 'Пользователь уже существует') {
                alert('Пользователь с таким email уже существует');
            } else {
                alert('Ошибка при регистрации');
                console.error(error.message);
            }
        }
    });

    // Обработчики переключения форм
    document.getElementById('show-register')?.addEventListener('click', (e) => {
        e.preventDefault();
        showSection(elements.registerForm);
    });

    document.getElementById('show-login')?.addEventListener('click', (e) => {
        e.preventDefault();
        showSection(elements.loginForm);
    });

    // Обработчики выхода
    document.querySelectorAll('#logoutBtn, #ticketListLogoutBtn, #supportLogoutBtn')
        .forEach(btn => {
            btn.addEventListener('click', () => {
                localStorage.clear();
                showSection(elements.loginForm);
            });
        });
};