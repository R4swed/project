import { showSection, elements } from './utils.js';
import { initAuth } from './auth.js';
import { initChat } from './chat.js';
import { initTickets, showTicketListOrForm } from './tickets.js';
import { initSupport, showSupportDashboard } from './support.js';
import { initAdmin } from './admin.js';

document.addEventListener('DOMContentLoaded', () => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const token = localStorage.getItem('token');

    initAuth();
    initChat();
    initTickets();
    initSupport();
    const { showAdminDashboard } = initAdmin();

    if (!token) {
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
});