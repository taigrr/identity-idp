/**
 * Country Dialing Codes Loader
 * Loads country support data from the Rails YAML config file
 * Mirrors: PhoneNumberCapabilities.translated_international_codes
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import * as yaml from 'yaml';

export interface CountryCodeData {
  country_code: string;
  name: string;
  supports_sms: boolean;
  supports_sms_unconfirmed?: boolean;
  supports_voice: boolean;
  supports_voice_unconfirmed?: boolean;
}

export type CountryCodesMap = Record<string, CountryCodeData>;

let cachedCodes: CountryCodesMap | null = null;

/**
 * Load country dialing codes from the Rails YAML config
 */
export async function loadCountryDialingCodes(): Promise<CountryCodesMap> {
  if (cachedCodes) {
    return cachedCodes;
  }

  // Path relative to next-app, going up to parent repo to read Rails config
  const yamlPath = path.resolve(
    process.cwd(),
    '..',
    'config',
    'country_dialing_codes.yml'
  );

  try {
    const content = await fs.readFile(yamlPath, 'utf-8');
    cachedCodes = yaml.parse(content) as CountryCodesMap;
    return cachedCodes;
  } catch (error) {
    console.error('Failed to load country_dialing_codes.yml:', error);
    // Return empty object if file not found (fallback)
    return {};
  }
}

/**
 * Get country dialing codes with optional locale-specific names
 * For now, returns English names from the YAML file
 * TODO: Integrate with i18n for translated country names
 */
export async function getCountryDialingCodes(
  _locale: string = 'en'
): Promise<CountryCodesMap> {
  const codes = await loadCountryDialingCodes();
  // For now, return codes as-is (English names are in the YAML)
  // In the future, we can integrate with next-intl for translations
  return codes;
}

/**
 * Reset cached codes (for testing)
 */
export function resetCountryCodesCache(): void {
  cachedCodes = null;
}
