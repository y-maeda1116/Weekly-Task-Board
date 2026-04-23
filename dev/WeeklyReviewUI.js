/**
 * Weekly Review UI Module
 * Review panel rendering and interaction
 * Standalone version with no external dependencies
 */
(function() {
  'use strict';

  var selectedAchievements = [];

  function getManager() {
    return window.HybridWeeklyReview;
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

  function getWeekRange() {
    var monday = window.getMonday ? window.getMonday(window.currentDate || new Date()) : null;
    if (!monday) {
      var d = new Date();
      var day = d.getDay();
      var diff = d.getDate() - day + (day === 0 ? -6 : 1);
      monday = new Date(d.setDate(diff));
      monday.setHours(0, 0, 0, 0);
    }
    var endDate = new Date(monday);
    endDate.setDate(monday.getDate() + 6);

    var fmt = function(dt) {
      return dt.getFullYear() + '-' + String(dt.getMonth() + 1).padStart(2, '0') + '-' + String(dt.getDate()).padStart(2, '0');
    };
    return { start: fmt(monday), end: fmt(endDate) };
  }

  function openReviewPanel() {
    var panel = document.getElementById('review-panel');
    if (!panel) return;

    var mgr = getManager();
    if (!mgr) return;

    var range = getWeekRange();
    var stats = mgr.computeWeekStats(range.start, range.end);
    var journalStats = mgr.computeJournalTimeStats(range.start, range.end);
    var completed = mgr.getCompletedTasksForWeek(range.start, range.end);

    selectedAchievements = [];

    renderStats(stats);
    renderJournalTime(journalStats, range.start, range.end);
    renderAchievementSelector(completed);
    renderTaskTimeTable(stats.perTaskTime);

    var rangeEl = document.getElementById('review-week-range');
    if (rangeEl) rangeEl.textContent = range.start + ' ~ ' + range.end;

    panel.style.display = 'block';
  }

  function closeReviewPanel() {
    var panel = document.getElementById('review-panel');
    if (panel) panel.style.display = 'none';
  }

  function renderStats(stats) {
    var container = document.getElementById('review-stats');
    if (!container) return;

    while (container.firstChild) container.removeChild(container.firstChild);

    var cards = [
      { label: '\u5B8C\u4E86\u7387', value: stats.completionRate + '%', color: '#27ae60' },
      { label: '\u5B8C\u4E86\u30BF\u30B9\u30AF', value: stats.completedTasks + '/' + stats.totalTasks, color: '#3498db' },
      { label: '\u898B\u7A4D\u6642\u9593', value: formatHours(stats.totalEstimatedTime), color: '#f39c12' },
      { label: '\u5B9F\u7E3E\u6642\u9593', value: formatHours(stats.totalActualTime), color: '#9b59b6' }
    ];

    cards.forEach(function(c) {
      var card = document.createElement('div');
      card.className = 'review-stat-card';
      card.style.background = 'linear-gradient(135deg, ' + c.color + ', ' + c.color + 'cc)';

      var value = document.createElement('span');
      value.className = 'review-stat-value';
      value.textContent = c.value;

      var label = document.createElement('span');
      label.className = 'review-stat-label';
      label.textContent = c.label;

      card.appendChild(value);
      card.appendChild(label);
      container.appendChild(card);
    });
  }

  function renderJournalTime(journalStats, weekStart, weekEnd) {
    var container = document.getElementById('review-journal-time');
    if (!container) return;

    while (container.firstChild) container.removeChild(container.firstChild);

    var totalEl = document.createElement('div');
    totalEl.className = 'review-journal-total';
    totalEl.textContent = '\u23F1 \u30B8\u30E3\u30FC\u30CA\u30EB\u4F5C\u696D\u6642\u9593: ' + formatHours(journalStats.totalWorkMinutes / 60);
    container.appendChild(totalEl);

    var days = Object.keys(journalStats.perDayMinutes).sort();
    if (days.length > 0) {
      var dayList = document.createElement('div');
      dayList.className = 'review-journal-days';

      days.forEach(function(dateStr) {
        var min = journalStats.perDayMinutes[dateStr];
        var item = document.createElement('div');
        item.className = 'review-journal-day-item';
        item.textContent = dateStr + ': ' + formatHours(min / 60);
        dayList.appendChild(item);
      });

      container.appendChild(dayList);
    }
  }

  function renderAchievementSelector(completedTasks) {
    var container = document.getElementById('review-achievement-list');
    if (!container) return;

    while (container.firstChild) container.removeChild(container.firstChild);

    if (completedTasks.length === 0) {
      var empty = document.createElement('p');
      empty.className = 'review-hint';
      empty.textContent = '\u5B8C\u4E86\u30BF\u30B9\u30AF\u304C\u3042\u308A\u307E\u305B\u3093';
      container.appendChild(empty);
      return;
    }

    completedTasks.forEach(function(task) {
      var item = document.createElement('div');
      item.className = 'review-achievement-item';
      item.dataset.taskId = task.id;

      var cb = document.createElement('input');
      cb.type = 'checkbox';
      cb.dataset.taskId = task.id;
      cb.disabled = false;

      var sig = task.signifier ? SIGNIFIER_SYMBOLS[task.signifier] + ' ' : '';
      var timeStr = task.actual_time > 0 ? ' (' + formatHours(task.actual_time) + ')' : '';

      var label = document.createElement('span');
      label.textContent = sig + task.name + timeStr;

      cb.addEventListener('change', function() {
        if (cb.checked) {
          if (selectedAchievements.length >= 3) {
            cb.checked = false;
            return;
          }
          selectedAchievements.push(task.id);
          item.classList.add('selected');
        } else {
          selectedAchievements = selectedAchievements.filter(function(id) { return id !== task.id; });
          item.classList.remove('selected');
        }
      });

      item.appendChild(cb);
      item.appendChild(label);

      item.addEventListener('click', function(e) {
        if (e.target !== cb) cb.click();
      });

      container.appendChild(item);
    });
  }

  function renderTaskTimeTable(perTaskTime) {
    var container = document.getElementById('review-task-time-table');
    if (!container) return;

    while (container.firstChild) container.removeChild(container.firstChild);

    if (perTaskTime.length === 0) {
      var empty = document.createElement('p');
      empty.className = 'review-hint';
      empty.textContent = '\u30BF\u30B9\u30AF\u304C\u3042\u308A\u307E\u305B\u3093';
      container.appendChild(empty);
      return;
    }

    var table = document.createElement('table');
    table.className = 'review-task-time-table';

    var thead = document.createElement('thead');
    var headerRow = document.createElement('tr');
    ['Task', 'Est', 'Actual', 'Status'].forEach(function(text) {
      var th = document.createElement('th');
      th.textContent = text;
      headerRow.appendChild(th);
    });
    thead.appendChild(headerRow);
    table.appendChild(thead);

    var tbody = document.createElement('tbody');
    var sorted = perTaskTime.slice().sort(function(a, b) {
      return (b.actual || 0) - (a.actual || 0);
    });

    sorted.forEach(function(t) {
      var row = document.createElement('tr');
      var sig = t.signifier ? SIGNIFIER_SYMBOLS[t.signifier] + ' ' : '';

      var nameCell = document.createElement('td');
      nameCell.textContent = sig + t.taskName;

      var estCell = document.createElement('td');
      estCell.textContent = formatHours(t.estimated);

      var actCell = document.createElement('td');
      actCell.textContent = formatHours(t.actual);

      var statusCell = document.createElement('td');
      var badge = document.createElement('span');
      badge.className = 'review-status-badge ' + (t.completed ? 'completed' : 'in-progress');
      badge.textContent = t.completed ? 'Done' : 'WIP';
      statusCell.appendChild(badge);

      row.appendChild(nameCell);
      row.appendChild(estCell);
      row.appendChild(actCell);
      row.appendChild(statusCell);
      tbody.appendChild(row);
    });

    table.appendChild(tbody);
    container.appendChild(table);
  }

  function handleExport() {
    var mgr = getManager();
    if (!mgr) return;

    var range = getWeekRange();
    var markdown = mgr.generateMarkdownReport(range.start, range.end, selectedAchievements);

    mgr.exportToClipboard(markdown).then(function() {
      var btn = document.getElementById('review-export-btn');
      if (btn) {
        var originalText = btn.textContent;
        btn.textContent = '\u2713 \u30B3\u30D4\u30FC\u6E08\u307F!';
        btn.style.background = '#27ae60';
        btn.style.color = '#fff';
        setTimeout(function() {
          btn.textContent = originalText;
          btn.style.background = '';
          btn.style.color = '';
        }, 2000);
      }
    });
  }

  function initialize() {
    var toggleBtn = document.getElementById('review-toggle');
    var closeBtn = document.getElementById('close-review');
    var exportBtn = document.getElementById('review-export-btn');

    if (toggleBtn) {
      toggleBtn.addEventListener('click', openReviewPanel);
    }
    if (closeBtn) {
      closeBtn.addEventListener('click', closeReviewPanel);
    }
    if (exportBtn) {
      exportBtn.addEventListener('click', handleExport);
    }

    var panel = document.getElementById('review-panel');
    if (panel) {
      panel.addEventListener('click', function(e) {
        if (e.target === panel) closeReviewPanel();
      });
    }

    console.log('[WeeklyReviewUI] Initialized');
  }

  window.HybridWeeklyReviewUI = {
    openReviewPanel: openReviewPanel,
    closeReviewPanel: closeReviewPanel,
    initialize: initialize
  };

  // Self-initialize: this module loads after script.js via defer
  initialize();

  console.log('Hybrid weekly review UI module loaded');
})();
