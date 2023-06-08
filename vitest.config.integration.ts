import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    include: ['tests/integration/**/*.test.ts'],
    threads: false,
    setupFiles: ['tests/utils/setup.ts']
  },
  // resolve: {
  //   alias: {
  //     config: '/src/config',
  //     controllers: '/src/controllers',
  //     guards: '/src/guards',
  //     jobs: '/src/jobs',
  //     middleware: '/src/middleware',
  //     resources: '/src/resources',
  //     routes: '/src/routes',
  //     services: '/src/services',
  //     utils: '/src/utils',
  //     validators: '/src/validators',
  //   }
  // }
})
