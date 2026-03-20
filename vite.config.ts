import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import ViteRuby from 'vite-plugin-ruby';
// import manifestSRI from 'vite-plugin-manifest-sri';
import { railsI18nPlugin } from './vite-plugins/rails-i18n-plugin';
import { railsAssetsPlugin } from './vite-plugins/rails-assets-plugin';
import { resolve, dirname } from 'path';
import { readdirSync, existsSync, readFileSync } from 'fs';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Generate aliases for all workspace packages to resolve subpath imports
function generatePackageAliases(): Record<string, string> {
  const packagesDir = resolve(__dirname, 'app/javascript/packages');
  const aliases: Record<string, string> = {};

  for (const dir of readdirSync(packagesDir, { withFileTypes: true })) {
    if (!dir.isDirectory()) continue;

    const pkgPath = resolve(packagesDir, dir.name, 'package.json');
    if (!existsSync(pkgPath)) continue;

    try {
      const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8'));
      if (pkg.name) {
        // Map @18f/identity-foo -> app/javascript/packages/foo
        aliases[pkg.name] = resolve(packagesDir, dir.name);
      }
    } catch {
      // Skip packages with invalid package.json
    }
  }

  return aliases;
}

const packageAliases = generatePackageAliases();

export default defineConfig({
  plugins: [
    ViteRuby(),
    react(),
    // manifestSRI(), // TODO: Fix SRI plugin configuration
    railsI18nPlugin({
      configPath: 'config/locales',
      defaultLocale: 'en',
      onMissingString(key, locale) {
        // Only warn for keys that look like i18n keys (contain dots)
        if (key.includes('.')) {
          console.warn(`Missing i18n string for locale '${locale}': '${key}'`);
        }
        // Return undefined to use empty string for non-i18n keys
        return undefined;
      },
    }),
    railsAssetsPlugin(),
  ],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'app/javascript'),
      ...packageAliases,
    },
    // Enable source condition to resolve TypeScript source files directly
    conditions: ['source', 'import', 'module', 'browser', 'default'],
    extensions: ['.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs', '.mts', '.cts', '.json'],
  },
  build: {
    sourcemap: true,
    rollupOptions: {
      output: {
        // Match the existing naming convention
        entryFileNames: '[name]-[hash:8].digested.js',
        chunkFileNames: '[name].chunk-[hash:8].digested.js',
        assetFileNames: '[name]-[hash:8].digested[extname]',
      },
    },
  },
});
