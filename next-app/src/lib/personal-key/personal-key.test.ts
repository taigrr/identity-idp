import { describe, it, expect } from 'vitest';
import {
  RandomPhrase,
  PersonalKeyGenerator,
  crockfordEncode,
  crockfordDecode,
  profane,
  withoutProfanity,
} from './index';

describe('crockfordEncode', () => {
  it('encodes 0 with padding', () => {
    expect(crockfordEncode(0n, 4)).toBe('0000');
  });

  it('encodes numbers correctly', () => {
    expect(crockfordEncode(1n, 4)).toBe('0001');
    expect(crockfordEncode(31n, 4)).toBe('000Z');
    expect(crockfordEncode(32n, 4)).toBe('0010');
  });

  it('encodes large numbers', () => {
    const result = crockfordEncode(1234567890n, 8);
    expect(result.length).toBe(8);
    expect(result).toMatch(/^[0-9A-Z]+$/);
  });
});

describe('crockfordDecode', () => {
  it('decodes valid strings', () => {
    expect(crockfordDecode('0000')).toBe(0n);
    expect(crockfordDecode('0001')).toBe(1n);
    expect(crockfordDecode('000Z')).toBe(31n);
    expect(crockfordDecode('0010')).toBe(32n);
  });

  it('handles lowercase', () => {
    expect(crockfordDecode('abcd')).toBe(crockfordDecode('ABCD'));
  });

  it('handles common confusables', () => {
    expect(crockfordDecode('O')).toBe(0n);
    expect(crockfordDecode('I')).toBe(1n);
    expect(crockfordDecode('L')).toBe(1n);
  });

  it('strips dashes and spaces', () => {
    expect(crockfordDecode('AB-CD')).toBe(crockfordDecode('ABCD'));
    expect(crockfordDecode('AB CD')).toBe(crockfordDecode('ABCD'));
  });

  it('returns null for invalid input', () => {
    expect(crockfordDecode('!')).toBe(null);
    expect(crockfordDecode('@#$')).toBe(null);
  });
});

describe('profane', () => {
  it('detects profane words', () => {
    expect(profane('fuck')).toBe(true);
    expect(profane('FUCK')).toBe(true);
    expect(profane('abcfuckdef')).toBe(true);
  });

  it('returns false for clean text', () => {
    expect(profane('greetings')).toBe(false);
    expect(profane('WORLD')).toBe(false);
    expect(profane('ABCD-EFGH')).toBe(false);
  });

  it('ignores whitespace and punctuation', () => {
    expect(profane('f u c k')).toBe(true);
    expect(profane('f-u-c-k')).toBe(true);
  });
});

describe('withoutProfanity', () => {
  it('returns value if not profane', () => {
    const result = withoutProfanity(() => 'clean');
    expect(result).toBe('clean');
  });

  it('retries until clean value found', () => {
    let attempts = 0;
    const result = withoutProfanity(() => {
      attempts++;
      return attempts < 3 ? 'fuck' : 'clean';
    });
    expect(result).toBe('clean');
    expect(attempts).toBe(3);
  });

  it('throws if limit exceeded', () => {
    expect(() => {
      withoutProfanity(() => 'fuck', 10);
    }).toThrow('random generator limit');
  });
});

describe('RandomPhrase', () => {
  it('generates words of correct length', () => {
    const phrase = new RandomPhrase({ numWords: 4 });
    expect(phrase.words.length).toBe(4);
    phrase.words.forEach(word => {
      expect(word.length).toBe(4);
    });
  });

  it('generates uppercase words', () => {
    const phrase = new RandomPhrase({ numWords: 4 });
    phrase.words.forEach(word => {
      expect(word).toBe(word.toUpperCase());
    });
  });

  it('converts to string with separator', () => {
    const phrase = new RandomPhrase({ numWords: 4, separator: '-' });
    const str = phrase.toString();
    expect(str.split('-').length).toBe(4);
  });

  it('uses space as default separator', () => {
    const phrase = new RandomPhrase({ numWords: 2 });
    const str = phrase.toString();
    expect(str).toMatch(/^[A-Z0-9]{4} [A-Z0-9]{4}$/);
  });

  describe('format', () => {
    it('formats string with separators', () => {
      const result = RandomPhrase.format('ABCDEFGH', '-');
      expect(result).toBe('ABCD-EFGH');
    });
  });

  describe('normalize', () => {
    it('normalizes string', () => {
      const result = RandomPhrase.normalize('ABCD-EFGH');
      expect(result.length).toBe(8);
    });
  });
});

describe('PersonalKeyGenerator', () => {
  it('generates key with dashes', async () => {
    const user = { id: '123' };
    let savedKey = '';
    
    const deps = {
      updateUser: async (_userId: string, data: { personalKey: string }) => {
        savedKey = data.personalKey;
      },
      verifyPersonalKey: async () => true,
    };

    const generator = new PersonalKeyGenerator(user, deps);
    const key = await generator.generate();

    expect(key).toMatch(/^[A-Z0-9]{4}(-[A-Z0-9]{4}){3}$/);
    expect(savedKey).toMatch(/^[A-Z0-9]{4}( [A-Z0-9]{4}){3}$/);
  });

  it('normalizes and verifies key', async () => {
    const user = { id: '123' };
    let verifiedKey = '';
    
    const deps = {
      updateUser: async () => {},
      verifyPersonalKey: async (_user: unknown, key: string) => {
        verifiedKey = key;
        return true;
      },
    };

    const generator = new PersonalKeyGenerator(user, deps);
    const result = await generator.verify('ABCD-EFGH-IJKL-MNOP');

    expect(result).toBe(true);
    expect(verifiedKey).toContain(' ');
  });

  it('returns false for invalid key format', async () => {
    const user = { id: '123' };
    
    const deps = {
      updateUser: async () => {},
      verifyPersonalKey: async () => true,
    };

    const generator = new PersonalKeyGenerator(user, deps);
    const result = await generator.verify('short');

    expect(result).toBe(false);
  });
});
