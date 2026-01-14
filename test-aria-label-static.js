/**
 * 静的要素のaria-label検証テスト
 * アクセシビリティ改善 - Requirements 1.1, 1.2
 * 
 * このテストは、index.htmlの静的要素に適切なaria-label属性が
 * 設定されていることを検証します。
 */

const fs = require('fs');
const path = require('path');

// テスト結果を格納
let testResults = {
    passed: 0,
    failed: 0,
    total: 0,
    details: []
};

/**
 * テスト実行関数
 */
function runTest(testName, testFunction) {
    testResults.total++;
    try {
        const result = testFunction();
        if (result === true) {
            testResults.passed++;
            testResults.details.push(`✅ ${testName}: PASSED`);
            console.log(`✅ ${testName}: PASSED`);
        } else {
            testResults.failed++;
            testResults.details.push(`❌ ${testName}: FAILED - ${result}`);
            console.log(`❌ ${testName}: FAILED - ${result}`);
        }
    } catch (error) {
        testResults.failed++;
        testResults.details.push(`❌ ${testName}: ERROR - ${error.message}`);
        console.log(`❌ ${testName}: ERROR - ${error.message}`);
    }
}

/**
 * HTMLファイルを読み込む
 */
function loadHTML() {
    const htmlPath = path.join(__dirname, 'index.html');
    return fs.readFileSync(htmlPath, 'utf-8');
}

/**
 * 要素のaria-label属性をチェックする
 */
function checkAriaLabel(html, selector, expectedLabel) {
    // シンプルな正規表現でaria-label属性を検索
    const pattern = new RegExp(`id="${selector}"[^>]*aria-label="([^"]*)"`, 'i');
    const match = html.match(pattern);
    
    if (!match) {
        // aria-labelが見つからない場合、逆順でも試す
        const reversePattern = new RegExp(`aria-label="([^"]*)"[^>]*id="${selector}"`, 'i');
        const reverseMatch = html.match(reversePattern);
        
        if (!reverseMatch) {
            return { found: false, label: null };
        }
        return { found: true, label: reverseMatch[1] };
    }
    
    return { found: true, label: match[1] };
}

/**
 * class属性でaria-label属性をチェックする
 */
function checkAriaLabelByClass(html, className, expectedLabel) {
    const pattern = new RegExp(`class="${className}"[^>]*aria-label="([^"]*)"`, 'i');
    const match = html.match(pattern);
    
    if (!match) {
        // aria-labelが見つからない場合、逆順でも試す
        const reversePattern = new RegExp(`aria-label="([^"]*)"[^>]*class="${className}"`, 'i');
        const reverseMatch = html.match(reversePattern);
        
        if (!reverseMatch) {
            return { found: false, label: null };
        }
        return { found: true, label: reverseMatch[1] };
    }
    
    return { found: true, label: match[1] };
}

/**
 * ナビゲーションボタンのaria-label検証
 */
function testNavigationButtonsAriaLabel() {
    const html = loadHTML();
    
    const navigationButtons = [
        { id: 'prev-week', expectedLabel: '前週へ移動' },
        { id: 'today', expectedLabel: '今週に戻る' },
        { id: 'next-week', expectedLabel: '次週へ移動' }
    ];
    
    for (const button of navigationButtons) {
        const result = checkAriaLabel(html, button.id, button.expectedLabel);
        
        if (!result.found) {
            return `ナビゲーションボタン #${button.id} にaria-label属性が見つかりません`;
        }
        
        if (result.label !== button.expectedLabel) {
            return `ナビゲーションボタン #${button.id} のaria-labelが期待値と異なります。期待値: "${button.expectedLabel}", 実際: "${result.label}"`;
        }
    }
    
    return true;
}

/**
 * データ管理ボタンのaria-label検証
 */
function testDataManagementButtonsAriaLabel() {
    const html = loadHTML();
    
    const dataButtons = [
        { id: 'export-data-btn', expectedLabel: 'データをエクスポート' },
        { id: 'import-data-btn', expectedLabel: 'データをインポート' },
        { id: 'archive-toggle', expectedLabel: 'アーカイブを表示' },
        { id: 'theme-toggle', expectedLabel: 'ダークモードに切り替え' }
    ];
    
    for (const button of dataButtons) {
        const result = checkAriaLabel(html, button.id, button.expectedLabel);
        
        if (!result.found) {
            return `データ管理ボタン #${button.id} にaria-label属性が見つかりません`;
        }
        
        if (result.label !== button.expectedLabel) {
            return `データ管理ボタン #${button.id} のaria-labelが期待値と異なります。期待値: "${button.expectedLabel}", 実際: "${result.label}"`;
        }
    }
    
    return true;
}

/**
 * モーダル閉じるボタンのaria-label検証
 */
function testModalCloseButtonAriaLabel() {
    const html = loadHTML();
    
    const result = checkAriaLabelByClass(html, 'close-btn', 'モーダルを閉じる');
    
    if (!result.found) {
        return 'モーダル閉じるボタン (.close-btn) にaria-label属性が見つかりません';
    }
    
    if (result.label !== 'モーダルを閉じる') {
        return `モーダル閉じるボタンのaria-labelが期待値と異なります。期待値: "モーダルを閉じる", 実際: "${result.label}"`;
    }
    
    return true;
}

/**
 * アーカイブビューのボタンのaria-label検証
 */
function testArchiveButtonsAriaLabel() {
    const html = loadHTML();
    
    const archiveButtons = [
        { id: 'close-archive', expectedLabel: 'アーカイブを閉じる' },
        { id: 'clear-archive', expectedLabel: 'アーカイブを全削除' }
    ];
    
    for (const button of archiveButtons) {
        const result = checkAriaLabel(html, button.id, button.expectedLabel);
        
        if (!result.found) {
            return `アーカイブボタン #${button.id} にaria-label属性が見つかりません`;
        }
        
        if (result.label !== button.expectedLabel) {
            return `アーカイブボタン #${button.id} のaria-labelが期待値と異なります。期待値: "${button.expectedLabel}", 実際: "${result.label}"`;
        }
    }
    
    return true;
}

/**
 * すべてのインタラクティブ要素にaria-labelまたはテキストコンテンツがあることを確認
 */
function testAllInteractiveElementsHaveAccessibleNames() {
    const html = loadHTML();
    
    // ボタン要素のIDリスト（テキストコンテンツを持つものを除く）
    const buttonIds = [
        'prev-week',
        'today', 
        'next-week',
        'export-data-btn',
        'import-data-btn',
        'archive-toggle',
        'theme-toggle',
        'close-archive',
        'clear-archive'
    ];
    
    for (const buttonId of buttonIds) {
        const result = checkAriaLabel(html, buttonId);
        
        if (!result.found) {
            return `ボタン #${buttonId} にaria-label属性が見つかりません`;
        }
        
        if (!result.label || result.label.trim() === '') {
            return `ボタン #${buttonId} のaria-labelが空です`;
        }
    }
    
    // モーダル閉じるボタン
    const closeBtn = checkAriaLabelByClass(html, 'close-btn');
    if (!closeBtn.found || !closeBtn.label || closeBtn.label.trim() === '') {
        return 'モーダル閉じるボタン (.close-btn) に有効なaria-labelがありません';
    }
    
    return true;
}

/**
 * aria-labelの内容が意味のあるテキストであることを確認
 */
function testAriaLabelContentQuality() {
    const html = loadHTML();
    
    const buttons = [
        { id: 'prev-week', minLength: 3 },
        { id: 'today', minLength: 3 },
        { id: 'next-week', minLength: 3 },
        { id: 'export-data-btn', minLength: 5 },
        { id: 'import-data-btn', minLength: 5 },
        { id: 'archive-toggle', minLength: 5 },
        { id: 'theme-toggle', minLength: 5 },
        { id: 'close-archive', minLength: 5 },
        { id: 'clear-archive', minLength: 5 }
    ];
    
    for (const button of buttons) {
        const result = checkAriaLabel(html, button.id);
        
        if (!result.found) {
            return `ボタン #${button.id} にaria-label属性が見つかりません`;
        }
        
        if (result.label.length < button.minLength) {
            return `ボタン #${button.id} のaria-labelが短すぎます（最低${button.minLength}文字必要）: "${result.label}"`;
        }
        
        // 意味のないテキストをチェック
        const meaninglessPatterns = [/^test$/i, /^button$/i, /^click$/i, /^xxx$/i];
        for (const pattern of meaninglessPatterns) {
            if (pattern.test(result.label)) {
                return `ボタン #${button.id} のaria-labelが意味のないテキストです: "${result.label}"`;
            }
        }
    }
    
    return true;
}

// メイン実行部分
console.log('=== 静的要素のaria-label検証テスト実行開始 ===\n');
console.log('Requirements: 1.1, 1.2\n');

// 各テストを実行
runTest('ナビゲーションボタンのaria-label存在確認', testNavigationButtonsAriaLabel);
runTest('データ管理ボタンのaria-label存在確認', testDataManagementButtonsAriaLabel);
runTest('モーダル閉じるボタンのaria-label存在確認', testModalCloseButtonAriaLabel);
runTest('アーカイブビューボタンのaria-label存在確認', testArchiveButtonsAriaLabel);
runTest('すべてのインタラクティブ要素のアクセシブル名確認', testAllInteractiveElementsHaveAccessibleNames);
runTest('aria-labelの内容品質確認', testAriaLabelContentQuality);

// 結果サマリー
console.log('\n=== テスト結果サマリー ===');
console.log(`総テスト数: ${testResults.total}`);
console.log(`成功: ${testResults.passed}`);
console.log(`失敗: ${testResults.failed}`);
console.log(`成功率: ${((testResults.passed / testResults.total) * 100).toFixed(1)}%`);

if (testResults.failed === 0) {
    console.log('\n🎉 すべてのテストが成功しました！');
    console.log('静的要素のaria-label属性は正しく設定されています。');
} else {
    console.log('\n⚠️ 一部のテストが失敗しました。');
    console.log('失敗したテストの詳細を確認してください。');
    process.exit(1);
}

// 詳細結果をエクスポート
module.exports = {
    testResults,
    runAllTests: () => {
        // 全テストを再実行する関数
        testResults = { passed: 0, failed: 0, total: 0, details: [] };
        
        runTest('ナビゲーションボタンのaria-label存在確認', testNavigationButtonsAriaLabel);
        runTest('データ管理ボタンのaria-label存在確認', testDataManagementButtonsAriaLabel);
        runTest('モーダル閉じるボタンのaria-label存在確認', testModalCloseButtonAriaLabel);
        runTest('アーカイブビューボタンのaria-label存在確認', testArchiveButtonsAriaLabel);
        runTest('すべてのインタラクティブ要素のアクセシブル名確認', testAllInteractiveElementsHaveAccessibleNames);
        runTest('aria-labelの内容品質確認', testAriaLabelContentQuality);
        
        return testResults;
    }
};
