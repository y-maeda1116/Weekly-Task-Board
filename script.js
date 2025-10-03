document.addEventListener('DOMContentLoaded', () => {
    const addTaskBtn = document.getElementById('add-task-btn');
    const modal = document.getElementById('task-modal');
    const closeModalBtn = document.querySelector('.close-btn');
    const taskForm = document.getElementById('task-form');
    const taskBoard = document.getElementById('task-board');

    // モーダルを開く
    addTaskBtn.addEventListener('click', () => {
        modal.style.display = 'block';
    });

    // モーダルを閉じる
    closeModalBtn.addEventListener('click', () => {
        modal.style.display = 'none';
    });

    // モーダルの外側をクリックしても閉じる
    window.addEventListener('click', (event) => {
        if (event.target == modal) {
            modal.style.display = 'none';
        }
    });

    // タスクフォームの送信処理
    taskForm.addEventListener('submit', (event) => {
        event.preventDefault();

        const task = {
            id: `task-${Date.now()}`,
            name: document.getElementById('task-name').value,
            time: parseFloat(document.getElementById('estimated-time').value),
            day: document.getElementById('assign-day').value,
            details: document.getElementById('task-details').value
        };

        saveTask(task);
        renderTasks();
        modal.style.display = 'none';
        taskForm.reset();
    });

    // タスクをlocalStorageに保存する
    function saveTask(task) {
        const tasks = getTasks();
        tasks.push(task);
        localStorage.setItem('tasks', JSON.stringify(tasks));
    }

    // localStorageからタスクを取得する
    function getTasks() {
        const tasks = localStorage.getItem('tasks');
        return tasks ? JSON.parse(tasks) : [];
    }

    // タスクをボードに描画する
    function renderTasks() {
        // 既存のタスクカードをクリア
        document.querySelectorAll('.task-card').forEach(card => card.remove());

        const tasks = getTasks();
        tasks.forEach(task => {
            const taskCard = document.createElement('div');
            taskCard.classList.add('task-card');
            taskCard.setAttribute('id', task.id);
            taskCard.innerHTML = `
                <h4>${task.name}</h4>
                <p>見積もり: ${task.time}時間</p>
                ${task.details ? `<p>${task.details}</p>` : ''}
            `;

            document.getElementById(task.day).appendChild(taskCard);
        });
    }

    // 初期表示
    renderTasks();
});