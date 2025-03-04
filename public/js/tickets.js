document.addEventListener('DOMContentLoaded', () => {
    const ticketForm = document.getElementById('ticketForm')?.querySelector('form');
    if (!ticketForm) return;

    const user = JSON.parse(localStorage.getItem('user') || '{}');
    if (user.email) {
        const emailInput = document.getElementById('email');
        if (emailInput) emailInput.value = user.email;
    }

    ticketForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const ticketData = {
            company: document.getElementById('company')?.value || '',
            email: document.getElementById('email')?.value || '',
            product: document.getElementById('product')?.value || '',
            subject: document.getElementById('subject')?.value || '',
            description: document.getElementById('description')?.value || ''
        };

        try {
            const response = await api.createTicket(ticketData);
            if (response.id) {
                alert('Заявка успешно создана!');
                ticketForm.reset();
                if (user.email) {
                    document.getElementById('email').value = user.email;
                }
                document.getElementById('ticketForm').classList.add('hidden');
                const chatContainer = document.getElementById('chatContainer');
                chatContainer.classList.remove('hidden');
                const ticketIdElement = document.getElementById('ticketId');
                if (ticketIdElement) {
                    ticketIdElement.textContent = response.id; // Устанавливаем ID
                }
                document.getElementById('chatUserEmail').textContent = user.email;
                chatContainer.dataset.ticketSubject = ticketData.subject;
                document.getElementById('ticketId').parentElement.textContent = `Чат по заявке (${ticketData.subject})`;
                window.loadChatMessages(response.id);
            }
        } catch (error) {
            console.error('Ошибка при создании заявки:', error);
            alert('Произошла ошибка при создании заявки');
        }
    });
});