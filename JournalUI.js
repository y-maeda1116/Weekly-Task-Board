/**
 * Journal UI Module
 * Start buttons, modals, and timeline panel for interstitial journaling
 * Standalone version with no external dependencies
 */
class HybridLogger {
    info(message, ...args) {
        console.log(`[JournalUI] ${message}`, ...args);
    }
    error(message, ...args) {
        console.error(`[JournalUI] ${message}`, ...args);
    }
}
const logger = new HybridLogger();
let buttonAbortController = null;
function getManager() {
    return window.HybridJournalManager;
}
function formatTime(isoString) {
    const d = new Date(isoString);
    return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}
function getTodayString() {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}
// --- Start Button Injection ---
function cleanupStartButtons() {
    document.querySelectorAll('.journal-start-btn').forEach(btn => btn.remove());
    if (buttonAbortController) {
        buttonAbortController.abort();
        buttonAbortController = null;
    }
}
function injectStartButtons() {
    cleanupStartButtons();
    const manager = getManager();
    if (!manager) {
        logger.error('HybridJournalManager not available');
        return;
    }
    const activeEntry = manager.getActiveEntry();
    buttonAbortController = new AbortController();
    const signal = buttonAbortController.signal;
    document.querySelectorAll('.task').forEach(taskEl => {
        const taskId = taskEl.dataset.taskId;
        if (!taskId)
            return;
        if (taskEl.classList.contains('completed'))
            return;
        const btn = document.createElement('button');
        btn.className = 'journal-start-btn';
        btn.type = 'button';
        const isActive = activeEntry && activeEntry.taskId === taskId;
        if (isActive) {
            btn.classList.add('active');
            btn.textContent = '\u25CF 実行中...';
            btn.title = 'ジャーナル実行中';
        }
        else {
            btn.textContent = '\u25B6 開始';
            btn.title = 'このタスクのジャーナルを開始';
        }
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            e.preventDefault();
            handleStartClick(taskId, taskEl);
        }, { signal });
        taskEl.appendChild(btn);
    });
    logger.info('Start buttons injected');
}
function handleStartClick(taskId, taskEl) {
    const manager = getManager();
    if (!manager)
        return;
    const activeEntry = manager.getActiveEntry();
    if (activeEntry && activeEntry.taskId === taskId)
        return;
    if (activeEntry) {
        if (confirm(`現在「${activeEntry.taskName}」を実行中です。\n現在のタスクを完了して新しいタスクを開始しますか？`)) {
            manager.completeEntry(activeEntry.id, '');
        }
        else {
            return;
        }
    }
    const taskName = taskEl.querySelector('.task-name')?.textContent || '不明なタスク';
    const entry = manager.createEntry(taskId, taskName);
    showJournalModal(entry);
    injectStartButtons();
}
// --- Journal Modal ---
function showJournalModal(entry) {
    const existing = document.getElementById('journal-input-modal');
    if (existing)
        existing.remove();
    const overlay = document.createElement('div');
    overlay.id = 'journal-input-modal';
    overlay.className = 'journal-modal-overlay';
    const modal = document.createElement('div');
    modal.className = 'journal-modal';
    const header = document.createElement('div');
    header.className = 'journal-modal-header';
    const titleSpan = document.createElement('span');
    titleSpan.textContent = `\u25B6 「${entry.taskName}」を開始`;
    const timeSpan = document.createElement('span');
    timeSpan.className = 'journal-modal-time';
    timeSpan.textContent = formatTime(entry.startedAt);
    header.appendChild(titleSpan);
    header.appendChild(timeSpan);
    const textarea = document.createElement('textarea');
    textarea.className = 'journal-modal-textarea';
    textarea.placeholder = '今から何に取り掛かりますか？（省略可）';
    textarea.value = entry.journal;
    const actions = document.createElement('div');
    actions.className = 'journal-modal-actions';
    const saveBtn = document.createElement('button');
    saveBtn.className = 'journal-modal-save';
    saveBtn.textContent = '保存';
    saveBtn.addEventListener('click', () => {
        const mgr = getManager();
        if (mgr) {
            mgr.updateJournal(entry.id, textarea.value);
        }
        overlay.remove();
    });
    const skipBtn = document.createElement('button');
    skipBtn.className = 'journal-modal-skip';
    skipBtn.textContent = 'スキップ';
    skipBtn.addEventListener('click', () => {
        overlay.remove();
    });
    actions.appendChild(saveBtn);
    actions.appendChild(skipBtn);
    modal.appendChild(header);
    modal.appendChild(textarea);
    modal.appendChild(actions);
    overlay.appendChild(modal);
    overlay.addEventListener('click', (e) => {
        if (e.target === overlay)
            overlay.remove();
    });
    document.body.appendChild(overlay);
    textarea.focus();
}
// --- Next Step Modal ---
function showNextStepModal(entry, onComplete) {
    const existing = document.getElementById('journal-nextstep-modal');
    if (existing)
        existing.remove();
    const overlay = document.createElement('div');
    overlay.id = 'journal-nextstep-modal';
    overlay.className = 'journal-modal-overlay';
    const modal = document.createElement('div');
    modal.className = 'journal-modal';
    const header = document.createElement('div');
    header.className = 'journal-modal-header';
    const titleSpan = document.createElement('span');
    titleSpan.textContent = `\u25A0 「${entry.taskName}」を完了`;
    const timeSpan = document.createElement('span');
    timeSpan.className = 'journal-modal-time';
    timeSpan.textContent = `${formatTime(entry.startedAt)} - 今`;
    header.appendChild(titleSpan);
    header.appendChild(timeSpan);
    const textarea = document.createElement('textarea');
    textarea.className = 'journal-modal-textarea';
    textarea.placeholder = '次のタスクへの申し送り（省略可）';
    const actions = document.createElement('div');
    actions.className = 'journal-modal-actions';
    const saveBtn = document.createElement('button');
    saveBtn.className = 'journal-modal-save';
    saveBtn.textContent = '保存';
    saveBtn.addEventListener('click', () => {
        const mgr = getManager();
        if (mgr) {
            mgr.completeEntry(entry.id, textarea.value);
        }
        overlay.remove();
        onComplete();
    });
    const skipBtn = document.createElement('button');
    skipBtn.className = 'journal-modal-skip';
    skipBtn.textContent = 'スキップ';
    skipBtn.addEventListener('click', () => {
        const mgr = getManager();
        if (mgr) {
            mgr.completeEntry(entry.id, '');
        }
        overlay.remove();
        onComplete();
    });
    actions.appendChild(saveBtn);
    actions.appendChild(skipBtn);
    modal.appendChild(header);
    modal.appendChild(textarea);
    modal.appendChild(actions);
    overlay.appendChild(modal);
    document.body.appendChild(overlay);
    textarea.focus();
}
// --- Timeline Panel ---
let timelineDate = getTodayString();
function openTimeline() {
    const panel = document.getElementById('journal-timeline-panel');
    if (panel) {
        panel.style.display = 'block';
        renderTimelinePanel();
    }
}
function closeTimeline() {
    const panel = document.getElementById('journal-timeline-panel');
    if (panel) {
        panel.style.display = 'none';
    }
}
function renderTimelinePanel() {
    const content = document.getElementById('journal-timeline-content');
    const datePicker = document.getElementById('journal-date-picker');
    if (!content || !datePicker)
        return;
    datePicker.value = timelineDate;
    const manager = getManager();
    if (!manager)
        return;
    const entries = manager.getEntriesByDate(timelineDate);
    // Clear safely without innerHTML
    while (content.firstChild) {
        content.removeChild(content.firstChild);
    }
    if (entries.length === 0) {
        const empty = document.createElement('div');
        empty.className = 'journal-timeline-empty';
        empty.textContent = 'この日のジャーナルはありません';
        content.appendChild(empty);
        return;
    }
    const sorted = [...entries].sort((a, b) => a.startedAt.localeCompare(b.startedAt));
    sorted.forEach((entry, index) => {
        // 空白時間ラベルの挿入
        if (index > 0) {
            const prev = sorted[index - 1];
            if (prev.completedAt) {
                const gapMs = new Date(entry.startedAt).getTime() - new Date(prev.completedAt).getTime();
                const gapMin = Math.floor(gapMs / 60000);
                if (gapMin >= 15) {
                    const gapLabel = document.createElement('div');
                    gapLabel.className = 'journal-timeline-gap';
                    gapLabel.textContent = `\u2615 休憩/割り込み: ${gapMin}分`;
                    content.appendChild(gapLabel);
                }
            }
        }
        const entryEl = document.createElement('div');
        entryEl.className = 'journal-timeline-entry';
        const isCompleted = entry.completedAt !== null;
        const timeRange = isCompleted
            ? `${formatTime(entry.startedAt)} - ${formatTime(entry.completedAt)}`
            : `${formatTime(entry.startedAt)} - ...`;
        const timeDiv = document.createElement('div');
        timeDiv.className = 'journal-timeline-time';
        timeDiv.textContent = timeRange;
        const bodyDiv = document.createElement('div');
        bodyDiv.className = 'journal-timeline-body';
        const titleDiv = document.createElement('div');
        titleDiv.className = 'journal-timeline-title';
        const iconSpan = document.createElement('span');
        iconSpan.className = 'journal-timeline-icon';
        iconSpan.textContent = isCompleted ? '\u25A0' : '\u25CF';
        titleDiv.appendChild(iconSpan);
        titleDiv.appendChild(document.createTextNode(`${isCompleted ? '完了' : '実行中'}: 「${entry.taskName}」`));
        bodyDiv.appendChild(titleDiv);
        if (entry.journal) {
            const journalDiv = document.createElement('div');
            journalDiv.className = 'journal-timeline-journal';
            journalDiv.textContent = entry.journal;
            bodyDiv.appendChild(journalDiv);
        }
        if (isCompleted && entry.nextStep) {
            const nextStepDiv = document.createElement('div');
            nextStepDiv.className = 'journal-timeline-nextstep';
            nextStepDiv.textContent = `\u27A1 Next Step: ${entry.nextStep}`;
            bodyDiv.appendChild(nextStepDiv);
        }
        entryEl.appendChild(timeDiv);
        entryEl.appendChild(bodyDiv);
        content.appendChild(entryEl);
    });
}
function navigateTimeline(delta) {
    const d = new Date(timelineDate);
    d.setDate(d.getDate() + delta);
    timelineDate = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    renderTimelinePanel();
}
function initTimelineControls() {
    const prevBtn = document.getElementById('journal-prev-day');
    const nextBtn = document.getElementById('journal-next-day');
    const closeBtn = document.getElementById('close-journal-timeline');
    prevBtn?.addEventListener('click', () => navigateTimeline(-1));
    nextBtn?.addEventListener('click', () => navigateTimeline(1));
    closeBtn?.addEventListener('click', closeTimeline);
}
const JournalUI = {
    injectStartButtons,
    cleanupStartButtons,
    showJournalModal,
    showNextStepModal,
    renderTimelinePanel,
    openTimeline,
    closeTimeline,
    initTimelineControls,
};

window.HybridJournalUI = JournalUI;
console.log('Journal UI module loaded');
