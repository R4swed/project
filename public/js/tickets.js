document.addEventListener('DOMContentLoaded', () => {
    const ticketForm = document.getElementById('ticketForm')?.querySelector('form');
    if (!ticketForm) return;

    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const emailInput = document.getElementById('email');
    if (user.email && emailInput) emailInput.value = user.email;

    ticketForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const ticketData = {
            company: document.getElementById('company')?.value || '',
            email: emailInput?.value || '',
            product: document.getElementById('product')?.value || '',
            subject: document.getElementById('subject')?.value || '',
            description: document.getElementById('description')?.value || ''
        };

        const response = await api.createTicket(ticketData);
        if (response.id) {
            ticketForm.reset();
            if (user.email) emailInput.value = user.email;
            document.getElementById('ticketForm').classList.add('hidden');
            const chatContainer = document.getElementById('chatContainer');
            chatContainer.classList.remove('hidden');
            document.getElementById('ticketId').textContent = response.id;
            document.getElementById('chatUserEmail').textContent = user.email;
            document.querySelector('#chatContainer h2').textContent = `Чат по заявке (${ticketData.subject})`;
            window.loadChatMessages(response.id);
        }
    });
});