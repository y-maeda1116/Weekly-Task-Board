#!/usr/bin/env node
/**
 * ts71/index.html ジェネレーター
 *
 * ルートの index.html から TS 7.1 サンドボックス用の ts71/index.html を生成する。
 * 両者の差分は意図的に以下の変換のみに限定し、本流HTMLの変更が
 * サンドボックスに反映されない事態を防ぐ（issue #76）。
 *
 * 使い方:
 *   node scripts/generate-ts71-index.mjs          # 生成して上書き
 *   node scripts/generate-ts71-index.mjs --check  # 差分があれば exit 1（CI用）
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const sourcePath = join(root, 'index.html');
const outputPath = join(root, 'ts71', 'index.html');

/** 単一一致を強制する置換。0回または複数回ヒットでエラー（本流HTMLの構造変化を検知） */
function replaceOnce(html, search, replace, label) {
  const count = html.split(search).length - 1;
  if (count !== 1) {
    throw new Error(
      `generate-ts71-index: 変換「${label}」が ${count} 回ヒットしました（期待値: 1）。` +
        ` ルート index.html の構造が変わったため、スクリプトの更新が必要です。`
    );
  }
  return html.replace(search, replace);
}

function generate(source) {
  let html = source;

  // 1. タイトルにサフィックス
  html = replaceOnce(
    html,
    '<title>ウィークリータスクボード</title>',
    '<title>ウィークリータスクボード — TS 7.1</title>',
    'title'
  );

  // 2. manifest リンク削除（サンドボックスはPWA対象外）
  html = replaceOnce(html, '    <link rel="manifest" href="/manifest.json">\n', '', 'manifest削除');

  // 3. favicon のパスを親ディレクトリへ
  html = replaceOnce(
    html,
    '<link rel="icon" type="image/svg+xml" href="favicon.svg">',
    '<link rel="icon" type="image/svg+xml" href="../favicon.svg">',
    'favicon icon'
  );
  html = replaceOnce(
    html,
    '<link rel="apple-touch-icon" sizes="180x180" href="favicon.svg">',
    '<link rel="apple-touch-icon" sizes="180x180" href="../favicon.svg">',
    'favicon apple-touch-icon'
  );

  // 4. スタイルシートのパスを親ディレクトリへ + バッジCSS追加
  html = replaceOnce(
    html,
    '<link rel="stylesheet" href="style.css">',
    [
      '<link rel="stylesheet" href="../style.css">',
      '    <style>',
      '      .ts71-badge { display:inline-block; padding:2px 8px; border-radius:12px; font-size:0.7em; font-weight:600; background:#7952b3; color:white; vertical-align:middle; margin-left:6px; }',
      '    </style>',
    ].join('\n'),
    'stylesheet + badge CSS'
  );

  // 5. h1 に TS 7.1 バッジ
  html = replaceOnce(
    html,
    '<h1>ウィークリータスクボード</h1>',
    '<h1>ウィークリータスクボード <span class="ts71-badge">TS 7.1</span></h1>',
    'h1バッジ'
  );

  // 6. スクリプトエントリを ts71/src/main.ts へ
  html = replaceOnce(
    html,
    '<script type="module" src="/src/app.ts"></script>',
    '<script type="module" src="/src/main.ts"></script>',
    'スクリプトエントリ'
  );

  return html;
}

const generated = generate(readFileSync(sourcePath, 'utf8'));

if (process.argv.includes('--check')) {
  const current = readFileSync(outputPath, 'utf8');
  if (current !== generated) {
    console.error(
      'ts71/index.html が index.html と同期していません。\n' +
        '修正: `npm run generate:ts71` を実行してコミットしてください。'
    );
    process.exit(1);
  }
  console.log('ts71/index.html は同期されています ✓');
} else {
  writeFileSync(outputPath, generated);
  console.log(`生成完了: ${outputPath}`);
}
