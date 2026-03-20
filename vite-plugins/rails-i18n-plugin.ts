/**
 * Vite plugin that extracts i18n keys from JavaScript code and generates
 * locale-specific JavaScript files with translations from Rails YAML files.
 *
 * Ported from @18f/identity-rails-i18n-webpack-plugin
 */

import { readFile, readdir } from 'fs/promises';
import { readdirSync } from 'fs';
import { resolve, basename } from 'path';
import { createHash } from 'crypto';
import YAML from 'yaml';
import type { Plugin, ResolvedConfig } from 'vite';

type MissingStringCallback = (key: string, locale: string) => string | undefined | void;

interface RailsI18nPluginOptions {
  /** Root path for locale configuration data */
  configPath?: string;
  /** Default locale to use if string data is missing for desired locale */
  defaultLocale?: string;
  /** Callback when a key is missing */
  onMissingString?: MissingStringCallback;
}

interface PluralizedEntry {
  one: string;
  other: string;
}

type Entry = string | PluralizedEntry;
type LocaleData = Record<string, Entry>;

/**
 * Regular expression matching translation calls.
 * @see https://github.com/glebm/i18n-tasks/blob/v0.9.34/lib/i18n/tasks/scanners/pattern_scanner.rb#L15
 */
const TRANSLATE_CALL = /(?:^|[^\w'-]|i18n_)t\)?\(\[?(['"][a-z\d\s_.,'"]+['"])]?[,\s)]/g;

/**
 * Given a string of source code, returns occurrences of translation keys.
 */
function getTranslationKeys(source: string): string[] {
  return Array.from(source.matchAll(TRANSLATE_CALL)).flatMap(([, keys]) =>
    keys.split(',').map((key) => key.replace(/[ '"]/g, '')),
  );
}

/**
 * Cache for locale data
 */
const localeDataCache: Map<string, Promise<LocaleData>> = new Map();

/**
 * Get locale file paths for a given locale
 */
function getLocaleFilePaths(configPath: string, locale: string): string[] {
  try {
    return readdirSync(configPath, { recursive: true })
      .filter((filePath): filePath is string =>
        typeof filePath === 'string' && filePath.endsWith(`${locale}.yml`),
      )
      .map((filePath) => resolve(configPath, filePath));
  } catch {
    return [];
  }
}

/**
 * Get locale data for a given locale
 */
async function getLocaleData(configPath: string, locale: string): Promise<LocaleData> {
  const cacheKey = `${configPath}:${locale}`;
  if (!localeDataCache.has(cacheKey)) {
    const promise = Promise.all(
      getLocaleFilePaths(configPath, locale).map((filePath) =>
        readFile(filePath, 'utf-8')
          .then(YAML.parse)
          .catch(() => ({})),
      ),
    ).then((fileDatas) => Object.assign({}, ...fileDatas) as LocaleData);
    localeDataCache.set(cacheKey, promise);
  }
  return localeDataCache.get(cacheKey)!;
}

/**
 * Resolve a translation for a key and locale
 */
async function resolveTranslation(
  configPath: string,
  key: string,
  locale: string,
  defaultLocale: string,
  onMissingString: MissingStringCallback,
): Promise<Entry> {
  const localeData = await getLocaleData(configPath, locale);

  let translation: Entry | undefined = localeData[key];

  // Prefix search localeData, used in ".one", ".other" keys
  if (translation === undefined && typeof localeData === 'object') {
    const prefix = `${key}.`;
    const prefixedEntries = Object.entries(localeData)
      .filter(([localeDataKey]) => localeDataKey.startsWith(prefix))
      .map(([localeDataKey, value]) => [localeDataKey.replace(prefix, ''), value]);

    if (prefixedEntries.length) {
      translation = Object.fromEntries(prefixedEntries) as PluralizedEntry;
    }
  }

  if (translation === undefined) {
    const fallback = onMissingString(key, locale);
    if (fallback !== undefined) {
      translation = fallback;
    }
  }

  if (translation === undefined && locale !== defaultLocale) {
    translation = await resolveTranslation(configPath, key, defaultLocale, defaultLocale, () => {});
  }

  return translation || '';
}

/**
 * Get all available locales from config path
 */
async function getLocales(configPath: string): Promise<string[]> {
  try {
    const files = await readdir(configPath);
    return files
      .filter((file) => file.endsWith('.yml'))
      .map((file) => basename(file, '.yml'));
  } catch {
    return ['en'];
  }
}

/**
 * Get translation data for given keys and locale
 */
async function getTranslationData(
  configPath: string,
  keys: string[],
  locale: string,
  defaultLocale: string,
  onMissingString: MissingStringCallback,
): Promise<LocaleData | undefined> {
  const translations = await Promise.all(
    keys.map(async (key): Promise<[string, Entry]> => [
      key,
      await resolveTranslation(configPath, key, locale, defaultLocale, onMissingString),
    ]),
  );
  if (translations.length) {
    return Object.fromEntries(translations);
  }
}

/**
 * Generate locale asset content
 */
function generateLocaleAsset(data: LocaleData): string {
  return `_locale_data=Object.assign(${JSON.stringify(data)},this._locale_data)`;
}

/**
 * Generate filename for locale asset
 */
function getLocaleAssetFilename(
  originalName: string,
  locale: string,
  content: string,
  isProduction: boolean,
): string {
  const parts = originalName.split('.');
  if (isProduction) {
    const hash = createHash('md5').update(content).digest('hex').slice(0, 8);
    parts[parts.length - 2] = `${parts[parts.length - 2]}-${hash}`;
  }
  parts.splice(parts.length - 1, 0, locale);
  return parts.join('.');
}

export function railsI18nPlugin(options: RailsI18nPluginOptions = {}): Plugin {
  const {
    configPath = 'config/locales',
    defaultLocale = 'en',
    onMissingString = () => {},
  } = options;

  let config: ResolvedConfig;
  const resolvedConfigPath = resolve(process.cwd(), configPath);

  return {
    name: 'vite-plugin-rails-i18n',
    configResolved(resolvedConfig) {
      config = resolvedConfig;
    },
    async generateBundle(_options, bundle) {
      const isProduction = config.mode === 'production';
      const locales = await getLocales(resolvedConfigPath);

      // Process each JS chunk
      for (const [fileName, chunk] of Object.entries(bundle)) {
        if (chunk.type !== 'chunk' || !fileName.endsWith('.js')) {
          continue;
        }

        const source = chunk.code;
        const keys = getTranslationKeys(source);

        if (keys.length === 0) {
          continue;
        }

        // Generate locale files for each locale
        for (const locale of locales) {
          const data = await getTranslationData(
            resolvedConfigPath,
            keys,
            locale,
            defaultLocale,
            onMissingString,
          );

          if (data) {
            const content = generateLocaleAsset(data);
            const localeFileName = getLocaleAssetFilename(fileName, locale, content, isProduction);

            this.emitFile({
              type: 'asset',
              fileName: localeFileName,
              source: content,
            });
          }
        }
      }
    },
  };
}
