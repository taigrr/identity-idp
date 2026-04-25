/**
 * Remember Device Cookie
 * Migrated from Rails app/services/remember_device_cookie.rb
 * 
 * Manages "Remember this device" functionality for MFA bypass.
 */

import { randomBytes } from 'crypto';

export const COOKIE_ROLE = 'remember_me';

export interface RememberDeviceCookieData {
  userId: string;
  createdAt: Date;
}

export interface RememberDeviceCookieJson {
  user_id: string;
  created_at: string;
  role: string;
  entropy: string;
}

export interface User {
  id: string;
  rememberDeviceRevokedAt?: Date | null;
}

export class RememberDeviceCookie {
  readonly userId: string;
  readonly createdAt: Date;

  constructor(data: RememberDeviceCookieData) {
    this.userId = data.userId;
    this.createdAt = data.createdAt;
  }

  static fromJson(json: string): RememberDeviceCookie {
    const parsed: RememberDeviceCookieJson = JSON.parse(json);
    
    if (parsed.role !== COOKIE_ROLE) {
      throw new Error(`RememberDeviceCookie role '${parsed.role}' did not match '${COOKIE_ROLE}'`);
    }

    return new RememberDeviceCookie({
      userId: parsed.user_id,
      createdAt: new Date(parsed.created_at),
    });
  }

  toJson(): string {
    const data: RememberDeviceCookieJson = {
      user_id: this.userId,
      created_at: this.createdAt.toISOString(),
      role: COOKIE_ROLE,
      entropy: randomBytes(32).toString('base64'),
    };
    return JSON.stringify(data);
  }

  validForUser(user: User, expirationIntervalMs: number): boolean {
    if (user.id !== this.userId) {
      return false;
    }

    if (user.rememberDeviceRevokedAt && this.revoked(user.rememberDeviceRevokedAt)) {
      return false;
    }

    if (this.expired(expirationIntervalMs)) {
      return false;
    }

    return true;
  }

  private expired(intervalMs: number): boolean {
    const expiresAt = new Date(Date.now() - intervalMs);
    return this.createdAt < expiresAt;
  }

  private revoked(revokedAt: Date): boolean {
    return this.createdAt < revokedAt;
  }
}

export function createRememberDeviceCookie(
  userId: string,
  createdAt: Date = new Date()
): RememberDeviceCookie {
  return new RememberDeviceCookie({ userId, createdAt });
}

export function parseRememberDeviceCookie(json: string): RememberDeviceCookie | null {
  try {
    return RememberDeviceCookie.fromJson(json);
  } catch {
    return null;
  }
}
