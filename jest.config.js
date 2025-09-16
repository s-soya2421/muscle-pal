const nextJest = require('next/jest')

/** @type {import('jest').Config} */
const createJestConfig = nextJest({
  // Next.js アプリのパス（通常はルートディレクトリ）
  dir: './',
})

// Jest のカスタム設定
const config = {
  coverageProvider: 'v8',
  testEnvironment: 'jsdom',
  // テストファイルのパターン
  testMatch: [
    '**/__tests__/**/*.(ts|tsx|js)',
    '**/*.(test|spec).(ts|tsx|js)'
  ],
  // セットアップファイル
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  // モジュールのパス設定
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  // カバレッジ設定
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/*.stories.{ts,tsx}',
    '!src/app/layout.tsx',
    '!src/app/globals.css',
  ],
  // カバレッジ閾値
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70,
    },
  },
  // テスト実行時の並列処理
  maxWorkers: '50%',
  // タイムアウト設定
  testTimeout: 10000,
}

// createJestConfigを使ってNext.js用の設定を適用
module.exports = createJestConfig(config)