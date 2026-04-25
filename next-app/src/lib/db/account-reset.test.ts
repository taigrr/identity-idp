/**
 * Account Reset Service Tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  createAccountResetRequest,
  findByRequestToken,
  findByGrantedToken,
  getPendingRequestForUser,
  validateCancelToken,
  validateGrantedToken,
  cancelAccountResetRequest,
  grantAccountResetRequest,
  deleteUserAccount,
  hasPendingResetRequest,
} from './account-reset';

// Mock the database
vi.mock('@/db', () => ({
  db: {
    query: {
      accountResetRequests: {
        findFirst: vi.fn().mockResolvedValue(null),
      },
      users: {
        findFirst: vi.fn().mockResolvedValue(null),
      },
    },
    insert: vi.fn().mockReturnValue({
      values: vi.fn().mockReturnValue({
        returning: vi.fn().mockResolvedValue([{
          id: 1,
          userId: 1,
          requestToken: 'test-token',
          requestedAt: new Date(),
          cancelledAt: null,
          grantedAt: null,
          grantedToken: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        }]),
      }),
    }),
    update: vi.fn().mockReturnValue({
      set: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([{ id: 1 }]),
        }),
      }),
    }),
    transaction: vi.fn().mockImplementation(async (fn) => {
      const tx = {
        insert: vi.fn().mockReturnValue({
          values: vi.fn().mockResolvedValue(undefined),
        }),
        delete: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue(undefined),
        }),
      };
      return fn(tx);
    }),
  },
  accountResetRequests: {},
  deletedUsers: {},
  users: {},
  emailAddresses: {},
}));

describe('Account Reset Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('createAccountResetRequest', () => {
    it('creates a new request', async () => {
      const result = await createAccountResetRequest(1, 'test-issuer');
      expect(result.success).toBe(true);
      expect(result.request).toBeDefined();
    });
  });

  describe('validateCancelToken', () => {
    it('returns invalid for empty token', async () => {
      const result = await validateCancelToken('');
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Token is required');
    });

    it('returns invalid for non-existent token', async () => {
      const result = await validateCancelToken('non-existent');
      expect(result.valid).toBe(false);
    });
  });

  describe('validateGrantedToken', () => {
    it('returns invalid for empty token', async () => {
      const result = await validateGrantedToken('');
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Token is required');
    });
  });

  describe('hasPendingResetRequest', () => {
    it('returns boolean', async () => {
      const result = await hasPendingResetRequest(1);
      expect(typeof result).toBe('boolean');
    });
  });
});
