import { showSection, elements } from './utils.js';
import { showSupportDashboard } from './support.js';
import { showTicketListOrForm } from './tickets.js';
import {showAdminDashboard} from './admin.js';
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

    const showResetPassword = document.getElementById('show-reset-password');
    const showLoginFromReset = document.getElementById('show-login-from-reset');
    const resetPasswordRequestForm = document.getElementById('resetPasswordRequestForm')?.querySelector('form');
    const resetPasswordConfirmForm = document.getElementById('resetPasswordConfirmForm')?.querySelector('form');

    showResetPassword?.addEventListener('click', (e) => {
        e.preventDefault();
        showSection(elements.resetPasswordForm);
        elements.resetPasswordRequestForm.classList.remove('hidden');
        elements.resetPasswordConfirmForm.classList.add('hidden');
    });

    showLoginFromReset?.addEventListener('click', (e) => {
        e.preventDefault();
        showSection(elements.loginForm);
    });

    resetPasswordRequestForm?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('reset-email').value;
        
        if (!email) {
            alert('Пожалуйста, введите email');
            return;
        }

        try {
            await api.requestPasswordReset(email);
            alert('На ваш email отправлены инструкции по восстановлению пароля');
            showSection(elements.loginForm);
        } catch (error) {
            alert(error.message || 'Ошибка при отправке запроса на восстановление пароля');
        }
    });

    resetPasswordConfirmForm?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const newPassword = document.getElementById('new-password').value;
        const confirmPassword = document.getElementById('confirm-password').value;

        if (!newPassword || !confirmPassword) {
            alert('Пожалуйста, заполните все поля');
            return;
        }

        if (newPassword !== confirmPassword) {
            alert('Пароли не совпадают');
            return;
        }

        const urlParams = new URLSearchParams(window.location.search);
        const token = urlParams.get('reset_token');

        if (!token) {
            alert('Отсутствует токен сброса пароля');
            return;
        }

        try {
            await api.resetPassword(token, newPassword);
            alert('Пароль успешно изменен');
            window.history.replaceState({}, document.title, window.location.pathname);
            showSection(elements.loginForm);
        } catch (error) {
            alert(error.message || 'Ошибка при сбросе пароля');
        }
    });

    document.querySelectorAll('#logoutBtn, #ticketListLogoutBtn, #supportLogoutBtn')
        .forEach(btn => {
            btn.addEventListener('click', () => {
                localStorage.clear();
                showSection(elements.loginForm);
            });
        });
};