export const showSection = (section) => {
    Object.values(elements).forEach(element => {
        if (element) element.classList.add('hidden');
    });
    
    if (section) {
        section.classList.remove('hidden');
        
        if (section === elements.resetPasswordForm) {
            const urlParams = new URLSearchParams(window.location.search);
            const resetToken = urlParams.get('reset_token');
            
            if (resetToken) {
                elements.resetPasswordRequestForm.classList.add('hidden');
                elements.resetPasswordConfirmForm.classList.remove('hidden');
            } else {
                elements.resetPasswordRequestForm.classList.remove('hidden');
                elements.resetPasswordConfirmForm.classList.add('hidden');
            }
        }
    }
};

export const elements = {
    loginForm: document.getElementById('loginForm'),
    registerForm: document.getElementById('registerForm'),
    ticketForm: document.getElementById('ticketForm'),
    ticketList: document.getElementById('ticketList'),
    chatContainer: document.getElementById('chatContainer'),
    supportDashboard: document.getElementById('supportDashboard'),
    adminDashboard: document.getElementById('adminDashboard'),
    resetPasswordForm: document.getElementById('resetPasswordForm'),
    resetPasswordRequestForm: document.getElementById('resetPasswordRequestForm'),
    resetPasswordConfirmForm: document.getElementById('resetPasswordConfirmForm')
};

export const statusLocales = {
    'new': 'Новый',
    'in_progress': 'В работе',
    'completed': 'Завершён'
};

export const productLocales = {
    'product1': 'Курсор',
    'product2': 'FaceGate',
    'product3': 'Комплексная система диспетчерского контроля и мониторинга промышленного оборудования',
    'product4': 'Шкафы автоматики и щиты управления',
    'product5': 'Протокол',
    'product6': 'AutoGate',
    'product7': 'Система вибромониторинга насосного оборудования',
    'product8': 'Система мониторинга физиологических параметров операторов',
    'product9': 'Другое'
};
