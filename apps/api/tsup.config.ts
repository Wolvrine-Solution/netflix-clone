import { defineConfig } from 'tsup'

export default defineConfig({
  entry: ['src/main.ts'],
  format: ['cjs'],
  outDir: 'dist',
  sourcemap: true,
  clean: true,
  // Workspace packages ship TypeScript sources, so they must be bundled.
  noExternal: ['@netflix/db', '@netflix/types'],
})
