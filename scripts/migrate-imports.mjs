#!/usr/bin/env node
/**
 * Migrates imports from @18f/identity-* packages to @/ aliases
 * and moves package contents to consolidated src/ directory
 */

import { readFileSync, writeFileSync, readdirSync, statSync, mkdirSync, cpSync, existsSync } from 'fs';
import { join, dirname, relative } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const PACKAGES_DIR = join(ROOT, 'app/javascript/packages');
const SRC_DIR = join(ROOT, 'app/javascript/src');

// Map old package names to new @/ paths
const PACKAGE_MAPPINGS = {
  // UI Components
  '@18f/identity-components': '@/components',
  '@18f/identity-spinner-button': '@/components/spinner-button',
  '@18f/identity-step-indicator': '@/components/step-indicator',
  '@18f/identity-validated-field': '@/components/validated-field',
  
  // React Hooks
  '@18f/identity-react-hooks': '@/hooks',
  
  // React i18n
  '@18f/identity-react-i18n': '@/i18n/react',
  '@18f/identity-i18n': '@/i18n',
  
  // Custom Elements
  '@18f/identity-clipboard-button': '@/elements/clipboard-button',
  '@18f/identity-countdown': '@/elements/countdown',
  '@18f/identity-form-link': '@/elements/form-link',
  '@18f/identity-manageable-authenticator': '@/elements/manageable-authenticator',
  '@18f/identity-masked-text-toggle': '@/elements/masked-text-toggle',
  '@18f/identity-memorable-date': '@/elements/memorable-date',
  '@18f/identity-modal': '@/elements/modal',
  '@18f/identity-one-time-code-input': '@/elements/one-time-code-input',
  '@18f/identity-password-confirmation': '@/elements/password-confirmation',
  '@18f/identity-password-strength': '@/elements/password-strength',
  '@18f/identity-password-toggle': '@/elements/password-toggle',
  '@18f/identity-phone-input': '@/elements/phone-input',
  '@18f/identity-print-button': '@/elements/print-button',
  '@18f/identity-submit-button': '@/elements/submit-button',
  '@18f/identity-time-element': '@/elements/time-element',
  '@18f/identity-tooltip': '@/elements/tooltip',
  '@18f/identity-captcha-submit-button': '@/elements/captcha-submit-button',
  
  // Services
  '@18f/identity-request': '@/services/request',
  '@18f/identity-session': '@/services/session',
  
  // Utils
  '@18f/identity-config': '@/utils/config',
  '@18f/identity-url': '@/utils/url',
  '@18f/identity-device': '@/utils/device',
  '@18f/identity-assets': '@/utils/assets',
  '@18f/identity-analytics': '@/utils/analytics',
  '@18f/identity-webauthn': '@/utils/webauthn',
  
  // Features (complex packages with multiple components)
  '@18f/identity-address-search': '@/features/address-search',
  '@18f/identity-document-capture': '@/features/document-capture',
  '@18f/identity-document-capture-polling': '@/features/document-capture-polling',
  '@18f/identity-form-steps': '@/features/form-steps',
  '@18f/identity-verify-flow': '@/features/verify-flow',
  
  // Test helpers
  '@18f/identity-test-helpers': '@/test-helpers',
};

// Packages to keep as workspaces (build tools only)
const KEEP_AS_WORKSPACES = [
  '@18f/identity-assets', // has webpack plugin - but we can move the core
  '@18f/identity-build-sass',
  '@18f/identity-lite-webpack-dev-server',
  '@18f/identity-normalize-yaml',
  '@18f/identity-rails-i18n-webpack-plugin',
  '@18f/identity-stylelint-config',
  '@18f/identity-unpolyfill-webpack-plugin',
];

function getAllFiles(dir, extensions = ['.ts', '.tsx', '.js', '.jsx']) {
  const files = [];
  
  function walk(currentDir) {
    for (const entry of readdirSync(currentDir, { withFileTypes: true })) {
      const fullPath = join(currentDir, entry.name);
      if (entry.isDirectory()) {
        if (!entry.name.startsWith('.') && entry.name !== 'node_modules') {
          walk(fullPath);
        }
      } else if (extensions.some(ext => entry.name.endsWith(ext))) {
        files.push(fullPath);
      }
    }
  }
  
  walk(dir);
  return files;
}

function migrateImports(filePath) {
  let content = readFileSync(filePath, 'utf-8');
  const originalContent = content;
  
  for (const [oldPkg, newPath] of Object.entries(PACKAGE_MAPPINGS)) {
    const escaped = oldPkg.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    
    // Replace full package imports: from '@18f/identity-foo'
    content = content.replace(
      new RegExp(`(from ['"])${escaped}(['"])`, 'g'),
      `$1${newPath}$2`
    );
    
    // Replace subpath imports: from '@18f/identity-foo/subpath'
    content = content.replace(
      new RegExp(`(from ['"])${escaped}/`, 'g'),
      `$1${newPath}/`
    );
    
    // Replace side-effect imports: import '@18f/identity-foo'
    content = content.replace(
      new RegExp(`(import ['"])${escaped}(['"])`, 'g'),
      `$1${newPath}$2`
    );
    
    // Replace side-effect subpath imports: import '@18f/identity-foo/subpath'
    content = content.replace(
      new RegExp(`(import ['"])${escaped}/`, 'g'),
      `$1${newPath}/`
    );
    
    // Replace quibble() mock calls: quibble('@18f/identity-foo', ...)
    content = content.replace(
      new RegExp(`(quibble\\(['"])${escaped}(['"])`, 'g'),
      `$1${newPath}$2`
    );
    
    // Replace quibble() mock calls with subpath: quibble('@18f/identity-foo/subpath', ...)
    content = content.replace(
      new RegExp(`(quibble\\(['"])${escaped}/`, 'g'),
      `$1${newPath}/`
    );
    
    // Replace import() dynamic imports: import('@18f/identity-foo')
    content = content.replace(
      new RegExp(`(import\\(['"])${escaped}(['"])`, 'g'),
      `$1${newPath}$2`
    );
    
    // Replace import() dynamic imports with subpath: import('@18f/identity-foo/subpath')
    content = content.replace(
      new RegExp(`(import\\(['"])${escaped}/`, 'g'),
      `$1${newPath}/`
    );
  }
  
  if (content !== originalContent) {
    writeFileSync(filePath, content);
    return true;
  }
  return false;
}

function copyPackageToSrc(pkgName, srcPath) {
  const pkgDir = join(PACKAGES_DIR, pkgName);
  const destDir = join(SRC_DIR, srcPath);
  
  if (!existsSync(pkgDir)) {
    console.log(`  Skipping ${pkgName} - not found`);
    return;
  }
  
  // Create destination directory
  mkdirSync(destDir, { recursive: true });
  
  // Copy source files (not package.json, node_modules, etc.)
  for (const entry of readdirSync(pkgDir, { withFileTypes: true })) {
    if (entry.name === 'package.json' || 
        entry.name === 'node_modules' ||
        entry.name === 'README.md' ||
        entry.name === 'CHANGELOG.md' ||
        entry.name === 'LICENSE.md' ||
        entry.name === '.gitignore' ||
        entry.name.endsWith('.config.json') ||
        entry.name.endsWith('.config.cjs')) {
      continue;
    }
    
    const src = join(pkgDir, entry.name);
    const dest = join(destDir, entry.name);
    
    if (entry.isDirectory()) {
      cpSync(src, dest, { recursive: true });
    } else {
      cpSync(src, dest);
    }
  }
  
  console.log(`  Copied ${pkgName} -> src/${srcPath}`);
}

// Main execution
console.log('=== Package Consolidation Migration ===\n');

// Step 1: Copy packages to src/
console.log('Step 1: Copying packages to src/...\n');

const packageMoves = {
  // Components
  'components': 'components',
  'spinner-button': 'components/spinner-button', 
  'step-indicator': 'components/step-indicator',
  'validated-field': 'components/validated-field',
  
  // Hooks
  'react-hooks': 'hooks',
  
  // i18n
  'i18n': 'i18n',
  'react-i18n': 'i18n/react',
  
  // Elements
  'clipboard-button': 'elements/clipboard-button',
  'countdown': 'elements/countdown',
  'form-link': 'elements/form-link',
  'manageable-authenticator': 'elements/manageable-authenticator',
  'masked-text-toggle': 'elements/masked-text-toggle',
  'memorable-date': 'elements/memorable-date',
  'modal': 'elements/modal',
  'one-time-code-input': 'elements/one-time-code-input',
  'password-confirmation': 'elements/password-confirmation',
  'password-strength': 'elements/password-strength',
  'password-toggle': 'elements/password-toggle',
  'phone-input': 'elements/phone-input',
  'print-button': 'elements/print-button',
  'submit-button': 'elements/submit-button',
  'time-element': 'elements/time-element',
  'tooltip': 'elements/tooltip',
  'captcha-submit-button': 'elements/captcha-submit-button',
  
  // Services
  'request': 'services/request',
  'session': 'services/session',
  
  // Utils
  'config': 'utils/config',
  'url': 'utils/url',
  'device': 'utils/device',
  'assets': 'utils/assets',
  'analytics': 'utils/analytics',
  'webauthn': 'utils/webauthn',
  
  // Features
  'address-search': 'features/address-search',
  'document-capture': 'features/document-capture',
  'document-capture-polling': 'features/document-capture-polling',
  'form-steps': 'features/form-steps',
  'verify-flow': 'features/verify-flow',
  
  // Test helpers
  'test-helpers': 'test-helpers',
};

for (const [pkg, dest] of Object.entries(packageMoves)) {
  copyPackageToSrc(pkg, dest);
}

// Step 2: Migrate imports in all JS/TS files
console.log('\nStep 2: Migrating imports...\n');

const dirsToMigrate = [
  join(ROOT, 'app/javascript/src'),
  join(ROOT, 'app/javascript/packs'),
  join(ROOT, 'app/components'),
  join(ROOT, 'spec/javascript'),
];

let migratedCount = 0;
for (const dir of dirsToMigrate) {
  if (!existsSync(dir)) continue;
  
  for (const file of getAllFiles(dir)) {
    if (migrateImports(file)) {
      migratedCount++;
      console.log(`  Migrated: ${relative(ROOT, file)}`);
    }
  }
}

console.log(`\nMigrated ${migratedCount} files.`);
console.log('\n=== Migration Complete ===');
console.log('\nNext steps:');
console.log('1. Update tsconfig.json with @/ path alias');
console.log('2. Update vite.config.ts resolve.alias');
console.log('3. Run lint to verify same error count');
console.log('4. Run build to verify');
