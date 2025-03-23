export const showSection = (activeSection) => {
    const sections = ['loginForm', 'registerForm', 'ticketForm', 'ticketList', 'chatContainer', 'supportDashboard'];
    sections.forEach(id => document.getElementById(id)?.classList.add('hidden'));
    activeSection?.classList.remove('hidden');
};

export const elements = {
    loginForm: document.getElementById('loginForm'),
    registerForm: document.getElementById('registerForm'),
    ticketForm: document.getElementById('ticketForm'),
    ticketList: document.getElementById('ticketList'),
    chatContainer: document.getElementById('chatContainer'),
    supportDashboard: document.getElementById('supportDashboard')
};

export const statusLocales = {
    'new': 'Новый',
    'in_progress': 'В работе',
    'completed': 'Завершён'
};