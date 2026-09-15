import { readdir } from 'node:fs/promises';
import { dirname, resolve, basename, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { build } from 'vite';
import vuePlugin from '@vitejs/plugin-vue';

const scriptDirectory = dirname(fileURLToPath(import.meta.url));
const projectRoot = resolve(scriptDirectory, '..');
const emailsDir = resolve(projectRoot, 'src', 'views', 'emails');
const outDir = resolve(projectRoot, 'build', 'views', 'emails');

const watch = process.argv.includes('--watch');

const entryFiles = (await readdir(emailsDir)).filter((file) =>
  file.endsWith('.vue'),
);

const input = Object.fromEntries(
  entryFiles.map((file) => [basename(file, '.vue'), join(emailsDir, file)]),
);

await build({
  root: emailsDir,
  logLevel: 'warn',
  plugins: [
    vuePlugin({
      template: {
        compilerOptions: {
          // mj-* tags are MJML's own markup, not real DOM elements — MJML
          // compiles the SSR-rendered output into email-safe HTML afterwards.
          isCustomElement: (tag) => tag === 'mjml' || tag.startsWith('mj-'),
        },
      },
    }),
  ],
  build: {
    ssr: true,
    outDir,
    emptyOutDir: true,
    rollupOptions: {
      input,
      output: {
        format: 'es',
        entryFileNames: '[name].mjs',
        chunkFileNames: 'chunks/[name]-[hash].mjs',
      },
      // Resolved from node_modules at runtime; no need to bundle them.
      external: ['vue', '@vue/server-renderer'],
    },
    watch: watch ? {} : null,
  },
});

console.log(`Built ${entryFiles.length} email views into ${outDir}`);
