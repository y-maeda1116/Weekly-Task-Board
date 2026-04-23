/**
 * Morning Pages UI Module
 * Full-screen editor, TODO extraction preview, task registration flow
 * Standalone version with no external dependencies
 */
(function() {
  'use strict';

  function getMgr() {
    return window.HybridMorningPages;
  }

  function getTodayString() {
    var now = new Date();
    return now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0') + '-' + String(now.getDate()).padStart(2, '0');
  }

  function getDayLabel(dateStr) {
    var d = new Date(dateStr + 'T00:00:00');
    var weekdays = ['日', '月', '火', '水', '木', '金', '土'];
    return (d.getMonth() + 1) + '/' + d.getDate() + '(' + weekdays[d.getDay()] + ')';
  }

  function updateWordCount(textarea, countEl) {
    var text = textarea.value;
    var chars = text.length;
    var words = text.trim() ? text.trim().split(/\s+/).length : 0;
    countEl.textContent = chars + ' \u6587\u5B57 / ' + words + ' \u30EF\u30FC\u30C9';
  }

  function showMorningPageOverlay() {
    var mgr = getMgr();
    if (!mgr) return;

    var today = getTodayString();
    var existing = mgr.getPage(today);
    var existingContent = existing ? existing.content : '';

    // Remove existing overlay if any
    var old = document.getElementById('morning-pages-overlay');
    if (old) old.remove();

    var overlay = document.createElement('div');
    overlay.id = 'morning-pages-overlay';
    overlay.className = 'morning-pages-overlay';

    // Header
    var header = document.createElement('div');
    header.className = 'morning-pages-header';

    var title = document.createElement('h2');
    title.textContent = '\uD83C\uDF05 \u30E2\u30FC\u30CB\u30F3\u30B0\u30DA\u30FC\u30B8 - ' + getDayLabel(today);

    var closeBtn = document.createElement('button');
    closeBtn.className = 'morning-pages-close-btn';
    closeBtn.textContent = '\u2715 \u4FDD\u5B58\u3057\u3066\u9589\u3058\u308B';
    closeBtn.addEventListener('click', function() {
      closeMorningPageOverlay();
    });

    header.appendChild(title);
    header.appendChild(closeBtn);

    // Editor
    var editor = document.createElement('textarea');
    editor.className = 'morning-pages-editor';
    editor.id = 'morning-pages-editor';
    editor.placeholder = '\u4ECA\u65E5\u306E\u601D\u8003\u3092\u81EA\u7531\u306B\u66F8\u304D\u51FA\u3057\u3066\u304F\u3060\u3055\u3044\u3002\n[ ] \u3067\u30BF\u30B9\u30AF\u5316\u3001TODO: \u3067\u3082\u30BF\u30B9\u30AF\u5316\u3067\u304D\u307E\u3059\u3002';
    editor.value = existingContent;

    // Footer
    var footer = document.createElement('div');
    footer.className = 'morning-pages-footer';

    var wordCount = document.createElement('span');
    wordCount.className = 'morning-pages-wordcount';
    wordCount.id = 'morning-pages-wordcount';

    var actions = document.createElement('div');
    actions.className = 'morning-pages-actions';

    var extractBtn = document.createElement('button');
    extractBtn.className = 'morning-pages-extract-btn';
    extractBtn.textContent = '\uD83D\uDD24 TODO\u3092\u62BD\u51FA\u3057\u3066\u30BF\u30B9\u30AF\u767B\u9332';
    extractBtn.addEventListener('click', function() {
      handleExtractAndRegister(editor.value);
    });

    actions.appendChild(extractBtn);
    footer.appendChild(wordCount);
    footer.appendChild(actions);

    overlay.appendChild(header);
    overlay.appendChild(editor);
    overlay.appendChild(footer);
    document.body.appendChild(overlay);

    // Word count update
    editor.addEventListener('input', function() {
      updateWordCount(editor, wordCount);
    });
    updateWordCount(editor, wordCount);

    editor.focus();

    // Save on Ctrl+S
    overlay.addEventListener('keydown', function(e) {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        closeMorningPageOverlay();
      }
    });
  }

  function closeMorningPageOverlay() {
    var mgr = getMgr();
    var editor = document.getElementById('morning-pages-editor');
    var overlay = document.getElementById('morning-pages-overlay');

    if (mgr && editor) {
      mgr.savePage(getTodayString(), editor.value);
    }
    if (overlay) overlay.remove();
  }

  function handleExtractAndRegister(content) {
    var mgr = getMgr();
    if (!mgr) return;

    var items = mgr.extractTodoItems(content);
    if (items.length === 0) {
      showNotification('\u62BD\u51FA\u5BFE\u8C61\u306E TODO \u304C\u3042\u308A\u307E\u305B\u3093\u3002[ ] \u3084 TODO: \u3092\u4F7F\u3063\u3066\u304F\u3060\u3055\u3044\u3002');
      return;
    }

    showExtractPreview(items);
  }

  function showExtractPreview(items) {
    var existing = document.getElementById('morning-extract-dialog');
    if (existing) existing.remove();

    var dialog = document.createElement('div');
    dialog.id = 'morning-extract-dialog';
    dialog.className = 'morning-extract-dialog';

    var dialogContent = document.createElement('div');
    dialogContent.className = 'morning-extract-content';

    var title = document.createElement('h3');
    title.textContent = '\uD83D\uDCCB \u62BD\u51FA\u3055\u308C\u305F\u30BF\u30B9\u30AF (' + items.length + '\u4EF6)';
    dialogContent.appendChild(title);

    var hint = document.createElement('p');
    hint.className = 'morning-extract-hint';
    hint.textContent = '\u767B\u9332\u3059\u308B\u30BF\u30B9\u30AF\u3092\u9078\u629E\u3057\u3066\u304F\u3060\u3055\u3044';
    dialogContent.appendChild(hint);

    var list = document.createElement('div');
    list.className = 'morning-extract-list';

    var checkboxes = [];
    items.forEach(function(item, index) {
      var row = document.createElement('div');
      row.className = 'morning-extract-item';

      var cb = document.createElement('input');
      cb.type = 'checkbox';
      cb.checked = true;
      cb.dataset.index = index;
      checkboxes.push(cb);

      var label = document.createElement('span');
      label.textContent = item;

      row.appendChild(cb);
      row.appendChild(label);
      list.appendChild(row);
    });

    dialogContent.appendChild(list);

    // Target selection
    var targetSection = document.createElement('div');
    targetSection.className = 'morning-extract-target';

    var targetLabel = document.createElement('label');
    targetLabel.textContent = '\u767B\u9332\u5148: ';
    targetLabel.className = 'morning-extract-target-label';

    var targetSelect = document.createElement('select');
    targetSelect.className = 'morning-extract-target-select';

    var inboxOpt = document.createElement('option');
    inboxOpt.value = '';
    inboxOpt.textContent = '\u672A\u5272\u308A\u5F53\u3066 (Inbox)';
    targetSelect.appendChild(inboxOpt);

    var todayOpt = document.createElement('option');
    todayOpt.value = getTodayString();
    todayOpt.textContent = '\u4ECA\u65E5 (' + getDayLabel(getTodayString()) + ')';
    targetSelect.appendChild(todayOpt);

    targetSection.appendChild(targetLabel);
    targetSection.appendChild(targetSelect);
    dialogContent.appendChild(targetSection);

    // Buttons
    var actions = document.createElement('div');
    actions.className = 'morning-extract-actions';

    var registerBtn = document.createElement('button');
    registerBtn.className = 'morning-extract-register-btn';
    registerBtn.textContent = '\u30BF\u30B9\u30AF\u3068\u3057\u3066\u767B\u9332';
    registerBtn.addEventListener('click', function() {
      var selectedItems = [];
      checkboxes.forEach(function(cb, idx) {
        if (cb.checked) selectedItems.push(items[idx]);
      });
      if (selectedItems.length === 0) {
        showNotification('\u30BF\u30B9\u30AF\u304C\u9078\u629E\u3055\u308C\u3066\u3044\u307E\u305B\u3093');
        return;
      }
      var targetDate = targetSelect.value || null;
      var count = mgr.bulkRegisterTasks(selectedItems, targetDate);
      dialog.remove();
      showNotification(count + '\u4EF6\u306E\u30BF\u30B9\u30AF\u3092\u767B\u9332\u3057\u307E\u3057\u305F');

      // Refresh board
      if (typeof loadTasks === 'function' && typeof renderWeek === 'function') {
        window.location.reload();
      }
    });

    var cancelBtn = document.createElement('button');
    cancelBtn.className = 'morning-extract-cancel-btn';
    cancelBtn.textContent = '\u30AD\u30E3\u30F3\u30BB\u30EB';
    cancelBtn.addEventListener('click', function() {
      dialog.remove();
    });

    actions.appendChild(registerBtn);
    actions.appendChild(cancelBtn);
    dialogContent.appendChild(actions);

    dialog.appendChild(dialogContent);
    document.body.appendChild(dialog);

    dialog.addEventListener('click', function(e) {
      if (e.target === dialog) dialog.remove();
    });
  }

  function showNotification(message) {
    var existing = document.getElementById('morning-notification');
    if (existing) existing.remove();

    var notif = document.createElement('div');
    notif.id = 'morning-notification';
    notif.className = 'morning-notification';
    notif.textContent = message;

    document.body.appendChild(notif);

    setTimeout(function() {
      notif.classList.add('morning-notification-fade');
    }, 10);

    setTimeout(function() {
      if (notif.parentNode) notif.remove();
    }, 3000);
  }

  function initialize() {
    var toggleBtn = document.getElementById('morning-pages-toggle');
    if (toggleBtn) {
      toggleBtn.addEventListener('click', showMorningPageOverlay);
    }

    // Auto-launch check (disabled by default, controlled by settings)
    var mgr = getMgr();
    if (mgr && mgr.shouldShowOnLaunch()) {
      setTimeout(showMorningPageOverlay, 500);
    }

    console.log('[MorningPagesUI] Initialized');
  }

  window.HybridMorningPagesUI = {
    showMorningPageOverlay: showMorningPageOverlay,
    closeMorningPageOverlay: closeMorningPageOverlay,
    initialize: initialize
  };

  // Self-initialize: this module loads after script.js via defer
  initialize();

  console.log('Hybrid morning pages UI module loaded');
})();
