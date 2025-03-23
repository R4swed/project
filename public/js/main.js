import { showSection, elements } from './utils.js';
import { initAuth } from './auth.js';
import { initChat } from './chat.js';
import { initTickets, showTicketListOrForm } from './tickets.js';
import { initSupport, showSupportDashboard } from './support.js';

document.addEventListener('DOMContentLoaded', () => {
    initAuth();
    initChat();
    initTickets();
    initSupport();

    const token = localStorage.getItem('token');
    if (!token) {
        showSection(elements.loginForm);
        return;
    }

    const user = JSON.parse(localStorage.getItem('user') || '{}');
    if (user.role === 'support') {
        showSupportDashboard();
    } else {
        showTicketListOrForm();
    }
});