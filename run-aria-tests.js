/**
 * Node.js script to verify aria-label test structure
 * This validates that the test files are properly structured
 */

const fs = require('fs');
const path = require('path');

console.log('=== 動的aria-label検証テスト構造チェック ===\n');

let allChecksPass = true;

// Check 1: Test HTML file exists
console.log('チェック1: test-aria-dynamic.html の存在確認');
if (fs.existsSync('test-aria-dynamic.html')) {
    console.log('✅ test-aria-dynamic.html が存在します\n');
} else {
    console.log('❌ test-aria-dynamic.html が見つかりません\n');
    allChecksPass = false;
}

// Check 2: Test JS file exists
console.log('チェック2: test-aria-dynamic.js の存在確認');
if (fs.existsSync('test-aria-dynamic.js')) {
    console.log('✅ test-aria-dynamic.js が存在します\n');
} else {
    console.log('❌ test-aria-dynamic.js が見つかりません\n');
    allChecksPass = false;
}

// Check 3: Verify test functions exist in test-aria-dynamic.js
console.log('チェック3: テスト関数の存在確認');
try {
    const testContent = fs.readFileSync('test-aria-dynamic.js', 'utf8');
    
    const requiredFunctions = [
        'testTaskCheckboxAriaLabel',
        'testArchivedTaskButtonsAriaLabel',
        'testThemeButtonAriaLabel',
        'createTaskElement',
        'createArchivedTaskElement',
        'updateThemeButton'
    ];
    
    let allFunctionsFound = true;
    requiredFunctions.forEach(funcName => {
        if (testContent.includes(`function ${funcName}`)) {
            console.log(`  ✅ ${funcName} 関数が存在します`);
        } else {
            console.log(`  ❌ ${funcName} 関数が見つかりません`);
            allFunctionsFound = false;
            allChecksPass = false;
        }
    });
    
    if (allFunctionsFound) {
        console.log('✅ すべての必要な関数が存在します\n');
    } else {
        console.log('❌ 一部の関数が見つかりません\n');
    }
} catch (error) {
    console.log(`❌ test-aria-dynamic.js の読み込みエラー: ${error.message}\n`);
    allChecksPass = false;
}

// Check 4: Verify implementation in script.js
console.log('チェック4: script.js の実装確認');
try {
    const scriptContent = fs.readFileSync('script.js', 'utf8');
    
    // Check for aria-label in createTaskElement
    if (scriptContent.includes('aria-label="${task.name}を完了としてマーク"')) {
        console.log('  ✅ タスクチェックボックスのaria-label実装を確認');
    } else {
        console.log('  ❌ タスクチェックボックスのaria-label実装が見つかりません');
        allChecksPass = false;
    }
    
    // Check for aria-label in createArchivedTaskElement (restore button)
    if (scriptContent.includes('aria-label="${task.name}を復元"')) {
        console.log('  ✅ アーカイブ復元ボタンのaria-label実装を確認');
    } else {
        console.log('  ❌ アーカイブ復元ボタンのaria-label実装が見つかりません');
        allChecksPass = false;
    }
    
    // Check for aria-label in createArchivedTaskElement (delete button)
    if (scriptContent.includes('aria-label="${task.name}を削除"')) {
        console.log('  ✅ アーカイブ削除ボタンのaria-label実装を確認');
    } else {
        console.log('  ❌ アーカイブ削除ボタンのaria-label実装が見つかりません');
        allChecksPass = false;
    }
    
    // Check for updateThemeButton function with aria-label
    if (scriptContent.includes('function updateThemeButton') && 
        scriptContent.includes("setAttribute('aria-label'")) {
        console.log('  ✅ テーマ切り替えボタンのaria-label動的更新実装を確認');
    } else {
        console.log('  ❌ テーマ切り替えボタンのaria-label動的更新実装が見つかりません');
        allChecksPass = false;
    }
    
    console.log('✅ script.js の実装確認完了\n');
} catch (error) {
    console.log(`❌ script.js の読み込みエラー: ${error.message}\n`);
    allChecksPass = false;
}

// Check 5: Verify test report exists
console.log('チェック5: テストレポートの存在確認');
if (fs.existsSync('test-dynamic-aria-labels-report.md')) {
    console.log('✅ test-dynamic-aria-labels-report.md が存在します\n');
} else {
    console.log('❌ test-dynamic-aria-labels-report.md が見つかりません\n');
    allChecksPass = false;
}

// Final summary
console.log('=== 検証結果サマリー ===');
if (allChecksPass) {
    console.log('✅ すべてのチェックが合格しました！');
    console.log('\nタスク2.4「動的要素のaria-label検証テストを作成」は正常に完了しています。');
    console.log('\nブラウザでテストを実行するには:');
    console.log('  1. test-aria-dynamic.html をブラウザで開く');
    console.log('  2. 開発者ツール（F12）を開く');
    console.log('  3. コンソールタブでテスト結果を確認');
    process.exit(0);
} else {
    console.log('❌ 一部のチェックが失敗しました。');
    console.log('上記のエラーを確認して修正してください。');
    process.exit(1);
}
