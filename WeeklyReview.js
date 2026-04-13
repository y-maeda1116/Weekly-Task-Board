/**
 * Weekly Review Module
 * Statistics computation, journal time analysis, Markdown report generation
 * Standalone version with no external dependencies
 */
(function() {
  'use strict';

  var TASKS_KEY = 'weekly-task-board.tasks';
  var JOURNALS_KEY = 'weekly-task-board.journals';

  function loadTasks() {
    try {
      var raw = localStorage.getItem(TASKS_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      console.error('[WeeklyReview] Failed to load tasks', e);
      return [];
    }
  }

  function loadJournals() {
    try {
      var raw = localStorage.getItem(JOURNALS_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      console.error('[WeeklyReview] Failed to load journals', e);
      return [];
    }
  }

  function computeWeekStats(weekStart, weekEnd) {
    var tasks = loadTasks();
    var inWeek = tasks.filter(function(t) {
      return t.assigned_date && t.assigned_date >= weekStart && t.assigned_date <= weekEnd;
    });

    var completed = inWeek.filter(function(t) { return t.completed; });
    var totalEstimated = 0;
    var totalActual = 0;
    var categoryMap = {};
    var perTaskTime = [];

    for (var i = 0; i < inWeek.length; i++) {
      var t = inWeek[i];
      totalEstimated += t.estimated_time || 0;
      totalActual += t.actual_time || 0;

      perTaskTime.push({
        taskId: t.id,
        taskName: t.name,
        estimated: t.estimated_time || 0,
        actual: t.actual_time || 0,
        signifier: t.signifier || null,
        completed: t.completed,
        category: t.category || 'task'
      });

      var cat = t.category || 'task';
      if (!categoryMap[cat]) {
        categoryMap[cat] = { count: 0, estimatedTime: 0, actualTime: 0 };
      }
      categoryMap[cat].count++;
      categoryMap[cat].estimatedTime += t.estimated_time || 0;
      categoryMap[cat].actualTime += t.actual_time || 0;
    }

    return {
      totalTasks: inWeek.length,
      completedTasks: completed.length,
      completionRate: inWeek.length > 0 ? Math.round((completed.length / inWeek.length) * 100) : 0,
      totalEstimatedTime: Math.round(totalEstimated * 10) / 10,
      totalActualTime: Math.round(totalActual * 10) / 10,
      categoryBreakdown: categoryMap,
      perTaskTime: perTaskTime
    };
  }

  function computeJournalTimeStats(weekStart, weekEnd) {
    var journals = loadJournals();
    var totalMinutes = 0;
    var perDayMinutes = {};

    for (var d = 0; d < journals.length; d++) {
      var day = journals[d];
      if (day.date < weekStart || day.date > weekEnd) continue;

      var dayMinutes = 0;
      for (var e = 0; e < day.entries.length; e++) {
        var entry = day.entries[e];
        if (entry.completedAt && entry.startedAt) {
          var start = new Date(entry.startedAt).getTime();
          var end = new Date(entry.completedAt).getTime();
          var diff = Math.round((end - start) / 60000);
          if (diff > 0) dayMinutes += diff;
        }
      }

      if (dayMinutes > 0) {
        perDayMinutes[day.date] = dayMinutes;
        totalMinutes += dayMinutes;
      }
    }

    return {
      totalWorkMinutes: totalMinutes,
      perDayMinutes: perDayMinutes
    };
  }

  function getCompletedTasksForWeek(weekStart, weekEnd) {
    var tasks = loadTasks();
    return tasks.filter(function(t) {
      return t.completed &&
             t.assigned_date &&
             t.assigned_date >= weekStart &&
             t.assigned_date <= weekEnd;
    });
  }

  function formatHours(hours) {
    if (hours === 0) return '0h';
    if (hours < 1) return Math.round(hours * 60) + 'm';
    if (hours % 1 === 0) return hours + 'h';
    var h = Math.floor(hours);
    var m = Math.round((hours - h) * 60);
    return m > 0 ? h + 'h ' + m + 'm' : h + 'h';
  }

  var SIGNIFIER_SYMBOLS = {
    task: '\u30FB', note: '\uFF0D', important: '\uFF01', consider: '\uFF1F', idea: '\u2601'
  };

  function generateMarkdownReport(weekStart, weekEnd, topTaskIds) {
    var stats = computeWeekStats(weekStart, weekEnd);
    var journalStats = computeJournalTimeStats(weekStart, weekEnd);
    var topIdSet = {};
    if (topTaskIds) topTaskIds.forEach(function(id) { topIdSet[id] = true; });

    var lines = [];
    lines.push('## Weekly Report (' + weekStart + ' ~ ' + weekEnd + ')');
    lines.push('');
    lines.push('### Summary');
    lines.push('- Completion rate: ' + stats.completionRate + '%');
    lines.push('- Completed: ' + stats.completedTasks + '/' + stats.totalTasks);
    lines.push('- Estimated time: ' + formatHours(stats.totalEstimatedTime));
    lines.push('- Actual time: ' + formatHours(stats.totalActualTime));
    lines.push('- Journal work time: ' + formatHours(journalStats.totalWorkMinutes / 60));
    lines.push('');

    var completedTasks = getCompletedTasksForWeek(weekStart, weekEnd);
    if (topTaskIds && topTaskIds.length > 0) {
      lines.push('### Top Achievements');
      completedTasks.forEach(function(t) {
        if (topIdSet[t.id]) {
          var sig = t.signifier ? SIGNIFIER_SYMBOLS[t.signifier] + ' ' : '';
          lines.push('- ' + sig + t.name + ' (' + formatHours(t.actual_time) + ')');
        }
      });
      lines.push('');
    }

    if (stats.perTaskTime.length > 0) {
      lines.push('### Per-Task Time');
      lines.push('| Task | Est | Actual | Status |');
      lines.push('|------|-----|--------|--------|');
      stats.perTaskTime.forEach(function(t) {
        var sig = t.signifier ? SIGNIFIER_SYMBOLS[t.signifier] + ' ' : '';
        var status = t.completed ? 'Done' : 'In progress';
        lines.push('| ' + sig + t.taskName + ' | ' + formatHours(t.estimated) + ' | ' + formatHours(t.actual) + ' | ' + status + ' |');
      });
      lines.push('');
    }

    return lines.join('\n');
  }

  function exportToClipboard(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      return navigator.clipboard.writeText(text);
    }
    var textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.left = '-9999px';
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand('copy');
    document.body.removeChild(textarea);
    return Promise.resolve();
  }

  window.HybridWeeklyReview = {
    computeWeekStats: computeWeekStats,
    computeJournalTimeStats: computeJournalTimeStats,
    getCompletedTasksForWeek: getCompletedTasksForWeek,
    generateMarkdownReport: generateMarkdownReport,
    exportToClipboard: exportToClipboard,
    formatHours: formatHours
  };

  console.log('Hybrid weekly review module loaded');
})();
