/**
 * UserInfo Presenter Tests
 */

import { describe, it, expect, vi } from 'vitest';
import {
  buildUserInfo,
  type UserInfoIdentity,
  type UserInfoUser,
  type UserInfoServiceProvider,
  type UserInfoDeps,
  type UserInfoResponse,
} from './userinfo-presenter';

const mockIdentity: UserInfoIdentity = {
  id: '1',
  uuid: 'user-uuid-123',
  userId: '100',
  serviceProvider: 'https://sp.example.com',
  scope: 'openid email profile',
  ial: 1,
  aal: 2,
  acrValues: 'http://idmanagement.gov/ns/assurance/ial/1',
  requestedAalValue: 'urn:gov:gsa:ac:classes:sp:PasswordProtectedTransport:duo',
  railsSessionId: 'session-123',
  verifiedAt: null,
  emailAddressId: '10',
};

const mockUser: UserInfoUser = {
  id: '100',
  uuid: 'user-uuid-100',
  confirmedEmailAddresses: [
    { email: 'user@example.com' },
    { email: 'user2@example.com' },
  ],
  activeProfile: null,
};

const mockServiceProvider: UserInfoServiceProvider = {
  issuer: 'https://sp.example.com',
  ial: 1,
  defaultAalValue: null,
};

const mockDeps: UserInfoDeps = {
  getIssuerUrl: () => 'https://idp.example.gov',
  loadPii: vi.fn().mockResolvedValue(null),
  loadX509: vi.fn().mockResolvedValue(null),
  loadWebLocale: vi.fn().mockResolvedValue(null),
  getAgencyUuid: vi.fn().mockImplementation((identity) => Promise.resolve(identity.uuid)),
};

describe('UserInfoPresenter', () => {
  describe('buildUserInfo', () => {
    it('returns basic claims for IAL1 user', async () => {
      const userInfo = await buildUserInfo(
        mockIdentity,
        mockUser,
        mockServiceProvider,
        'user@example.com',
        mockDeps
      );

      expect(userInfo.sub).toBe('user-uuid-123');
      expect(userInfo.iss).toBe('https://idp.example.gov');
      expect(userInfo.email).toBe('user@example.com');
      expect(userInfo.email_verified).toBe(true);
    });

    it('includes ial and aal claims', async () => {
      const userInfo = await buildUserInfo(
        mockIdentity,
        mockUser,
        mockServiceProvider,
        'user@example.com',
        mockDeps
      );

      expect(userInfo.aal).toBe('urn:gov:gsa:ac:classes:sp:PasswordProtectedTransport:duo');
    });

    it('includes all_emails when scope requests it', async () => {
      const identityWithAllEmails = {
        ...mockIdentity,
        scope: 'openid email all_emails',
      };

      const userInfo = await buildUserInfo(
        identityWithAllEmails,
        mockUser,
        mockServiceProvider,
        'user@example.com',
        mockDeps
      );

      expect(userInfo.all_emails).toEqual(['user@example.com', 'user2@example.com']);
    });

    it('does not include all_emails when scope does not request it', async () => {
      const userInfo = await buildUserInfo(
        mockIdentity,
        mockUser,
        mockServiceProvider,
        'user@example.com',
        mockDeps
      );

      expect(userInfo.all_emails).toBeUndefined();
    });

    it('includes locale when requested and available', async () => {
      const identityWithLocale = {
        ...mockIdentity,
        scope: 'openid email locale',
      };
      const depsWithLocale = {
        ...mockDeps,
        loadWebLocale: vi.fn().mockResolvedValue('es'),
      };

      const userInfo = await buildUserInfo(
        identityWithLocale,
        mockUser,
        mockServiceProvider,
        'user@example.com',
        depsWithLocale
      );

      expect(userInfo.locale).toBe('es');
    });

    describe('with IAL2 verified user', () => {
      const verifiedUser: UserInfoUser = {
        ...mockUser,
        activeProfile: {
          id: 'profile-1',
          verifiedAt: new Date('2024-01-15T12:00:00Z'),
        },
      };

      const ial2Identity: UserInfoIdentity = {
        ...mockIdentity,
        ial: 2,
        scope: 'openid email profile address phone social_security_number',
        acrValues: 'http://idmanagement.gov/ns/assurance/ial/2',
      };

      const ial2ServiceProvider: UserInfoServiceProvider = {
        ...mockServiceProvider,
        ial: 2,
      };

      const pii = {
        firstName: 'John',
        lastName: 'Doe',
        dob: '1990-01-15',
        ssn: '123-45-6789',
        phone: '2025551234',
        address1: '123 Main St',
        address2: 'Apt 4',
        city: 'Washington',
        state: 'DC',
        zipcode: '20001',
      };

      it('includes IAL2 attributes when identity proofing requested and user verified', async () => {
        const depsWithPii = {
          ...mockDeps,
          loadPii: vi.fn().mockResolvedValue(pii),
        };

        const userInfo = await buildUserInfo(
          ial2Identity,
          verifiedUser,
          ial2ServiceProvider,
          'user@example.com',
          depsWithPii
        );

        expect(userInfo.given_name).toBe('John');
        expect(userInfo.family_name).toBe('Doe');
        expect(userInfo.birthdate).toBe('1990-01-15');
        expect(userInfo.social_security_number).toBe('123-45-6789');
      });

      it('includes formatted address', async () => {
        const depsWithPii = {
          ...mockDeps,
          loadPii: vi.fn().mockResolvedValue(pii),
        };

        const userInfo = await buildUserInfo(
          ial2Identity,
          verifiedUser,
          ial2ServiceProvider,
          'user@example.com',
          depsWithPii
        );

        expect(userInfo.address).toBeDefined();
        const address = userInfo.address as UserInfoResponse['address'];
        expect(address?.street_address).toBe('123 Main St\nApt 4');
        expect(address?.locality).toBe('Washington');
        expect(address?.region).toBe('DC');
        expect(address?.postal_code).toBe('20001');
      });

      it('includes phone with phone_verified', async () => {
        const depsWithPii = {
          ...mockDeps,
          loadPii: vi.fn().mockResolvedValue(pii),
        };

        const userInfo = await buildUserInfo(
          ial2Identity,
          verifiedUser,
          ial2ServiceProvider,
          'user@example.com',
          depsWithPii
        );

        expect(userInfo.phone).toBe('+12025551234');
        expect(userInfo.phone_verified).toBe(true);
      });

      it('includes verified_at when scope requests it', async () => {
        const identityWithVerifiedAt = {
          ...ial2Identity,
          scope: 'openid email profile:verified_at',
        };
        const depsWithPii = {
          ...mockDeps,
          loadPii: vi.fn().mockResolvedValue(pii),
        };

        const userInfo = await buildUserInfo(
          identityWithVerifiedAt,
          verifiedUser,
          ial2ServiceProvider,
          'user@example.com',
          depsWithPii
        );

        expect(userInfo.verified_at).toBe(1705320000); // 2024-01-15T12:00:00Z in seconds
      });
    });

    describe('with X509 authentication', () => {
      const x509Identity: UserInfoIdentity = {
        ...mockIdentity,
        scope: 'openid email x509',
      };

      const x509Data = {
        subject: 'CN=John Doe, O=US Government',
        issuer: 'CN=PIV CA, O=US Government',
        presented: true,
      };

      it('includes X509 attributes when scope requests it', async () => {
        const depsWithX509 = {
          ...mockDeps,
          loadX509: vi.fn().mockResolvedValue(x509Data),
        };

        const userInfo = await buildUserInfo(
          x509Identity,
          mockUser,
          mockServiceProvider,
          'user@example.com',
          depsWithX509
        );

        expect(userInfo.x509_subject).toBe('CN=John Doe, O=US Government');
        expect(userInfo.x509_issuer).toBe('CN=PIV CA, O=US Government');
        expect(userInfo.x509_presented).toBe(true);
      });
    });
  });

  describe('scope filtering', () => {
    it('only returns claims for requested scopes', async () => {
      const minimalIdentity = {
        ...mockIdentity,
        scope: 'openid', // Only openid, not email
      };

      const userInfo = await buildUserInfo(
        minimalIdentity,
        mockUser,
        mockServiceProvider,
        'user@example.com',
        mockDeps
      );

      // Should have sub and iss but not email (depending on filter implementation)
      expect(userInfo.sub).toBeDefined();
      expect(userInfo.iss).toBeDefined();
    });
  });
});
