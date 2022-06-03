import { defineConfig } from 'vite';
import { viteStaticCopy } from 'vite-plugin-static-copy';

const staticFilesCopy = viteStaticCopy({
  targets: [
    {
      src: 'partials/*',
      dest: 'partials/'
    },
    {
      src: 'img/*',
      dest: 'img/'
    },
  ]
});

const plugins = [
  staticFilesCopy,
];

export default defineConfig({
  root: 'src',
  build: {
    outDir: '../build',
    emptyOutDir: true,
  },
  plugins,
});
