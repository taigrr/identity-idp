/**
 * Base64 encoding utilities
 * Mirrors: app/services/encryption/encodable.rb
 */

export function encode(data: Buffer | Uint8Array): string {
  return Buffer.from(data).toString('base64');
}

export function decode(text: string): Buffer {
  return Buffer.from(text, 'base64');
}

export function isValidBase64(text: string): boolean {
  try {
    const decoded = Buffer.from(text, 'base64');
    return decoded.toString('base64') === text;
  } catch {
    return false;
  }
}
