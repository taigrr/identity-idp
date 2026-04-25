/**
 * Personal Key Generator Module
 * Migrated from Rails:
 * - app/services/personal_key_generator.rb
 * - app/services/random_phrase.rb
 * - app/services/profanity_detector.rb
 * 
 * Generates secure personal recovery keys using Crockford Base32 encoding
 * with profanity filtering.
 */

import { randomBytes } from 'crypto';

const WORD_LENGTH = 4;
const DEFAULT_RECOVERY_CODE_LENGTH = 4;

const PROFANE_WORDS = new Set([
  'ass', 'cum', 'fag', 'gay', 'god', 'jew', 'nig', 'poo', 'sex', 'tit',
  'anal', 'anus', 'arse', 'cock', 'crap', 'damn', 'dick', 'dumb', 'dyke',
  'fart', 'fuck', 'hell', 'homo', 'jerk', 'jizz', 'kike', 'piss', 'porn',
  'poop', 'shit', 'slut', 'tits', 'twat', 'wank',
  'bitch', 'chink', 'cocks', 'coons', 'cunts', 'dicks', 'fagot', 'fucka',
  'fucks', 'negro', 'nigga', 'penis', 'prick', 'pussy', 'queer', 'shits',
  'sluts', 'sperm', 'spick', 'whore',
]);

const CROCKFORD_ALPHABET = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';
const CROCKFORD_DECODE_MAP: Record<string, number> = {};
const CROCKFORD_ENCODE_MAP: Record<number, string> = {};

for (let i = 0; i < CROCKFORD_ALPHABET.length; i++) {
  CROCKFORD_ENCODE_MAP[i] = CROCKFORD_ALPHABET[i];
  CROCKFORD_DECODE_MAP[CROCKFORD_ALPHABET[i]] = i;
  CROCKFORD_DECODE_MAP[CROCKFORD_ALPHABET[i].toLowerCase()] = i;
}

CROCKFORD_DECODE_MAP['O'] = 0;
CROCKFORD_DECODE_MAP['o'] = 0;
CROCKFORD_DECODE_MAP['I'] = 1;
CROCKFORD_DECODE_MAP['i'] = 1;
CROCKFORD_DECODE_MAP['L'] = 1;
CROCKFORD_DECODE_MAP['l'] = 1;

export function crockfordEncode(num: bigint, length: number): string {
  if (num === 0n) {
    return '0'.repeat(length);
  }

  let result = '';
  let n = num;

  while (n > 0n) {
    const remainder = Number(n % 32n);
    result = CROCKFORD_ENCODE_MAP[remainder] + result;
    n = n / 32n;
  }

  while (result.length < length) {
    result = '0' + result;
  }

  return result;
}

export function crockfordDecode(str: string): bigint | null {
  let result = 0n;
  const normalized = str.replace(/[-\s]/g, '');

  for (const char of normalized) {
    if (!(char in CROCKFORD_DECODE_MAP)) {
      return null;
    }
    result = result * 32n + BigInt(CROCKFORD_DECODE_MAP[char]);
  }

  return result;
}

export function profane(str: string): boolean {
  const normalized = str.replace(/\W/g, '').toLowerCase();
  
  const minLen = 3;
  const maxLen = Math.min(normalized.length, 6);

  for (let size = minLen; size <= maxLen; size++) {
    for (let i = 0; i <= normalized.length - size; i++) {
      const substring = normalized.slice(i, i + size);
      if (PROFANE_WORDS.has(substring)) {
        return true;
      }
    }
  }

  return false;
}

export function withoutProfanity<T>(generator: () => T, limit = 1000): T {
  for (let i = 0; i < limit; i++) {
    const value = generator();
    if (typeof value === 'string' && !profane(value)) {
      return value;
    }
    if (typeof value !== 'string') {
      return value;
    }
  }
  throw new Error('random generator limit exceeded');
}

export class RandomPhrase {
  readonly words: string[];
  readonly separator: string;

  constructor(options: {
    numWords: number;
    wordLength?: number;
    separator?: string;
  }) {
    const wordLength = options.wordLength ?? WORD_LENGTH;
    this.separator = options.separator ?? ' ';
    this.words = this.buildWords(options.numWords, wordLength);
  }

  toString(): string {
    return this.words.join(this.separator);
  }

  private buildWords(numWords: number, wordLength: number): string[] {
    const strSize = numWords * wordLength;
    
    const randomString = withoutProfanity(() => {
      const bits = strSize * 5;
      const bytes = Math.ceil(bits / 8);
      const randomBuf = randomBytes(bytes);
      
      let num = 0n;
      for (const byte of randomBuf) {
        num = (num << 8n) | BigInt(byte);
      }
      
      const mask = (1n << BigInt(bits)) - 1n;
      num = num & mask;

      const encoded = crockfordEncode(num, strSize);
      return encoded.toUpperCase();
    });

    const words: string[] = [];
    for (let i = 0; i < randomString.length; i += wordLength) {
      words.push(randomString.slice(i, i + wordLength));
    }

    return words;
  }

  static format(str: string, separator = ' '): string {
    const normalized = RandomPhrase.normalize(str);
    const words: string[] = [];
    
    for (let i = 0; i < normalized.length; i += WORD_LENGTH) {
      words.push(normalized.slice(i, i + WORD_LENGTH));
    }

    return words.join(separator).toUpperCase();
  }

  static normalize(str: string, numWords?: number): string {
    const cleaned = str.replace(/\W/g, '').replace(/-/g, '').toLowerCase().trim();
    const decoded = crockfordDecode(cleaned);

    if (decoded !== null) {
      const length = numWords ? numWords * WORD_LENGTH : cleaned.length;
      return crockfordEncode(decoded, length).toLowerCase();
    }

    return cleaned;
  }
}

export interface PersonalKeyUser {
  id: string;
  personalKey?: string | null;
}

export interface PersonalKeyGeneratorDeps {
  updateUser: (userId: string, data: { personalKey: string }) => Promise<void>;
  verifyPersonalKey: (user: PersonalKeyUser, key: string) => Promise<boolean>;
  recoveryCodeLength?: number;
}

const INVALID_CODE = 'meaningless string that RandomPhrase will never generate';

export class PersonalKeyGenerator {
  private user: PersonalKeyUser;
  private length: number;
  private deps: PersonalKeyGeneratorDeps;
  private _rawPersonalKey?: string;

  constructor(
    user: PersonalKeyUser,
    deps: PersonalKeyGeneratorDeps,
    options?: { length?: number }
  ) {
    this.user = user;
    this.deps = deps;
    this.length = options?.length ?? DEFAULT_RECOVERY_CODE_LENGTH;
  }

  async generate(): Promise<string> {
    const rawKey = this.rawPersonalKey;
    await this.deps.updateUser(this.user.id, { personalKey: rawKey });
    return rawKey.replace(/ /g, '-');
  }

  async verify(plaintextCode: string): Promise<boolean> {
    const normalized = this.normalize(plaintextCode);
    if (normalized === INVALID_CODE) {
      return false;
    }
    return this.deps.verifyPersonalKey(this.user, normalized);
  }

  normalize(plaintextCode: string): string {
    try {
      const normed = plaintextCode.replace(/\W/g, '');
      const splitLength = WORD_LENGTH;
      const normedLength = normed.length;
      const expectedLength = this.personalKeyLength * splitLength;

      if (normedLength !== expectedLength) {
        return INVALID_CODE;
      }

      return this.encodeCode(normed, normedLength, splitLength);
    } catch {
      return INVALID_CODE;
    }
  }

  private encodeCode(code: string, length: number, split: number): string {
    const decoded = crockfordDecode(code);
    if (decoded === null) {
      return INVALID_CODE;
    }
    const encoded = crockfordEncode(decoded, length);
    
    const words: string[] = [];
    for (let i = 0; i < encoded.length; i += split) {
      words.push(encoded.slice(i, i + split));
    }
    
    return words.join(' ');
  }

  private get rawPersonalKey(): string {
    if (!this._rawPersonalKey) {
      const phrase = new RandomPhrase({ numWords: this.personalKeyLength });
      this._rawPersonalKey = phrase.toString();
    }
    return this._rawPersonalKey;
  }

  private get personalKeyLength(): number {
    return this.deps.recoveryCodeLength ?? this.length;
  }
}

export function createPersonalKeyGenerator(
  user: PersonalKeyUser,
  deps: PersonalKeyGeneratorDeps,
  options?: { length?: number }
): PersonalKeyGenerator {
  return new PersonalKeyGenerator(user, deps, options);
}
