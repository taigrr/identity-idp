/**
 * HTTP Push - Delivers Security Event Tokens (SETs) via HTTP Push protocol
 * Mirrors: app/services/push_notification/http_push.rb
 *
 * Implements: https://tools.ietf.org/html/draft-ietf-secevent-http-push-00
 */

import * as jose from 'jose';
import { randomBytes } from 'crypto';
import type {
  PushNotificationEvent,
  PushNotificationServiceProvider,
  SetJwtPayload,
  LocalEventEntry,
  RiscDeliveryJobParams,
} from './types';
import { getPushNotificationConfig } from './types';
import { localEventQueue } from './local-event-queue';

/**
 * OIDC key pair for JWT signing
 */
export interface OidcKeyPair {
  privateKey: jose.KeyObject | jose.CryptoKey;
  publicKey: jose.KeyObject | jose.CryptoKey;
  kid: string;
}

/**
 * Agency Identity lookup result
 */
export interface AgencyIdentity {
  uuid: string;
}

/**
 * Service Provider Identity lookup result
 */
export interface ServiceProviderIdentity {
  uuid: string;
}

/**
 * HTTP Push delivery options
 */
export interface HttpPushOptions {
  event: PushNotificationEvent;
  now?: Date;
  keyPair?: OidcKeyPair;
  getUserServiceProviders?: (userId: string) => Promise<PushNotificationServiceProvider[]>;
  getAgencyUuid?: (userId: string, agencyId: string) => Promise<string | null>;
  getServiceProviderIdentityUuid?: (userId: string, issuer: string) => Promise<string | null>;
  queueDeliveryJob?: (params: RiscDeliveryJobParams) => Promise<void>;
}

/**
 * HTTP Push class for delivering SETs
 */
export class HttpPush {
  private event: PushNotificationEvent;
  private now: Date;
  private config = getPushNotificationConfig();
  private keyPair?: OidcKeyPair;
  private getUserServiceProviders: (userId: string) => Promise<PushNotificationServiceProvider[]>;
  private getAgencyUuid: (userId: string, agencyId: string) => Promise<string | null>;
  private getServiceProviderIdentityUuid: (userId: string, issuer: string) => Promise<string | null>;
  private queueDeliveryJob: (params: RiscDeliveryJobParams) => Promise<void>;

  constructor(options: HttpPushOptions) {
    this.event = options.event;
    this.now = options.now ?? new Date();
    this.keyPair = options.keyPair;
    this.getUserServiceProviders = options.getUserServiceProviders ?? (async () => []);
    this.getAgencyUuid = options.getAgencyUuid ?? (async () => null);
    this.getServiceProviderIdentityUuid = options.getServiceProviderIdentityUuid ?? (async () => null);
    this.queueDeliveryJob = options.queueDeliveryJob ?? (async () => {});
  }

  /**
   * Deliver the event to all subscribed service providers
   */
  async deliver(): Promise<void> {
    if (!this.config.enabled) {
      return;
    }

    const serviceProviders = await this.getUserServiceProviders(this.event.user.id);
    const spWithUrls = serviceProviders.filter(sp => sp.push_notification_url);

    for (const serviceProvider of spWithUrls) {
      await this.deliverOne(serviceProvider);
    }
  }

  /**
   * Deliver to a single service provider
   */
  private async deliverOne(serviceProvider: PushNotificationServiceProvider): Promise<void> {
    // Queue for local delivery if enabled (testing/development)
    if (this.config.localEnabled) {
      await this.deliverLocal(serviceProvider);
    }

    // Queue background job for actual delivery
    const jwt = await this.createJwt(serviceProvider);
    await this.queueDeliveryJob({
      pushNotificationUrl: serviceProvider.push_notification_url!,
      jwt,
      eventType: this.event.eventType,
      issuer: serviceProvider.issuer,
    });
  }

  /**
   * Store in local event queue (for testing/development)
   */
  private async deliverLocal(serviceProvider: PushNotificationServiceProvider): Promise<void> {
    const payload = await this.buildJwtPayload(serviceProvider);
    const jwt = await this.createJwt(serviceProvider);

    const localEvent: LocalEventEntry = {
      url: serviceProvider.push_notification_url!,
      payload,
      jwt,
    };

    localEventQueue.push(localEvent);
  }

  /**
   * Create signed JWT (Security Event Token)
   */
  private async createJwt(serviceProvider: PushNotificationServiceProvider): Promise<string> {
    if (!this.keyPair) {
      throw new Error('OIDC key pair not configured for JWT signing');
    }

    const payload = await this.buildJwtPayload(serviceProvider);

    const jwt = await new jose.SignJWT(payload as unknown as jose.JWTPayload)
      .setProtectedHeader({
        alg: 'RS256',
        typ: 'secevent+jwt',
        kid: this.keyPair.kid,
      })
      .sign(this.keyPair.privateKey);

    return jwt;
  }

  /**
   * Build JWT payload for the SET
   */
  private async buildJwtPayload(serviceProvider: PushNotificationServiceProvider): Promise<SetJwtPayload> {
    const agencyUuid = await this.getAgencyUuidForServiceProvider(serviceProvider);
    const aud = this.shouldSendAudClientId(serviceProvider)
      ? serviceProvider.issuer
      : serviceProvider.push_notification_url!;

    const jti = randomBytes(16).toString('hex');
    const iat = Math.floor(this.now.getTime() / 1000);
    const exp = iat + (12 * 60 * 60); // 12 hours

    return {
      iss: this.config.rootUrl,
      iat,
      exp,
      jti,
      aud,
      events: {
        [this.event.eventType]: this.event.payload(agencyUuid),
      },
    };
  }

  /**
   * Determine if we should send client_id as audience
   */
  private shouldSendAudClientId(serviceProvider: PushNotificationServiceProvider): boolean {
    return this.config.sendClientIdInAud && serviceProvider.receives_client_id_in_risc;
  }

  /**
   * Get agency UUID or SP identity UUID for the user
   */
  private async getAgencyUuidForServiceProvider(
    serviceProvider: PushNotificationServiceProvider
  ): Promise<string> {
    // Try agency identity first
    if (serviceProvider.agency_id) {
      const agencyUuid = await this.getAgencyUuid(
        this.event.user.id,
        serviceProvider.agency_id
      );
      if (agencyUuid) {
        return agencyUuid;
      }
    }

    // Fall back to service provider identity
    const spUuid = await this.getServiceProviderIdentityUuid(
      this.event.user.id,
      serviceProvider.issuer
    );

    return spUuid || this.event.user.uuid;
  }
}

/**
 * Static delivery method (convenience)
 */
export async function deliverPushNotification(options: HttpPushOptions): Promise<void> {
  const httpPush = new HttpPush(options);
  await httpPush.deliver();
}

/**
 * Create HTTP Push instance
 */
export function createHttpPush(options: HttpPushOptions): HttpPush {
  return new HttpPush(options);
}
