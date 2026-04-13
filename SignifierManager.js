/**
 * Signifier Manager Module
 * Bullet Journal signifier cycling and persistence
 * Standalone version with no external dependencies
 */
(function() {
  'use strict';

  var SIGNIFIER_ORDER = [null, 'task', 'note', 'important', 'consider', 'idea'];
  var SIGNIFIER_SYMBOLS = {
    task: '\u30FB',
    note: '\uFF0D',
    important: '\uFF01',
    consider: '\uFF1F',
    idea: '\u2601'
  };
  var SIGNIFIER_LABELS = {
    task: '\u30BF\u30B9\u30AF',
    note: '\u30E1\u30E2',
    important: '\u91CD\u8981',
    consider: '\u691C\u8A0E',
    idea: '\u30A2\u30A4\u30C7\u30A2'
  };

  var STORAGE_KEY = 'weekly-task-board.tasks';

  function cycleSignifier(current) {
    var index = SIGNIFIER_ORDER.indexOf(current);
    return SIGNIFIER_ORDER[(index + 1) % SIGNIFIER_ORDER.length];
  }

  function getSignifierSymbol(signifier) {
    if (!signifier) return '';
    return SIGNIFIER_SYMBOLS[signifier] || '';
  }

  function getSignifierLabel(signifier) {
    if (!signifier) return '';
    return SIGNIFIER_LABELS[signifier] || '';
  }

  function updateTaskSignifier(taskId, signifier) {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return false;
      var tasks = JSON.parse(raw);
      var index = -1;
      for (var i = 0; i < tasks.length; i++) {
        if (tasks[i].id === taskId) { index = i; break; }
      }
      if (index === -1) return false;

      tasks[index] = Object.assign({}, tasks[index], { signifier: signifier });
      localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));

      console.log('[Signifier] Updated: ' + taskId + ' -> ' + signifier);
      return true;
    } catch (e) {
      console.error('[Signifier] Failed to update signifier', e);
      return false;
    }
  }

  window.HybridSignifierManager = {
    cycleSignifier: cycleSignifier,
    getSignifierSymbol: getSignifierSymbol,
    getSignifierLabel: getSignifierLabel,
    updateTaskSignifier: updateTaskSignifier,
    SIGNIFIER_ORDER: SIGNIFIER_ORDER,
    SIGNIFIER_SYMBOLS: SIGNIFIER_SYMBOLS,
    SIGNIFIER_LABELS: SIGNIFIER_LABELS
  };

  console.log('Hybrid signifier manager module loaded');
})();
