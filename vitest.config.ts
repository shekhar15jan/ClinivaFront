import { defineConfig } from 'vitest/config';
import { playwright } from '@vitest/browser-playwright';

export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    fileParallelism: false,
    setupFiles: [
      '@analogjs/vitest-angular/setup-zone',
      './src/test-setup.ts',
    ],
    browser: {
      enabled: true,
      instances: [{ browser: 'chromium' }],
      // Vitest's default (63315) can fall inside a block Windows reserves for Hyper-V/WSL (e.g. 63235-63334), and
      // then no test runs ("listen EACCES"). VITEST_BROWSER_PORT overrides this one if it is ever taken too.
      api: { port: Number(process.env['VITEST_BROWSER_PORT'] ?? 61315), strictPort: false },
      provider: playwright(),
      headless: true,
    },
    include: ['src/**/*.spec.ts'],
    exclude: ['src/**/*.cy.spec.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['src/**/*.ts'],
      exclude: [
        'src/**/*.spec.ts',
        'e2e/**',
        'src/environments/**',
        'src/main.ts',
        'src/main.server.ts',
        'src/server.ts',
        'src/**/*.module.ts',
        'src/**/index.ts',
        'src/test-setup.ts',
        'src/**/*.model.ts',
      ],
    },
  },
});
