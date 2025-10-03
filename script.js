document.addEventListener('DOMContentLoaded', () => {
    const prevWeekBtn = document.getElementById('prev-week');
    const todayBtn = document.getElementById('today');
    const nextWeekBtn = document.getElementById('next-week');
    const weekTitle = document.getElementById('week-title');
    const dayColumns = document.querySelectorAll('.day-column');

    let currentDate = new Date();

    function getMonday(d) {
        d = new Date(d);
        const day = d.getDay();
        const diff = d.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is sunday
        return new Date(d.setDate(diff));
    }

    function renderWeek() {
        const monday = getMonday(currentDate);
        monday.setHours(0, 0, 0, 0);

        const weekDates = [];
        for (let i = 0; i < 7; i++) {
            const date = new Date(monday);
            date.setDate(monday.getDate() + i);
            weekDates.push(date);
        }

        const startOfWeek = weekDates[0];
        const endOfWeek = weekDates[6];

        weekTitle.textContent = `${startOfWeek.getFullYear()}年${startOfWeek.getMonth() + 1}月${startOfWeek.getDate()}日 - ${endOfWeek.getFullYear()}年${endOfWeek.getMonth() + 1}月${endOfWeek.getDate()}日`;

        const dayNames = ['月曜日', '火曜日', '水曜日', '木曜日', '金曜日', '土曜日', '日曜日'];
        dayColumns.forEach((column, index) => {
            const date = weekDates[index];
            const h3 = column.querySelector('h3');
            h3.textContent = `${dayNames[index]} (${date.getMonth() + 1}/${date.getDate()})`;
        });
    }

    prevWeekBtn.addEventListener('click', () => {
        currentDate.setDate(currentDate.getDate() - 7);
        renderWeek();
    });

    nextWeekBtn.addEventListener('click', () => {
        currentDate.setDate(currentDate.getDate() + 7);
        renderWeek();
    });

    todayBtn.addEventListener('click', () => {
        currentDate = new Date();
        renderWeek();
    });

    renderWeek();
});