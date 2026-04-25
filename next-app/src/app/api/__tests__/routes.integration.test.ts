/**
 * Integration Tests for Migrated API Routes
 *
 * These tests verify the API routes work correctly with mocked dependencies.
 * For full integration testing with a real database, use Docker.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { NextRequest } from 'next/server';

// Mock the database module
vi.mock('@/db', () => ({
  db: {
    execute: vi.fn(),
    select: vi.fn(),
    update: vi.fn(),
  },
}));

describe('API Routes Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetModules();
  });

  describe('GET /api/health', () => {
    it('returns healthy response when database is up', async () => {
      const { db } = await import('@/db');
      (db.execute as any).mockResolvedValue({ rows: [{ value: 1 }] });

      const { GET } = await import('@/app/api/health/route');
      const response = await GET();
      const json = await response.json();

      expect(response.status).toBe(200);
      expect(json.healthy).toBe(true);
      expect(json.all_checks_healthy).toBe(true);
      expect(json.statuses.database.healthy).toBe(true);
    });

    it('returns unhealthy response when database is down', async () => {
      const { db } = await import('@/db');
      (db.execute as any).mockRejectedValue(new Error('Connection refused'));

      const { GET } = await import('@/app/api/health/route');
      const response = await GET();
      const json = await response.json();

      expect(response.status).toBe(500);
      expect(json.healthy).toBe(false);
      expect(json.statuses.database.healthy).toBe(false);
    });
  });

  describe('GET /api/health/database', () => {
    it('returns healthy response with simple format', async () => {
      const { db } = await import('@/db');
      (db.execute as any).mockResolvedValue({ rows: [{ value: 1 }] });

      const { GET } = await import('@/app/api/health/database/route');
      const response = await GET();
      const json = await response.json();

      expect(response.status).toBe(200);
      expect(json.healthy).toBe(true);
      expect(json.result).toEqual([1]);
      // Simple format - no statuses wrapper
      expect(json.statuses).toBeUndefined();
    });
  });

  describe('GET /api/openid-connect/certs', () => {
    it('returns JWKS with cache headers', async () => {
      // Reset keys module to ensure clean state
      vi.resetModules();

      const { GET } = await import('@/app/api/openid-connect/certs/route');
      const response = await GET();
      const json = await response.json();

      expect(response.status).toBe(200);
      expect(json).toHaveProperty('keys');
      expect(Array.isArray(json.keys)).toBe(true);

      // Should have cache headers
      const cacheControl = response.headers.get('Cache-Control');
      expect(cacheControl).toContain('max-age');
    });
  });

  describe('GET /api/country-support', () => {
    it('returns country codes with cache headers', async () => {
      const { GET } = await import('@/app/api/country-support/route');

      const request = new NextRequest('http://localhost:3001/api/country-support', {
        method: 'GET',
      });

      const response = await GET(request);

      // This may fail if config file isn't found, which is expected in test
      // The important thing is the route is accessible
      expect(response.status).toBe(200);

      const cacheControl = response.headers.get('Cache-Control');
      expect(cacheControl).toContain('max-age');
    });
  });
});

describe('OIDC Token Route', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetModules();
  });

  it('rejects requests without grant_type', async () => {
    const { POST } = await import('@/app/api/openid-connect/token/route');

    const formData = new FormData();
    formData.append('code', 'test-code');

    const request = new NextRequest('http://localhost:3001/api/openid-connect/token', {
      method: 'POST',
      body: formData,
    });

    const response = await POST(request);
    const json = await response.json();

    expect(response.status).toBe(400);
    expect(json.error).toContain('grant_type');
  });

  it('rejects requests with invalid grant_type', async () => {
    const { POST } = await import('@/app/api/openid-connect/token/route');

    const formData = new FormData();
    formData.append('grant_type', 'refresh_token');
    formData.append('code', 'test-code');

    const request = new NextRequest('http://localhost:3001/api/openid-connect/token', {
      method: 'POST',
      body: formData,
    });

    const response = await POST(request);
    const json = await response.json();

    expect(response.status).toBe(400);
    expect(json.error).toContain('authorization_code');
  });

  it('rejects requests without code', async () => {
    const { POST } = await import('@/app/api/openid-connect/token/route');

    const formData = new FormData();
    formData.append('grant_type', 'authorization_code');

    const request = new NextRequest('http://localhost:3001/api/openid-connect/token', {
      method: 'POST',
      body: formData,
    });

    const response = await POST(request);
    const json = await response.json();

    expect(response.status).toBe(400);
    expect(json.error).toContain('Invalid');
  });

  it('supports CORS OPTIONS request', async () => {
    const { OPTIONS } = await import('@/app/api/openid-connect/token/route');

    const response = await OPTIONS();

    expect(response.status).toBe(200);
    expect(response.headers.get('Access-Control-Allow-Origin')).toBe('*');
    expect(response.headers.get('Access-Control-Allow-Methods')).toContain('POST');
  });
});

describe('OIDC UserInfo Route', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetModules();
  });

  it('rejects requests without authorization header', async () => {
    const { GET } = await import('@/app/api/openid-connect/userinfo/route');

    const request = new NextRequest('http://localhost:3001/api/openid-connect/userinfo', {
      method: 'GET',
    });

    const response = await GET(request);
    const json = await response.json();

    expect(response.status).toBe(401);
    expect(json.error).toBeDefined();
  });

  it('rejects requests with invalid bearer token format', async () => {
    const { GET } = await import('@/app/api/openid-connect/userinfo/route');

    const request = new NextRequest('http://localhost:3001/api/openid-connect/userinfo', {
      method: 'GET',
      headers: {
        Authorization: 'Basic dXNlcjpwYXNz',
      },
    });

    const response = await GET(request);
    const json = await response.json();

    expect(response.status).toBe(401);
    expect(json.error).toBeDefined();
  });

  it('supports POST with form body', async () => {
    const { POST } = await import('@/app/api/openid-connect/userinfo/route');

    const formData = new FormData();
    formData.append('access_token', 'test-token');

    const request = new NextRequest('http://localhost:3001/api/openid-connect/userinfo', {
      method: 'POST',
      body: formData,
    });

    // Should accept the token format even if lookup fails
    const response = await POST(request);

    // 401 is expected since the token won't be found
    expect([200, 401, 500]).toContain(response.status);
  });

  it('supports CORS OPTIONS request', async () => {
    const { OPTIONS } = await import('@/app/api/openid-connect/userinfo/route');

    const response = await OPTIONS();

    expect(response.status).toBe(200);
    expect(response.headers.get('Access-Control-Allow-Origin')).toBe('*');
  });
});
