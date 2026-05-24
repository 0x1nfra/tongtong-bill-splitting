import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
  },
  resolve: {
    alias: {
      '@': '/Users/irfanmurad/Developer/vessl/tongtong-bill-splitting/.claude/worktrees/agent-a35f31b085e8f0615/src',
    },
  },
})
