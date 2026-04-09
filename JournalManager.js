/**
 * Journal Manager Module
 * Interstitial journaling data CRUD and localStorage persistence
 * Standalone version with no external dependencies
 */

const STORAGE_KEY = 'weekly-task-board.journals';

class HybridLogger {
    info(message, ...args) {
        console.log(`[JournalManager] ${message}`, ...args);
    }
    error(message, ...args) {
        console.error(`[JournalManager] ${message}`, ...args);
    }
}

const logger = new HybridLogger();

function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substring(2, 9);
}

function getTodayString() {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}

function getDayKey(isoString) {
    return isoString.substring(0, 10);
}

function loadAll() {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return [];
        return JSON.parse(raw);
    } catch (e) {
        logger.error('Failed to load journals', e);
        return [];
    }
}

function saveAll(journals) {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(journals));
    } catch (e) {
        logger.error('Failed to save journals', e);
    }
}

function findOrCreateDay(journals, date) {
    let day = journals.find(d => d.date === date);
    if (!day) {
        day = { date, entries: [] };
        journals.push(day);
    }
    return day;
}

function closeStaleEntries() {
    const today = getTodayString();
    const journals = loadAll();
    let changed = false;

    for (const day of journals) {
        for (const entry of day.entries) {
            if (entry.completedAt === null) {
                const entryDate = getDayKey(entry.startedAt);
                if (entryDate < today) {
                    entry.completedAt = `${entryDate}T23:59:59`;
                    changed = true;
                    logger.info(`Auto-closed stale entry: ${entry.id} (${entry.taskName})`);
                }
            }
        }
    }

    if (changed) {
        saveAll(journals);
    }
}

function createEntry(taskId, taskName) {
    const now = new Date().toISOString();
    const entry = {
        id: generateId(),
        taskId,
        taskName,
        startedAt: now,
        completedAt: null,
        journal: '',
        nextStep: '',
        isManual: false,
    };

    const dateKey = getDayKey(now);
    const journals = loadAll();
    const day = findOrCreateDay(journals, dateKey);
    day.entries.push(entry);
    saveAll(journals);

    logger.info(`Created entry: ${entry.id} for task "${taskName}"`);
    return { ...entry };
}

function completeEntry(entryId, nextStep) {
    const journals = loadAll();
    for (const day of journals) {
        const entry = day.entries.find(e => e.id === entryId);
        if (entry && entry.completedAt === null) {
            entry.completedAt = new Date().toISOString();
            entry.nextStep = nextStep;
            saveAll(journals);
            logger.info(`Completed entry: ${entryId}`);
            return;
        }
    }
    logger.error(`Entry not found or already completed: ${entryId}`);
}

function updateJournal(entryId, text) {
    const journals = loadAll();
    for (const day of journals) {
        const entry = day.entries.find(e => e.id === entryId);
        if (entry) {
            entry.journal = text;
            saveAll(journals);
            return;
        }
    }
}

function getEntriesByDate(date) {
    const journals = loadAll();
    const day = journals.find(d => d.date === date);
    return day ? day.entries.map(e => ({ ...e })) : [];
}

function getActiveEntry() {
    const journals = loadAll();
    for (const day of journals) {
        for (const entry of day.entries) {
            if (entry.completedAt === null) {
                return { ...entry };
            }
        }
    }
    return null;
}

function getEntryByTaskId(taskId) {
    const journals = loadAll();
    for (const day of journals) {
        const entry = day.entries.find(e => e.taskId === taskId && e.completedAt === null);
        if (entry) return { ...entry };
    }
    return null;
}

function initialize() {
    logger.info('Initializing JournalManager...');
    closeStaleEntries();
}

const JournalManager = {
    initialize,
    createEntry,
    completeEntry,
    updateJournal,
    getEntriesByDate,
    getActiveEntry,
    getEntryByTaskId,
    closeStaleEntries,
};

window.HybridJournalManager = JournalManager;
console.log('Journal manager module loaded');
