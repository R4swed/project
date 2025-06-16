import { showSection, elements } from './utils.js';
import { initAuth, checkAuthState } from './auth.js';
import { initChat } from './chat.js';
import { initTickets } from './tickets.js';
import { initSupport } from './support.js';
import { initAdmin } from './admin.js';

document.addEventListener('DOMContentLoaded', () => {
    initAuth();
    initChat();
    initTickets();
    initSupport();
    initAdmin();

    checkAuthState();

    window.addEventListener('load', checkAuthState);
});