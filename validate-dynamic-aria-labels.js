/**
 * 動的要素のaria-label検証スクリプト
 * 
 * このスクリプトは、script.jsの実装を静的に解析して、
 * 動的に生成される要素にaria-label属性が正しく設定されているかを検証します。
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
 * script.jsファイルを読み込む
 */
function loadScriptJS() {
    const scriptPath = path.join(__dirname, 'script.js');
    return fs.readFileSync(scriptPath, 'utf-8');
}

/**
 * createTaskElement関数内のaria-label設定を検証
 */
function testTaskCheckboxAriaLabel() {
    const scriptContent = loadScriptJS();
    
    // createTaskElement関数を抽出
    const createTaskElementMatch = scriptContent.match(/function createTaskElement\(task\)\s*{[\s\S]*?(?=\n\s{4}function\s|\n\s{4}\/\/\s*---|\Z)/);
    
    if (!createTaskElementMatch) {
        return 'createTaskElement関数が見つかりません';
    }
    
    const functionContent = createTaskElementMatch[0];
    
    // aria-label属性の存在を確認
    const ariaLabelPattern = /aria-label="\$\{task\.name\}を完了としてマーク"/;
    
    if (!ariaLabelPattern.test(functionContent)) {
        return 'タスクチェックボックスにaria-label属性が設定されていません';
    }
    
    // チェックボックス要素にaria-labelが設定されているか確認
    const checkboxPattern = /<input[^>]*type="checkbox"[^>]*aria-label="\$\{task\.name\}を完了としてマーク"[^>]*>/;
    const checkboxPattern2 = /<input[^>]*aria-label="\$\{task\.name\}を完了としてマーク"[^>]*type="checkbox"[^>]*>/;
    
    if (!checkboxPattern.test(functionContent) && !checkboxPattern2.test(functionContent)) {
        return 'チェックボックス要素にaria-label属性が正しく設定されていません';
    }
    
    return true;
}

/**
 * createArchivedTaskElement関数内のaria-label設定を検証
 */
function testArchivedTaskButtonsAriaLabel() {
    const scriptContent = loadScriptJS();
    
    // createArchivedTaskElement関数を抽出
    const createArchivedTaskElementMatch = scriptContent.match(/function createArchivedTaskElement\(task\)\s*{[\s\S]*?(?=\n\s{4}function\s|\n\s{4}\/\/\s*---|\Z)/);
    
    if (!createArchivedTaskElementMatch) {
        return 'createArchivedTaskElement関数が見つかりません';
    }
    
    const functionContent = createArchivedTaskElementMatch[0];
    
    // 復元ボタンのaria-label確認
    const restoreAriaLabelPattern = /aria-label="\$\{task\.name\}を復元"/;
    if (!restoreAriaLabelPattern.test(functionContent)) {
        return '復元ボタンにaria-label属性が設定されていません';
    }
    
    // 削除ボタンのaria-label確認
    const deleteAriaLabelPattern = /aria-label="\$\{task\.name\}を削除"/;
    if (!deleteAriaLabelPattern.test(functionContent)) {
        return '削除ボタンにaria-label属性が設定されていません';
    }
    
    // ボタン要素にaria-labelが設定されているか確認
    const restoreButtonPattern = /<button[^>]*class="restore-task-btn"[^>]*aria-label="\$\{task\.name\}を復元"[^>]*>/;
    const deleteButtonPattern = /<button[^>]*class="delete-task-btn"[^>]*aria-label="\$\{task\.name\}を削除"[^>]*>/;
    
    if (!restoreButtonPattern.test(functionContent)) {
        return '復元ボタン要素にaria-label属性が正しく設定されていません';
    }
    
    if (!deleteButtonPattern.test(functionContent)) {
        return '削除ボタン要素にaria-label属性が正しく設定されていません';
    }
    
    return true;
}

/**
 * updateThemeButton関数内のaria-label動的更新を検証
 */
function testThemeButtonAriaLabelUpdate() {
    const scriptContent = loadScriptJS();
    
    // updateThemeButton関数を抽出
    const updateThemeButtonMatch = scriptContent.match(/function updateThemeButton\(theme\)\s*{[\s\S]*?(?=\n\s{4}function\s|\n\s{4}\/\/\s*---|\Z)/);
    
    if (!updateThemeButtonMatch) {
        return 'updateThemeButton関数が見つかりません';
    }
    
    const functionContent = updateThemeButtonMatch[0];
    
    // ダークモード時のaria-label設定を確認
    const darkModeAriaLabelPattern = /setAttribute\s*\(\s*['"]aria-label['"]\s*,\s*['"]ライトモードに切り替え['"]\s*\)/;
    if (!darkModeAriaLabelPattern.test(functionContent)) {
        return 'ダークモード時のaria-label設定が見つかりません';
    }
    
    // ライトモード時のaria-label設定を確認
    const lightModeAriaLabelPattern = /setAttribute\s*\(\s*['"]aria-label['"]\s*,\s*['"]ダークモードに切り替え['"]\s*\)/;
    if (!lightModeAriaLabelPattern.test(functionContent)) {
        return 'ライトモード時のaria-label設定が見つかりません';
    }
    
    return true;
}

/**
 * toggleTheme関数がupdateThemeButtonを呼び出しているか確認
 */
function testToggleThemeCallsUpdateThemeButton() {
    const scriptContent = loadScriptJS();
    
    // toggleTheme関数を抽出
    const toggleThemeMatch = scriptContent.match(/function toggleTheme\(\)\s*{[\s\S]*?(?=\n\s{4}function\s|\n\s{4}\/\/\s*---|\Z)/);
    
    if (!toggleThemeMatch) {
        return 'toggleTheme関数が見つかりません';
    }
    
    const functionContent = toggleThemeMatch[0];
    
    // updateThemeButton呼び出しを確認
    const updateThemeButtonCallPattern = /updateThemeButton\s*\(\s*newTheme\s*\)/;
    if (!updateThemeButtonCallPattern.test(functionContent)) {
        return 'toggleTheme関数内でupdateThemeButtonが呼び出されていません';
    }
    
    return true;
}

/**
 * aria-labelの内容が意味のあるテキストであることを確認
 */
function testAriaLabelContentQuality() {
    const scriptContent = loadScriptJS();
    
    // 空のaria-labelがないか確認
    const emptyAriaLabelPattern = /aria-label=["']["']/;
    if (emptyAriaLabelPattern.test(scriptContent)) {
        return '空のaria-label属性が見つかりました';
    }
    
    // aria-labelに変数が含まれているか確認（動的な内容）
    const dynamicAriaLabelPattern = /aria-label=["'][^"']*\$\{[^}]+\}[^"']*["']/g;
    const matches = scriptContent.match(dynamicAriaLabelPattern);
    
    if (!matches || matches.length < 3) {
        return '動的なaria-label属性が十分に設定されていません（期待: 3個以上、実際: ' + (matches ? matches.length : 0) + '個）';
    }
    
    return true;
}

/**
 * すべての動的要素にaria-labelが設定されていることを確認
 */
function testAllDynamicElementsHaveAriaLabels() {
    const scriptContent = loadScriptJS();
    
    // createTaskElement関数内のチェックボックス
    const taskCheckboxPattern = /function createTaskElement[\s\S]*?<input[^>]*type="checkbox"[^>]*aria-label=/;
    if (!taskCheckboxPattern.test(scriptContent)) {
        return 'タスクチェックボックスにaria-labelが設定されていません';
    }
    
    // createArchivedTaskElement関数内のボタン
    const archivedButtonsPattern = /function createArchivedTaskElement[\s\S]*?<button[^>]*aria-label=[\s\S]*?<button[^>]*aria-label=/;
    if (!archivedButtonsPattern.test(scriptContent)) {
        return 'アーカイブボタンにaria-labelが設定されていません';
    }
    
    // updateThemeButton関数内のaria-label更新
    const themeButtonPattern = /function updateThemeButton[\s\S]*?setAttribute\s*\(\s*['"]aria-label['"]/;
    if (!themeButtonPattern.test(scriptContent)) {
        return 'テーマ切り替えボタンのaria-label更新が設定されていません';
    }
    
    return true;
}

// メイン実行部分
console.log('=== 動的要素のaria-label検証テスト実行開始 ===\n');
console.log('Requirements: 1.3, 1.4\n');

// 各テストを実行
runTest('タスクチェックボックスのaria-label存在確認', testTaskCheckboxAriaLabel);
runTest('アーカイブボタンのaria-label存在確認', testArchivedTaskButtonsAriaLabel);
runTest('テーマ切り替えボタンのaria-label動的更新確認', testThemeButtonAriaLabelUpdate);
runTest('toggleTheme関数がupdateThemeButtonを呼び出すことを確認', testToggleThemeCallsUpdateThemeButton);
runTest('aria-labelの内容品質確認', testAriaLabelContentQuality);
runTest('すべての動的要素のaria-label設定確認', testAllDynamicElementsHaveAriaLabels);

// 結果サマリー
console.log('\n=== テスト結果サマリー ===');
console.log(`総テスト数: ${testResults.total}`);
console.log(`成功: ${testResults.passed}`);
console.log(`失敗: ${testResults.failed}`);
console.log(`成功率: ${((testResults.passed / testResults.total) * 100).toFixed(1)}%`);

if (testResults.failed === 0) {
    console.log('\n🎉 すべてのテストが成功しました！');
    console.log('動的要素のaria-label属性は正しく設定されています。');
    console.log('\n📝 検証内容:');
    console.log('  ✅ タスクチェックボックスに「{タスク名}を完了としてマーク」のaria-labelが設定されています');
    console.log('  ✅ アーカイブ復元ボタンに「{タスク名}を復元」のaria-labelが設定されています');
    console.log('  ✅ アーカイブ削除ボタンに「{タスク名}を削除」のaria-labelが設定されています');
    console.log('  ✅ テーマ切り替えボタンのaria-labelが動的に更新されます');
    console.log('     - ライトモード時: "ダークモードに切り替え"');
    console.log('     - ダークモード時: "ライトモードに切り替え"');
    console.log('\n💡 ブラウザでの動作確認:');
    console.log('  test-aria-dynamic.htmlをブラウザで開いて、実際の動作を確認してください。');
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
        
        runTest('タスクチェックボックスのaria-label存在確認', testTaskCheckboxAriaLabel);
        runTest('アーカイブボタンのaria-label存在確認', testArchivedTaskButtonsAriaLabel);
        runTest('テーマ切り替えボタンのaria-label動的更新確認', testThemeButtonAriaLabelUpdate);
        runTest('toggleTheme関数がupdateThemeButtonを呼び出すことを確認', testToggleThemeCallsUpdateThemeButton);
        runTest('aria-labelの内容品質確認', testAriaLabelContentQuality);
        runTest('すべての動的要素のaria-label設定確認', testAllDynamicElementsHaveAriaLabels);
        
        return testResults;
    }
};
