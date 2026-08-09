// playwright.config.ts
import { PlaywrightTestConfig, devices } from '@playwright/test';

const config: PlaywrightTestConfig = {
  testDir: './tests',
  testIgnore: '**/experimentalCrossScopeRegistering/**',
  webServer: {
    command: 'npm run serve',
    url: 'http://localhost:8000/',
    timeout: 120 * 1000,
    reuseExistingServer: !process.env.CI,
  },
  use: {
    baseURL: 'http://localhost:8000/',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
      // Tests to skip in Firefox (known failures)
      // Note: experimentalCrossScopeRegistering is already ignored globally
      testIgnore: [
        '**/experimentalCrossScopeRegistering/**',
        '**/test-element-mount.spec.mjs',
        '**/test-emc-script.spec.mjs',
        '**/test-enhance-mounted-element.spec.mjs',
        '**/test-mount-globally.spec.mjs',
      ],
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
      // Tests to skip in WebKit (known failures)
      // Note: experimentalCrossScopeRegistering is already ignored globally
      testIgnore: [
        '**/experimentalCrossScopeRegistering/**',
        '**/test-builtins.spec.mjs',
        '**/test-element-mount.spec.mjs',
        '**/test-emc-script.spec.mjs',
        '**/test-enhance-mounted-element.spec.mjs',
        '**/test-mount-globally.spec.mjs',
      ],
    },
  ],
};

export default config;
