/**
 * Pwned Passwords Module
 * Migrated from Rails app/services/pwned_passwords/lookup_password.rb
 * and app/services/binary_search_sorted_hash_file.rb
 * 
 * Checks if a password has been found in data breaches using a
 * binary search against a sorted file of SHA1 hashes.
 */

import { createHash } from 'crypto';
import * as fs from 'fs';

const RECORD_SIZE = 41;

export interface PwnedPasswordsOptions {
  filePath: string;
}

export class BinarySearchSortedHashFile {
  private filePath: string;

  constructor(filePath: string) {
    this.filePath = filePath;
  }

  async isPwned(password: string): Promise<boolean> {
    const key = createHash('sha1').update(password).digest('hex').toUpperCase();
    
    return new Promise((resolve, reject) => {
      fs.stat(this.filePath, (err, stats) => {
        if (err) {
          if (err.code === 'ENOENT') {
            resolve(false);
            return;
          }
          reject(err);
          return;
        }

        let min = 0;
        let max = Math.floor(stats.size / RECORD_SIZE);
        let middle = 0;

        fs.open(this.filePath, 'r', (err, fd) => {
          if (err) {
            reject(err);
            return;
          }

          const buffer = Buffer.alloc(RECORD_SIZE);

          const search = (): void => {
            if (max <= min) {
              fs.close(fd, () => resolve(false));
              return;
            }

            const oldMiddle = middle;
            middle = Math.floor((max + min) / 2);

            if (middle === oldMiddle) {
              fs.close(fd, () => resolve(false));
              return;
            }

            const position = middle * RECORD_SIZE;

            fs.read(fd, buffer, 0, RECORD_SIZE, position, (err, bytesRead) => {
              if (err) {
                fs.close(fd, () => reject(err));
                return;
              }

              if (bytesRead === 0) {
                fs.close(fd, () => resolve(false));
                return;
              }

              const line = buffer.toString('utf8', 0, bytesRead).trim();
              const val = line.replace(/[\r\n]/g, '');

              if (val === key) {
                fs.close(fd, () => resolve(true));
                return;
              }

              if (val > key) {
                max = middle;
              } else {
                min = middle;
              }

              search();
            });
          };

          search();
        });
      });
    });
  }
}

export async function lookupPassword(
  password: string,
  options: PwnedPasswordsOptions
): Promise<boolean> {
  const searcher = new BinarySearchSortedHashFile(options.filePath);
  return searcher.isPwned(password);
}

export async function lookupPasswordWithApi(password: string): Promise<boolean> {
  const sha1 = createHash('sha1').update(password).digest('hex').toUpperCase();
  const prefix = sha1.slice(0, 5);
  const suffix = sha1.slice(5);

  try {
    const response = await fetch(`https://api.pwnedpasswords.com/range/${prefix}`, {
      headers: {
        'User-Agent': 'Login.gov-Identity-IdP',
      },
    });

    if (!response.ok) {
      return false;
    }

    const text = await response.text();
    const lines = text.split('\n');

    for (const line of lines) {
      const [hash] = line.split(':');
      if (hash.trim().toUpperCase() === suffix) {
        return true;
      }
    }

    return false;
  } catch {
    return false;
  }
}
