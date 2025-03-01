document.addEventListener('DOMContentLoaded', () => {
    const ticketForm = document.getElementById('ticketForm')?.querySelector('form');
    if (!ticketForm) return; // Если формы нет, прекращаем выполнение

    // Заполняем email из данных пользователя
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    if (user.email) {
        const emailInput = document.getElementById('email');
        if (emailInput) emailInput.value = user.email;
    }

    // Обработка отправки формы
    ticketForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const ticketData = {
            company: document.getElementById('company')?.value || '',
            email: document.getElementById('email')?.value || '',
            product: document.getElementById('product')?.value || '',
            subject: document.getElementById('subject')?.value || '', // Используем subject вместо title
            description: document.getElementById('description')?.value || ''
        };

        try {
            const response = await api.createTicket(ticketData);
            if (response.id) {
                alert('Заявка успешно создана!');
                ticketForm.reset();
                // Восстанавливаем email после сброса формы
                if (user.email) {
                    document.getElementById('email').value = user.email;
                }
            }
        } catch (error) {
            console.error('Ошибка при создании заявки:', error);
            alert('Произошла ошибка при создании заявки');
        }
    });
});