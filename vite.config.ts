import fs from 'fs';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig, type Plugin} from 'vite';

function singleFileIifePlugin(): Plugin {
  return {
    name: 'single-file-iife',
    apply: 'build',
    enforce: 'post',
    generateBundle(_options, bundle) {
      const htmlKey = Object.keys(bundle).find((key) => key.endsWith('.html'));
      if (!htmlKey) return;
      const htmlAsset = bundle[htmlKey];
      if (htmlAsset.type !== 'asset') return;

      let html =
        typeof htmlAsset.source === 'string'
          ? htmlAsset.source
          : Buffer.from(htmlAsset.source).toString('utf8');

      const cssChunks: string[] = [];
      const jsChunks: string[] = [];

      for (const [key, item] of Object.entries(bundle)) {
        if (item.type === 'asset' && key.endsWith('.css')) {
          const css =
            typeof item.source === 'string'
              ? item.source
              : Buffer.from(item.source).toString('utf8');
          cssChunks.push(css);
          delete bundle[key];
        } else if (item.type === 'chunk' && (item.isEntry || key.endsWith('.js'))) {
          jsChunks.push(item.code);
          delete bundle[key];
        }
      }

      html = html
        .replace(/<script\b[^>]*type=["']module["'][^>]*>[\s\S]*?<\/script>\s*/gi, '')
        .replace(/<link\b[^>]*rel=["']modulepreload["'][^>]*>\s*/gi, '')
        .replace(/<link\b[^>]*rel=["']stylesheet["'][^>]*href=["'](?:\.?\/)?assets\/[^"']*["'][^>]*>\s*/gi, '');

      if (cssChunks.length > 0) {
        const inlineStyle = `<style>${cssChunks.join('\n')}</style>\n  `;
        html = html.replace('</head>', () => `${inlineStyle}</head>`);
      }

      if (jsChunks.length > 0) {
        const escapedJs = jsChunks
          .join('\n')
          .replace(/<\/script/gi, '<\\/script');
        const inlineScript = `<script>\n${escapedJs}\n</script>\n  `;
        html = html.replace('</body>', () => `${inlineScript}</body>`);
      }

      htmlAsset.source = html;
    },
    closeBundle() {
      const distHtml = path.resolve(__dirname, 'dist', 'index.html');
      const rootHtml = path.resolve(__dirname, 'Black Pennant.html');
      if (fs.existsSync(distHtml)) {
        fs.copyFileSync(distHtml, rootHtml);
      }
    },
  };
}

export default defineConfig(({command}) => {
  const isBuild = command === 'build';
  return {
    base: './',
    plugins: [react(), tailwindcss(), singleFileIifePlugin()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    build: isBuild
      ? {
          assetsInlineLimit: 100_000_000,
          cssCodeSplit: false,
          rollupOptions: {
            output: {
              format: 'iife',
              name: 'BlackPennantApp',
              inlineDynamicImports: true,
            },
          },
        }
      : undefined,
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
