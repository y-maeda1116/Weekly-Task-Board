(function() {
    'use strict';

    function initializeTheme() {
        // LocalStorageからテーマ設定を読み込み
        var savedTheme = localStorage.getItem('theme') || 'light';
        document.documentElement.setAttribute('data-theme', savedTheme);
        updateThemeButton(savedTheme);
    }

    function toggleTheme() {
        var currentTheme = document.documentElement.getAttribute('data-theme');
        var newTheme = currentTheme === 'dark' ? 'light' : 'dark';

        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
        updateThemeButton(newTheme);
    }

    function updateThemeButton(theme) {
        var themeToggleBtn = document.getElementById('theme-toggle');
        if (!themeToggleBtn) return;

        if (theme === 'dark') {
            themeToggleBtn.textContent = '\u2600\uFE0F \u30e9\u30a4\u30c8';
        } else {
            themeToggleBtn.textContent = '\uD83C\uDF19 \u30c0\u30fc\u30af';
        }
    }

    // --- タスク完了アニメーション ---

    function playTaskCompletionAnimation(taskElement, checkbox) {
        // チェックボックスの成功アニメーション
        checkbox.classList.add('success-animation');

        // 光る効果
        taskElement.classList.add('glow-effect');

        // 紙吹雪エフェクト
        createConfettiEffect(taskElement);

        // 成功メッセージ表示
        showSuccessMessage();

        // タスク要素の渦巻きアニメーション（少し遅延）
        setTimeout(function() {
            taskElement.classList.add('completing');
        }, 400);

        // データ保存
        saveTasks();
    }

    function createConfettiEffect(taskElement) {
        var rect = taskElement.getBoundingClientRect();
        var centerX = rect.left + rect.width / 2;
        var centerY = rect.top + rect.height / 2;

        var colors = ['red', 'orange', 'green', 'blue', 'purple'];
        var confettiCount = 20; // 紙吹雪の数を増加

        // 爆発する紙吹雪
        for (var i = 0; i < confettiCount; i++) {
            var confetti = document.createElement('div');
            confetti.className = 'confetti ' + colors[Math.floor(Math.random() * colors.length)];

            // ランダムな位置に配置（より広範囲に）
            var angle = (360 / confettiCount) * i + Math.random() * 30;
            var distance = 40 + Math.random() * 80;
            var x = centerX + Math.cos(angle * Math.PI / 180) * distance;
            var y = centerY + Math.sin(angle * Math.PI / 180) * distance;

            confetti.style.left = x + 'px';
            confetti.style.top = y + 'px';

            // ランダムなサイズ
            var size = 6 + Math.random() * 8;
            confetti.style.width = size + 'px';
            confetti.style.height = size + 'px';

            document.body.appendChild(confetti);

            // アニメーション開始（ランダムな遅延）
            setTimeout(function(c) {
                return function() {
                    if (Math.random() > 0.5) {
                        c.classList.add('explode');
                    } else {
                        c.classList.add('fall');
                    }
                };
            }(confetti), Math.random() * 200);

            // 要素を削除
            setTimeout(function(c) {
                return function() {
                    if (c.parentNode) {
                        c.parentNode.removeChild(c);
                    }
                };
            }(confetti), 2200);
        }

        // 追加の中央爆発エフェクト
        createCenterBurst(centerX, centerY);
    }

    function createCenterBurst(centerX, centerY) {
        var burstCount = 8;
        var colors = ['red', 'orange', 'green', 'blue', 'purple'];

        for (var i = 0; i < burstCount; i++) {
            var burst = document.createElement('div');
            burst.className = 'confetti ' + colors[Math.floor(Math.random() * colors.length)];

            // 中央から放射状に配置
            var angle = (360 / burstCount) * i;
            var x = centerX;
            var y = centerY;

            burst.style.left = x + 'px';
            burst.style.top = y + 'px';
            burst.style.width = '12px';
            burst.style.height = '12px';

            // 放射状に移動するアニメーション
            var distance = 100 + Math.random() * 50;
            var endX = centerX + Math.cos(angle * Math.PI / 180) * distance;
            var endY = centerY + Math.sin(angle * Math.PI / 180) * distance;

            document.body.appendChild(burst);

            // カスタムアニメーション
            (function(b, ex, ey, cx, cy) {
                setTimeout(function() {
                    b.style.transition = 'all 1s ease-out';
                    b.style.transform = 'translate(' + (ex - cx) + 'px, ' + (ey - cy) + 'px) rotate(720deg) scale(0)';
                    b.style.opacity = '0';
                }, 100);
            })(burst, endX, endY, centerX, centerY);

            // 要素を削除
            (function(b) {
                setTimeout(function() {
                    if (b.parentNode) {
                        b.parentNode.removeChild(b);
                    }
                }, 1200);
            })(burst);
        }
    }

    function showSuccessMessage() {
        var messages = [
            '\u30bf\u30b9\u30af\u5b8c\u4e86\uff01\u304a\u75b2\u308c\u3055\u307e\u3067\u3057\u305f\uff01',
            '\u7d20\u6674\u3089\u3057\u3044\uff01\u307e\u305f\u4e00\u3064\u9054\u6210\u3057\u307e\u3057\u305f\uff01',
            '\u3084\u3063\u305f\u306d\uff01\u30bf\u30b9\u30af\u30af\u30ea\u30a2\uff01',
            '\u5b8c\u4e86\uff01\u6b21\u306e\u30bf\u30b9\u30af\u3082\u9811\u5f35\u308a\u307e\u3057\u3087\u3046\uff01',
            '\u30ca\u30a4\u30b9\uff01\u52b9\u7387\u7684\u3067\u3059\u306d\uff01'
        ];

        var message = messages[Math.floor(Math.random() * messages.length)];

        var messageElement = document.createElement('div');
        messageElement.className = 'success-message';
        messageElement.textContent = message;

        document.body.appendChild(messageElement);

        // メッセージ表示
        setTimeout(function() {
            messageElement.classList.add('show');
        }, 100);

        // メッセージ非表示・削除
        setTimeout(function() {
            messageElement.classList.remove('show');
            setTimeout(function() {
                if (messageElement.parentNode) {
                    messageElement.parentNode.removeChild(messageElement);
                }
            }, 300);
        }, 2000);
    }

    /**
     * Initialize theme event listeners.
     */
    function initThemeEventListeners() {
        var themeToggleBtn = document.getElementById('theme-toggle');
        if (themeToggleBtn) {
            themeToggleBtn.addEventListener('click', toggleTheme);
        }
    }

    // Export via window
    window.ThemeManager = {
        initializeTheme,
        toggleTheme,
        updateThemeButton,
        playTaskCompletionAnimation,
        createConfettiEffect,
        showSuccessMessage,
        initThemeEventListeners
    };

})();
