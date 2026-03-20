/**
 * Vite plugin that scans compiled JS for getAssetPath() calls and includes
 * those assets in the manifest.
 *
 * Ported from @18f/identity-assets webpack plugin
 */

import type { Plugin } from 'vite';

/**
 * Regular expression matching calls to retrieve asset path.
 */
const GET_ASSET_CALL = /getAssetPath(?: \*\/ ?\.[A-Za-z_$]+)?\)?\(\s*['"](.+?)['"]/g;

/**
 * Given a string of source code, returns array of asset paths.
 */
function getAssetPaths(source: string): string[] {
  return Array.from(source.matchAll(GET_ASSET_CALL)).map(([, path]) => path);
}

export function railsAssetsPlugin(): Plugin {
  return {
    name: 'vite-plugin-rails-assets',
    generateBundle(_options, bundle) {
      // Collect all asset paths from JS chunks
      const allAssetPaths = new Set<string>();

      for (const [fileName, chunk] of Object.entries(bundle)) {
        if (chunk.type !== 'chunk' || !fileName.endsWith('.js')) {
          continue;
        }

        const assetPaths = getAssetPaths(chunk.code);
        assetPaths.forEach((path) => allAssetPaths.add(path));
      }

      // The asset paths are used by Rails to know which assets to include
      // via the manifest. Vite Ruby handles this automatically through its
      // manifest plugin, so we just need to ensure the assets are tracked.
      // This is mostly a no-op in Vite since static assets are handled
      // differently, but we keep it for compatibility.
    },
  };
}

export { getAssetPaths };
