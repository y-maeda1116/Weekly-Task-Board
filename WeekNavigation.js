/**
 * Week Navigation Module
 * Type-safe week navigation and date functions
 * Standalone version with no external dependencies
 */
/**
 * Simple logger class
 */
class HybridLogger {
    info(message, ...args) {
        console.log(`[WeekNav] ${message}`, ...args);
    }
    warn(message, ...args) {
        console.warn(`[WeekNav] ${message}`, ...args);
    }
    error(message, ...args) {
        console.error(`[WeekNav] ${message}`, ...args);
    }
}
const logger = new HybridLogger();
/**
 * Global week state
 */
const weekState = {
    currentDate: new Date(),
    weekOffset: 0,
    mondayDate: null
};
/**
 * Get Monday of the week for a given date
 */
function getMonday(date) {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(d.setDate(diff));
}
/**
 * Format date as YYYY-MM-DD
 */
function formatDate(date) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
}
/**
 * Format date for display (Japanese format)
 */
function formatDateDisplay(date) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}年${m}月${d}日`;
}
/**
 * Get week start (Monday) and end (Sunday) dates
 */
function getWeekRange(date) {
    const monday = getMonday(date);
    const sunday = new Date(monday);
    sunday.setDate(sunday.getDate() + 6);
    return { start: monday, end: sunday };
}
/**
 * Format week range for display
 */
function formatWeekRange(startDate, endDate) {
    const startMonth = startDate.getMonth() + 1;
    const endMonth = endDate.getMonth() + 1;
    const startDay = startDate.getDate();
    const endDay = endDate.getDate();
    if (startMonth === endMonth) {
        return `${startDate.getFullYear()}年${startMonth}月${startDay}日〜${endDay}日`;
    }
    else {
        return `${startDate.getFullYear()}年${startMonth}月${startDay}日〜${endMonth}月${endDay}日`;
    }
}
/**
 * Get date for a specific weekday in the current week
 */
function getDateForWeekday(weekday) {
    if (!weekState.mondayDate) {
        return null;
    }
    const date = new Date(weekState.mondayDate);
    const weekdayMap = {
        monday: 0,
        tuesday: 1,
        wednesday: 2,
        thursday: 3,
        friday: 4,
        saturday: 5,
        sunday: 6
    };
    date.setDate(date.getDate() + weekdayMap[weekday]);
    return date;
}
/**
 * Navigate to previous week
 */
function previousWeek() {
    weekState.weekOffset -= 1;
    weekState.currentDate = new Date(weekState.currentDate.getTime() - 7 * 24 * 60 * 60 * 1000);
    updateWeekDisplay();
    logger.info(`Navigated to previous week (offset: ${weekState.weekOffset})`);
}
/**
 * Navigate to current week
 */
function currentWeek() {
    weekState.weekOffset = 0;
    weekState.currentDate = new Date();
    updateWeekDisplay();
    logger.info('Navigated to current week');
}
/**
 * Navigate to next week
 */
function nextWeek() {
    weekState.weekOffset += 1;
    weekState.currentDate = new Date(weekState.currentDate.getTime() + 7 * 24 * 60 * 60 * 1000);
    updateWeekDisplay();
    logger.info(`Navigated to next week (offset: ${weekState.weekOffset})`);
}
/**
 * Navigate to specific week by date
 */
function goToWeek(date) {
    const monday = getMonday(date);
    weekState.currentDate = new Date(monday);
    weekState.mondayDate = monday;
    // Calculate week offset
    const today = new Date();
    const todayMonday = getMonday(today);
    const diffTime = monday.getTime() - todayMonday.getTime();
    weekState.weekOffset = Math.round(diffTime / (7 * 24 * 60 * 60 * 1000));
    updateWeekDisplay();
    logger.info(`Navigated to week of ${formatDate(date)}`);
}
/**
 * Update week display in the UI
 */
function updateWeekDisplay() {
    const weekRange = getWeekRange(weekState.currentDate);
    const weekTitle = document.getElementById('week-title');
    const datePicker = document.getElementById('date-picker');
    if (weekTitle) {
        weekTitle.textContent = formatWeekRange(weekRange.start, weekRange.end);
    }
    if (datePicker) {
        datePicker.value = formatDate(weekRange.start);
    }
    // Update day columns with correct dates
    updateDayColumnDates();
}
/**
 * Update day column dates
 */
function updateDayColumnDates() {
    const weekdayIds = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
    weekdayIds.forEach(weekdayId => {
        const column = document.getElementById(weekdayId);
        const date = getDateForWeekday(weekdayId);
        if (column && date) {
            // Store the date as data attribute for task operations
            column.dataset.date = formatDate(date);
            // Update the day column title with date
            const header = column.querySelector('h3');
            if (header) {
                const weekdayName = getWeekdayDisplayName(weekdayId);
                const dateStr = `${date.getMonth() + 1}/${date.getDate()}`;
                header.textContent = `${weekdayName} ${dateStr}`;
            }
        }
    });
}
/**
 * Get weekday display name (Japanese)
 */
function getWeekdayDisplayName(weekday) {
    const names = {
        monday: '月曜日',
        tuesday: '火曜日',
        wednesday: '水曜日',
        thursday: '木曜日',
        friday: '金曜日',
        saturday: '土曜日',
        sunday: '日曜日'
    };
    return names[weekday] || weekday;
}
/**
 * Get weekday ID from date
 */
function getWeekdayId(date) {
    const day = date.getDay();
    const weekdayIds = {
        1: 'monday',
        2: 'tuesday',
        3: 'wednesday',
        4: 'thursday',
        5: 'friday',
        6: 'saturday',
        0: 'sunday'
    };
    return weekdayIds[day] || null;
}
/**
 * Get current week offset
 */
function getWeekOffset() {
    return weekState.weekOffset;
}
/**
 * Get current date
 */
function getCurrentDate() {
    return new Date(weekState.currentDate);
}
/**
 * Get Monday of current week
 */
function getMondayDate() {
    return weekState.mondayDate ? new Date(weekState.mondayDate) : null;
}
/**
 * Check if date is in current week
 */
function isDateInCurrentWeek(date) {
    if (!weekState.mondayDate) {
        return false;
    }
    const weekRange = getWeekRange(weekState.currentDate);
    const checkDate = new Date(date);
    checkDate.setHours(0, 0, 0, 0);
    const startDate = new Date(weekRange.start);
    startDate.setHours(0, 0, 0, 0);
    const endDate = new Date(weekRange.end);
    endDate.setHours(23, 59, 59, 999);
    return checkDate >= startDate && checkDate <= endDate;
}
/**
 * Get date string for a specific weekday
 */
function getDateStringForWeekday(weekday) {
    const date = getDateForWeekday(weekday);
    return date ? formatDate(date) : null;
}
/**
 * Initialize week navigation
 */
function initializeWeekNavigation() {
    weekState.currentDate = new Date();
    weekState.mondayDate = getMonday(weekState.currentDate);
    weekState.weekOffset = 0;
    updateWeekDisplay();
    logger.info('Week navigation initialized');
    return true;
}
/**
 * Public API
 */
const WeekNavigation = {
    // Navigation
    previousWeek,
    currentWeek,
    nextWeek,
    goToWeek,
    // Getters
    getWeekOffset,
    getCurrentDate,
    getMondayDate,
    getWeekRange,
    getDateForWeekday,
    getDateStringForWeekday,
    getWeekdayId,
    getWeekdayDisplayName,
    // Utilities
    formatDate,
    formatDateDisplay,
    formatWeekRange,
    isDateInCurrentWeek,
    // Initialization
    initializeWeekNavigation,
    updateWeekDisplay,
    updateDayColumnDates
};
// Expose to window for use by existing script.js
window.HybridWeekNavigation = WeekNavigation;
console.log('Hybrid week navigation module loaded');
