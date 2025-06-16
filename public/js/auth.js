import { showSection, elements } from './utils.js';
import { showSupportDashboard } from './support.js';
import { showTicketListOrForm } from './tickets.js';
import { showAdminDashboard } from './admin.js';
import { api } from './api.js';

export const checkAuthState = () => {
    const token = localStorage.getItem('token');
    const user = JSON.parse(localStorage.getItem('user') || '{}');

    if (!token || !user) {
        showSection(elements.loginForm);
        return;
    }

    if (user.role === 'admin') {
        showAdminDashboard();
    } else if (user.role === 'support') {
        showSupportDashboard();
    } else {
        showTicketListOrForm();
    }
};

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

            if (response.user.role === 'admin') {
                showAdminDashboard();
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

    document.getElementById('show-register')?.addEventListener('click', (e) => {
        e.preventDefault();
        showSection(elements.registerForm);
    });

    document.getElementById('show-login')?.addEventListener('click', (e) => {
        e.preventDefault();
        showSection(elements.loginForm);
    });

    document.querySelectorAll('#logoutBtn, #ticketListLogoutBtn, #supportLogoutBtn, #adminLogoutBtn')
        .forEach(btn => {
            btn?.addEventListener('click', () => {
                localStorage.clear();
                showSection(elements.loginForm);
            });
        });
};