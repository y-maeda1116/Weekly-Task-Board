/**
 * ブラウザコンソールで実行するaria-label検証スクリプト
 * 
 * 使い方:
 * 1. index.htmlをブラウザで開く
 * 2. 開発者ツールを開く（F12）
 * 3. コンソールタブを開く
 * 4. このファイルの内容をコピー＆ペーストして実行
 */

(function() {
    console.log('=== 静的要素のaria-label検証テスト ===\n');
    
    let passed = 0;
    let failed = 0;
    
    // テスト対象の要素とその期待されるaria-label
    const tests = [
        // ナビゲーションボタン
        { selector: '#prev-week', expectedLabel: '前週へ移動', name: 'ナビゲーション: 前週へ' },
        { selector: '#today', expectedLabel: '今週に戻る', name: 'ナビゲーション: 今週に戻る' },
        { selector: '#next-week', expectedLabel: '次週へ移動', name: 'ナビゲーション: 次週へ' },
        
        // データ管理ボタン
        { selector: '#export-data-btn', expectedLabel: 'データをエクスポート', name: 'データ管理: エクスポート' },
        { selector: '#import-data-btn', expectedLabel: 'データをインポート', name: 'データ管理: インポート' },
        { selector: '#archive-toggle', expectedLabel: 'アーカイブを表示', name: 'データ管理: アーカイブ' },
        { selector: '#theme-toggle', expectedLabel: 'ダークモードに切り替え', name: 'データ管理: テーマ切り替え' },
        
        // モーダル閉じるボタン
        { selector: '.close-btn', expectedLabel: 'モーダルを閉じる', name: 'モーダル: 閉じるボタン' },
        
        // アーカイブビューのボタン
        { selector: '#close-archive', expectedLabel: 'アーカイブを閉じる', name: 'アーカイブ: 閉じる' },
        { selector: '#clear-archive', expectedLabel: 'アーカイブを全削除', name: 'アーカイブ: 全削除' }
    ];
    
    // 各要素をテスト
    tests.forEach(test => {
        const element = document.querySelector(test.selector);
        
        if (!element) {
            console.log(`❌ ${test.name}: 要素が見つかりません (${test.selector})`);
            failed++;
            return;
        }
        
        const ariaLabel = element.getAttribute('aria-label');
        
        if (!ariaLabel) {
            console.log(`❌ ${test.name}: aria-label属性がありません`);
            failed++;
            return;
        }
        
        if (ariaLabel !== test.expectedLabel) {
            console.log(`⚠️ ${test.name}: aria-labelが期待値と異なります`);
            console.log(`   期待値: "${test.expectedLabel}"`);
            console.log(`   実際: "${ariaLabel}"`);
            failed++;
            return;
        }
        
        console.log(`✅ ${test.name}: OK`);
        passed++;
    });
    
    // 結果サマリー
    console.log('\n=== テスト結果 ===');
    console.log(`総テスト数: ${tests.length}`);
    console.log(`成功: ${passed}`);
    console.log(`失敗: ${failed}`);
    console.log(`成功率: ${((passed / tests.length) * 100).toFixed(1)}%`);
    
    if (failed === 0) {
        console.log('\n🎉 すべてのテストが成功しました！');
        console.log('静的要素のaria-label属性は正しく設定されています。');
    } else {
        console.log('\n⚠️ 一部のテストが失敗しました。');
        console.log('上記の詳細を確認して修正してください。');
    }
    
    return {
        passed,
        failed,
        total: tests.length,
        success: failed === 0
    };
})();
