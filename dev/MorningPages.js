/**
 * Morning Pages Module
 * Brain detox: save free-writing pages, extract TODO items, bulk-register tasks
 * Standalone version with no external dependencies
 */
(function() {
  'use strict';

  var PAGES_KEY = 'weekly-task-board.morning-pages';
  var TASKS_KEY = 'weekly-task-board.tasks';
  var SETTINGS_KEY = 'weekly-task-board.settings';

  function getTodayString() {
    var now = new Date();
    return now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0') + '-' + String(now.getDate()).padStart(2, '0');
  }

  function generateId() {
    return 'mp-' + Date.now().toString(36) + Math.random().toString(36).substring(2, 9);
  }

  function generateTaskId() {
    return 'task-' + Date.now() + '-' + Math.random().toString(36).substring(2, 11);
  }

  function loadPages() {
    try {
      var raw = localStorage.getItem(PAGES_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      console.error('[MorningPages] Failed to load pages', e);
      return [];
    }
  }

  function savePages(pages) {
    try {
      localStorage.setItem(PAGES_KEY, JSON.stringify(pages));
    } catch (e) {
      console.error('[MorningPages] Failed to save pages', e);
    }
  }

  function savePage(date, content) {
    var pages = loadPages();
    var existing = null;
    var existingIndex = -1;

    for (var i = 0; i < pages.length; i++) {
      if (pages[i].date === date) {
        existing = pages[i];
        existingIndex = i;
        break;
      }
    }

    var entry = {
      id: existing ? existing.id : generateId(),
      date: date,
      content: content,
      createdAt: existing ? existing.createdAt : new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    if (existingIndex >= 0) {
      pages[existingIndex] = entry;
    } else {
      pages.push(entry);
    }

    savePages(pages);
    console.log('[MorningPages] Saved page for ' + date);
    return entry;
  }

  function getPage(date) {
    var pages = loadPages();
    for (var i = 0; i < pages.length; i++) {
      if (pages[i].date === date) return pages[i];
    }
    return null;
  }

  function extractTodoItems(content) {
    if (!content) return [];
    var lines = content.split('\n');
    var items = [];

    for (var i = 0; i < lines.length; i++) {
      var line = lines[i].trim();
      if (!line) continue;

      // Match [something] pattern
      var bracketMatch = line.match(/\[([^\]]+)\]/);
      if (bracketMatch) {
        var text = bracketMatch[1].trim();
        if (text) items.push(text);
        continue;
      }

      // Match TODO: something pattern
      var todoMatch = line.match(/^TODO:\s*(.+)$/i);
      if (todoMatch) {
        var todoText = todoMatch[1].trim();
        if (todoText) items.push(todoText);
      }
    }

    return items;
  }

  function bulkRegisterTasks(items, targetDate) {
    if (!items || items.length === 0) return 0;

    var raw = localStorage.getItem(TASKS_KEY);
    var tasks = raw ? JSON.parse(raw) : [];
    var date = targetDate || getTodayString();
    var count = 0;

    for (var i = 0; i < items.length; i++) {
      var task = {
        id: generateTaskId() + '-' + i,
        name: items[i],
        estimated_time: 0,
        actual_time: 0,
        completed: false,
        priority: 'medium',
        category: 'task',
        date: date,
        assigned_date: targetDate ? date : null,
        due_date: null,
        due_time_period: null,
        due_hour: null,
        details: '',
        is_recurring: false,
        recurrence_pattern: null,
        recurrence_end_date: null,
        signifier: 'task'
      };
      tasks.push(task);
      count++;
    }

    localStorage.setItem(TASKS_KEY, JSON.stringify(tasks));
    console.log('[MorningPages] Registered ' + count + ' tasks');
    return count;
  }

  function shouldShowOnLaunch() {
    try {
      var raw = localStorage.getItem(SETTINGS_KEY);
      if (!raw) return false;
      var settings = JSON.parse(raw);
      if (!settings.morningPageEnabled) return false;

      var today = getTodayString();
      var page = getPage(today);
      return !page;
    } catch (e) {
      return false;
    }
  }

  function isMorningPageEnabled() {
    try {
      var raw = localStorage.getItem(SETTINGS_KEY);
      if (!raw) return false;
      var settings = JSON.parse(raw);
      return !!settings.morningPageEnabled;
    } catch (e) {
      return false;
    }
  }

  function setMorningPageEnabled(enabled) {
    try {
      var raw = localStorage.getItem(SETTINGS_KEY);
      var settings = raw ? JSON.parse(raw) : {};
      settings.morningPageEnabled = !!enabled;
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
      console.log('[MorningPages] Setting updated: ' + enabled);
    } catch (e) {
      console.error('[MorningPages] Failed to update setting', e);
    }
  }

  window.HybridMorningPages = {
    savePage: savePage,
    getPage: getPage,
    extractTodoItems: extractTodoItems,
    bulkRegisterTasks: bulkRegisterTasks,
    shouldShowOnLaunch: shouldShowOnLaunch,
    isMorningPageEnabled: isMorningPageEnabled,
    setMorningPageEnabled: setMorningPageEnabled
  };

  console.log('Hybrid morning pages module loaded');
})();
