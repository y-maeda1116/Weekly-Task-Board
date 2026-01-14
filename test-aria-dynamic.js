// カテゴリ定義（script.jsから抜粋）
const TASK_CATEGORIES = {
    'task': { name: 'タスク', color: '#3498db', bgColor: '#e3f2fd' },
    'meeting': { name: '打ち合わせ', color: '#27ae60', bgColor: '#e8f5e8' },
    'review': { name: 'レビュー', color: '#f39c12', bgColor: '#fff3e0' },
    'bugfix': { name: 'バグ修正', color: '#e74c3c', bgColor: '#ffebee' },
    'document': { name: 'ドキュメント作成', color: '#9b59b6', bgColor: '#f3e5f5' },
    'research': { name: '学習・調査', color: '#f1c40f', bgColor: '#fffde7' }
};

function getCategoryInfo(categoryKey) {
    return TASK_CATEGORIES[categoryKey] || TASK_CATEGORIES['task'];
}

function validateCategory(category) {
    if (category && TASK_CATEGORIES[category]) {
        return category;
    }
    return 'task';
}

// createTaskElement関数（script.jsから抜粋・簡略化）
function createTaskElement(task) {
    const taskElement = document.createElement('div');
    taskElement.className = 'task';
    if (task.completed) {
        taskElement.classList.add('completed');
    }
    taskElement.classList.add(`priority-${task.priority || 'medium'}`);
    const categoryKey = validateCategory(task.category);
    taskElement.classList.add(`category-${categoryKey}`);
    taskElement.dataset.taskId = task.id;
    taskElement.dataset.category = categoryKey;

    const categoryInfo = getCategoryInfo(categoryKey);

    let dueDateHTML = '';
    if (task.due_date) {
        const dueDate = new Date(task.due_date);
        const formattedDate = `${dueDate.getMonth() + 1}/${dueDate.getDate()} ${String(dueDate.getHours()).padStart(2, '0')}:${String(dueDate.getMinutes()).padStart(2, '0')}`;
        dueDateHTML = `<div class="task-due-date">期限: ${formattedDate}</div>`;
    }

    const priorityLabels = { high: '高', medium: '中', low: '低' };
    const priorityLabel = priorityLabels[task.priority] || '中';
    
    taskElement.innerHTML = `
        <div class="category-bar" style="background-color: ${categoryInfo.color};"></div>
        <div class="task-header">
            <input type="checkbox" class="task-checkbox" aria-label="${task.name}を完了としてマーク" ${task.completed ? 'checked' : ''}>
            <div class="task-name">${task.name}</div>
            <span class="task-priority ${task.priority || 'medium'}">${priorityLabel}</span>
            <div class="task-time">${task.estimated_time}h</div>
        </div>
        ${dueDateHTML}
    `;

    return taskElement;
}

// createArchivedTaskElement関数（script.jsから抜粋・簡略化）
function createArchivedTaskElement(task) {
    const taskElement = document.createElement('div');
    taskElement.className = 'archived-task';
    
    const categoryKey = validateCategory(task.category);
    const categoryInfo = getCategoryInfo(categoryKey);
    taskElement.classList.add(`category-${categoryKey}`);
    
    const archivedDate = new Date(task.archived_date);
    const formattedArchivedDate = `${archivedDate.getFullYear()}/${archivedDate.getMonth() + 1}/${archivedDate.getDate()} ${String(archivedDate.getHours()).padStart(2, '0')}:${String(archivedDate.getMinutes()).padStart(2, '0')}`;
    
    let datesHTML = '';
    if (task.assigned_date) {
        const assignedDate = new Date(task.assigned_date);
        datesHTML += `担当日: ${assignedDate.getMonth() + 1}/${assignedDate.getDate()}`;
    }
    if (task.due_date) {
        const dueDate = new Date(task.due_date);
        if (datesHTML) datesHTML += ' | ';
        datesHTML += `期限: ${dueDate.getMonth() + 1}/${dueDate.getDate()} ${String(dueDate.getHours()).padStart(2, '0')}:${String(dueDate.getMinutes()).padStart(2, '0')}`;
    }
    
    taskElement.innerHTML = `
        <div class="category-bar" style="background-color: ${categoryInfo.color};"></div>
        <div class="archived-task-header">
            <div class="archived-task-name">${task.name}</div>
            <div class="archived-task-time">${task.estimated_time}h</div>
        </div>
        ${datesHTML ? `<div class="archived-task-dates">${datesHTML}</div>` : ''}
        ${task.details ? `<div class="archived-task-details">${task.details}</div>` : ''}
        <div class="archived-task-completed-date">完了: ${formattedArchivedDate}</div>
        <div class="archived-task-actions">
            <button class="restore-task-btn" data-task-id="${task.id}" aria-label="${task.name}を復元">
                ↩️ 復元
            </button>
            <button class="delete-task-btn" data-task-id="${task.id}" aria-label="${task.name}を削除">
                🗑️ 削除
            </button>
        </div>
    `;
    
    return taskElement;
}

// updateThemeButton関数（script.jsから抜粋）
function updateThemeButton(theme) {
    const themeToggleBtn = document.getElementById('theme-toggle');
    if (theme === 'dark') {
        themeToggleBtn.innerHTML = '☀️ ライト';
        themeToggleBtn.setAttribute('aria-label', 'ライトモードに切り替え');
    } else {
        themeToggleBtn.innerHTML = '🌙 ダーク';
        themeToggleBtn.setAttribute('aria-label', 'ダークモードに切り替え');
    }
}

// テスト実行
document.addEventListener('DOMContentLoaded', () => {
    runTests();
});

function runTests() {
    let allPassed = true;
    
    // テスト1: タスクチェックボックスのaria-label
    console.log('テスト1: タスクチェックボックスのaria-label');
    const test1Result = testTaskCheckboxAriaLabel();
    displayTestResult('test1-result', test1Result);
    if (!test1Result.passed) allPassed = false;
    
    // テスト2: アーカイブボタンのaria-label
    console.log('テスト2: アーカイブボタンのaria-label');
    const test2Result = testArchivedTaskButtonsAriaLabel();
    displayTestResult('test2-result', test2Result);
    if (!test2Result.passed) allPassed = false;
    
    // テスト3: テーマ切り替えボタンのaria-label
    console.log('テスト3: テーマ切り替えボタンのaria-label');
    const test3Result = testThemeButtonAriaLabel();
    displayTestResult('test3-result', test3Result);
    if (!test3Result.passed) allPassed = false;
    
    console.log(`\n全体結果: ${allPassed ? '✅ すべてのテストが合格' : '❌ 一部のテストが失敗'}`);
}

function testTaskCheckboxAriaLabel() {
    const results = [];
    const testTasks = [
        { id: 'task-1', name: 'UIを修正する', estimated_time: 5, priority: 'medium', category: 'task', completed: false },
        { id: 'task-2', name: 'バグを修正する', estimated_time: 3, priority: 'high', category: 'bugfix', completed: false },
        { id: 'task-3', name: 'ドキュメントを作成', estimated_time: 2, priority: 'low', category: 'document', completed: true }
    ];
    
    const container = document.getElementById('task-container');
    
    testTasks.forEach(task => {
        const taskElement = createTaskElement(task);
        container.appendChild(taskElement);
        
        const checkbox = taskElement.querySelector('.task-checkbox');
        const ariaLabel = checkbox.getAttribute('aria-label');
        const expectedLabel = `${task.name}を完了としてマーク`;
        
        if (ariaLabel === expectedLabel) {
            results.push({ passed: true, message: `✅ "${task.name}": aria-labelが正しく設定されています` });
            console.log(`  ✅ "${task.name}": aria-label="${ariaLabel}"`);
        } else {
            results.push({ passed: false, message: `❌ "${task.name}": aria-labelが正しくありません（期待値: "${expectedLabel}", 実際: "${ariaLabel}"）` });
            console.log(`  ❌ "${task.name}": 期待値="${expectedLabel}", 実際="${ariaLabel}"`);
        }
    });
    
    const allPassed = results.every(r => r.passed);
    return {
        passed: allPassed,
        message: allPassed ? '✅ すべてのタスクチェックボックスにaria-labelが正しく設定されています' : '❌ 一部のタスクチェックボックスのaria-labelが正しくありません',
        details: results
    };
}

function testArchivedTaskButtonsAriaLabel() {
    const results = [];
    const testTasks = [
        { 
            id: 'archived-1', 
            name: '完了したタスク1', 
            estimated_time: 4, 
            category: 'task', 
            completed: true,
            archived_date: new Date().toISOString()
        },
        { 
            id: 'archived-2', 
            name: '完了したバグ修正', 
            estimated_time: 2, 
            category: 'bugfix', 
            completed: true,
            archived_date: new Date().toISOString()
        }
    ];
    
    const container = document.getElementById('archive-container');
    
    testTasks.forEach(task => {
        const taskElement = createArchivedTaskElement(task);
        container.appendChild(taskElement);
        
        const restoreBtn = taskElement.querySelector('.restore-task-btn');
        const deleteBtn = taskElement.querySelector('.delete-task-btn');
        
        const restoreAriaLabel = restoreBtn.getAttribute('aria-label');
        const deleteAriaLabel = deleteBtn.getAttribute('aria-label');
        
        const expectedRestoreLabel = `${task.name}を復元`;
        const expectedDeleteLabel = `${task.name}を削除`;
        
        if (restoreAriaLabel === expectedRestoreLabel) {
            results.push({ passed: true, message: `✅ "${task.name}" 復元ボタン: aria-labelが正しく設定されています` });
            console.log(`  ✅ "${task.name}" 復元ボタン: aria-label="${restoreAriaLabel}"`);
        } else {
            results.push({ passed: false, message: `❌ "${task.name}" 復元ボタン: aria-labelが正しくありません（期待値: "${expectedRestoreLabel}", 実際: "${restoreAriaLabel}"）` });
            console.log(`  ❌ "${task.name}" 復元ボタン: 期待値="${expectedRestoreLabel}", 実際="${restoreAriaLabel}"`);
        }
        
        if (deleteAriaLabel === expectedDeleteLabel) {
            results.push({ passed: true, message: `✅ "${task.name}" 削除ボタン: aria-labelが正しく設定されています` });
            console.log(`  ✅ "${task.name}" 削除ボタン: aria-label="${deleteAriaLabel}"`);
        } else {
            results.push({ passed: false, message: `❌ "${task.name}" 削除ボタン: aria-labelが正しくありません（期待値: "${expectedDeleteLabel}", 実際: "${deleteAriaLabel}"）` });
            console.log(`  ❌ "${task.name}" 削除ボタン: 期待値="${expectedDeleteLabel}", 実際="${deleteAriaLabel}"`);
        }
    });
    
    const allPassed = results.every(r => r.passed);
    return {
        passed: allPassed,
        message: allPassed ? '✅ すべてのアーカイブボタンにaria-labelが正しく設定されています' : '❌ 一部のアーカイブボタンのaria-labelが正しくありません',
        details: results
    };
}

function testThemeButtonAriaLabel() {
    const results = [];
    const themeToggleBtn = document.getElementById('theme-toggle');
    
    // ライトモードの状態をテスト
    updateThemeButton('light');
    let ariaLabel = themeToggleBtn.getAttribute('aria-label');
    let expectedLabel = 'ダークモードに切り替え';
    
    if (ariaLabel === expectedLabel) {
        results.push({ passed: true, message: `✅ ライトモード時: aria-labelが正しく設定されています` });
        console.log(`  ✅ ライトモード時: aria-label="${ariaLabel}"`);
    } else {
        results.push({ passed: false, message: `❌ ライトモード時: aria-labelが正しくありません（期待値: "${expectedLabel}", 実際: "${ariaLabel}"）` });
        console.log(`  ❌ ライトモード時: 期待値="${expectedLabel}", 実際="${ariaLabel}"`);
    }
    
    // ダークモードの状態をテスト
    updateThemeButton('dark');
    ariaLabel = themeToggleBtn.getAttribute('aria-label');
    expectedLabel = 'ライトモードに切り替え';
    
    if (ariaLabel === expectedLabel) {
        results.push({ passed: true, message: `✅ ダークモード時: aria-labelが正しく設定されています` });
        console.log(`  ✅ ダークモード時: aria-label="${ariaLabel}"`);
    } else {
        results.push({ passed: false, message: `❌ ダークモード時: aria-labelが正しくありません（期待値: "${expectedLabel}", 実際: "${ariaLabel}"）` });
        console.log(`  ❌ ダークモード時: 期待値="${expectedLabel}", 実際="${ariaLabel}"`);
    }
    
    const allPassed = results.every(r => r.passed);
    return {
        passed: allPassed,
        message: allPassed ? '✅ テーマ切り替えボタンのaria-labelが正しく動的に更新されています' : '❌ テーマ切り替えボタンのaria-labelが正しく更新されていません',
        details: results
    };
}

function displayTestResult(elementId, result) {
    const element = document.getElementById(elementId);
    const className = result.passed ? 'pass' : 'fail';
    
    let html = `<div class="test-result ${className}">
        <strong>${result.message}</strong>
    `;
    
    if (result.details && result.details.length > 0) {
        html += '<ul>';
        result.details.forEach(detail => {
            html += `<li>${detail.message}</li>`;
        });
        html += '</ul>';
    }
    
    html += '</div>';
    element.innerHTML = html;
}
