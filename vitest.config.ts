import { defineConfig, configDefaults } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    environment: "jsdom",
    include: ["tests/**/*.test.ts", "tests/**/*.spec.ts"],
    // tests/quarantined/ は非デプロイ(本番ビルド不含)の Calendar/Sync 系コンポーネントの
    // テスト群。jest→vitest 移行後に未修復のため CI 対象外とする。別タスクで修復予定。
    exclude: [...configDefaults.exclude, "tests/quarantined/**"],
    setupFiles: ["tests/setup.ts"],
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      include: ["src/**/*.ts"],
      exclude: ["src/**/*.d.ts", "src/**/interfaces.ts"],
      lines: 80,
      functions: 80,
      branches: 80,
      statements: 80
    }
  }
});
