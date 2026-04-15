/**
 * Task Migration Module
 * Bullet Journal task migration (move incomplete tasks to next week/day)
 * Standalone version with no external dependencies
 */
(function() {
  'use strict';

  var STORAGE_KEY = 'weekly-task-board.tasks';

  function generateId() {
    return 'task-' + Date.now() + '-' + Math.random().toString(36).substring(2, 11);
  }

  function loadTasks() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      console.error('[Migration] Failed to load tasks', e);
      return [];
    }
  }

  function saveTasks(tasks) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
    } catch (e) {
      console.error('[Migration] Failed to save tasks', e);
    }
  }

  function addDays(dateStr, days) {
    var d = new Date(dateStr + 'T00:00:00');
    d.setDate(d.getDate() + days);
    var y = d.getFullYear();
    var m = String(d.getMonth() + 1).padStart(2, '0');
    var day = String(d.getDate()).padStart(2, '0');
    return y + '-' + m + '-' + day;
  }

  function getIncompleteTasksForWeek(weekStart, weekEnd) {
    var tasks = loadTasks();
    return tasks.filter(function(t) {
      return !t.completed &&
             t.assigned_date &&
             t.assigned_date >= weekStart &&
             t.assigned_date <= weekEnd;
    });
  }

  function migrateTasks(taskIds, dayOffset) {
    if (!taskIds || taskIds.length === 0) return 0;

    var tasks = loadTasks();
    var idSet = {};
    taskIds.forEach(function(id) { idSet[id] = true; });
    var migratedCount = 0;

    var updatedTasks = [];

    for (var i = 0; i < tasks.length; i++) {
      var task = tasks[i];

      if (idSet[task.id] && !task.completed) {
        // Mark original as migrated
        var migrated = Object.assign({}, task, {
          name: '> ' + task.name,
          completed: true
        });
        updatedTasks.push(migrated);

        // Create copy at destination
        var newDate = dayOffset !== null
          ? addDays(task.assigned_date || task.date, dayOffset)
          : null;

        var copy = Object.assign({}, task, {
          id: generateId(),
          name: task.name.replace(/^>\s*/, ''),
          assigned_date: newDate,
          date: newDate || task.date,
          completed: false,
          actual_time: 0
        });
        updatedTasks.push(copy);
        migratedCount++;
      } else {
        updatedTasks.push(task);
      }
    }

    saveTasks(updatedTasks);
    console.log('[Migration] Migrated ' + migratedCount + ' tasks');
    return migratedCount;
  }

  function migrateTasksToNextWeek(taskIds) {
    return migrateTasks(taskIds, 7);
  }

  function migrateTasksToNextDay(taskIds) {
    return migrateTasks(taskIds, 1);
  }

  function migrateTasksToUnassigned(taskIds) {
    if (!taskIds || taskIds.length === 0) return 0;

    var tasks = loadTasks();
    var idSet = {};
    taskIds.forEach(function(id) { idSet[id] = true; });
    var migratedCount = 0;

    var updatedTasks = [];

    for (var i = 0; i < tasks.length; i++) {
      var task = tasks[i];

      if (idSet[task.id] && !task.completed) {
        // Create copy in unassigned (original is removed)
        var copy = Object.assign({}, task, {
          id: generateId(),
          name: task.name.replace(/^>\s*/, ''),
          assigned_date: null,
          completed: false,
          actual_time: 0
        });
        updatedTasks.push(copy);
        migratedCount++;
      } else {
        updatedTasks.push(task);
      }
    }

    saveTasks(updatedTasks);
    console.log('[Migration] Migrated ' + migratedCount + ' tasks to unassigned');
    return migratedCount;
  }

  window.HybridTaskMigration = {
    getIncompleteTasksForWeek: getIncompleteTasksForWeek,
    migrateTasksToNextWeek: migrateTasksToNextWeek,
    migrateTasksToNextDay: migrateTasksToNextDay,
    migrateTasksToUnassigned: migrateTasksToUnassigned
  };

  console.log('Hybrid task migration module loaded');
})();
