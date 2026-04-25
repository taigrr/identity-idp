/**
 * Event Disavowal Module
 * Migrated from Rails app/services/event_disavowal/
 * 
 * Allows users to disavow events that were performed without their consent
 * (e.g., account compromise). Uses fingerprinted tokens for secure lookup.
 */

export interface Event {
  id: string;
  eventType: string;
  createdAt: Date;
  disavowalTokenFingerprint: string;
  disavowalTokenSalt?: string;
  disavowalToken?: string;
  disavowaledAt?: Date | null;
  ip?: string;
  userId: string;
  device?: Device;
}

export interface Device {
  id: string;
  userAgent?: string;
  lastIp?: string;
  lastUsedAt?: Date;
}

export interface EventUser {
  id: string;
  uuid: string;
}

export interface DisavowalAnalyticsAttributes {
  eventId?: string;
  eventType?: string;
  eventCreatedAt?: Date;
  eventIp?: string;
  userId?: string;
  disavowedDeviceUserAgent?: string;
  disavowedDeviceLastIp?: string;
  disavowedDeviceLastUsedAt?: Date;
}

export interface ValidationError {
  field: string;
  message: string;
  type?: string;
}

export interface ValidationResult {
  success: boolean;
  errors: ValidationError[];
  extra: DisavowalAnalyticsAttributes;
}

export interface EventDisavowalConfig {
  eventDisavowalExpirationHours: number;
  hmacKey: string;
  hmacKeyQueue?: string[];
}

export interface EventDisavowalDeps {
  config: EventDisavowalConfig;
  findEventByFingerprint: (fingerprints: string[]) => Promise<Event | null>;
  updateEvent: (eventId: string, data: { disavowaledAt: Date }) => Promise<void>;
  getEventUser: (event: Event) => Promise<EventUser | null>;
  fingerprint: (token: string, key?: string) => string;
  t: (key: string) => string;
}

export function buildDisavowedEventAnalyticsAttributes(
  event: Event | null,
  user?: EventUser | null
): DisavowalAnalyticsAttributes {
  if (!event) {
    return {};
  }

  const device = event.device;

  return {
    eventId: event.id,
    eventType: event.eventType,
    eventCreatedAt: event.createdAt,
    eventIp: event.ip,
    userId: user?.uuid,
    disavowedDeviceUserAgent: device?.userAgent,
    disavowedDeviceLastIp: device?.lastIp,
    disavowedDeviceLastUsedAt: device?.lastUsedAt,
  };
}

export async function findDisavowedEvent(
  disavowalToken: string,
  deps: EventDisavowalDeps
): Promise<Event | null> {
  const fingerprints = getDisavowalTokenFingerprints(disavowalToken, deps);
  return deps.findEventByFingerprint(fingerprints);
}

function getDisavowalTokenFingerprints(
  token: string,
  deps: EventDisavowalDeps
): string[] {
  const currentFingerprint = deps.fingerprint(token, deps.config.hmacKey);
  
  const previousFingerprints = (deps.config.hmacKeyQueue ?? []).map(
    (key) => deps.fingerprint(token, key)
  );

  return [currentFingerprint, ...previousFingerprints];
}

export async function validateDisavowedEvent(
  event: Event | null,
  deps: EventDisavowalDeps
): Promise<ValidationResult> {
  const errors: ValidationError[] = [];
  let user: EventUser | null = null;

  if (!event) {
    errors.push({
      field: 'event',
      message: deps.t('event_disavowals.errors.event_not_found'),
    });
  } else {
    user = await deps.getEventUser(event);

    if (!user) {
      errors.push({
        field: 'user',
        message: deps.t('event_disavowals.errors.no_account'),
      });
    }

    if (event.disavowaledAt) {
      errors.push({
        field: 'event',
        message: deps.t('event_disavowals.errors.event_already_disavowed'),
        type: 'event_already_disavowed',
      });
    }

    const expirationMs = deps.config.eventDisavowalExpirationHours * 60 * 60 * 1000;
    const expirationTime = new Date(Date.now() - expirationMs);
    
    if (event.createdAt <= expirationTime) {
      errors.push({
        field: 'event',
        message: deps.t('event_disavowals.errors.event_disavowal_expired'),
        type: 'event_disavowal_expired',
      });
    }
  }

  return {
    success: errors.length === 0,
    errors,
    extra: buildDisavowedEventAnalyticsAttributes(event, user),
  };
}

export async function disavowEvent(
  event: Event,
  deps: EventDisavowalDeps
): Promise<void> {
  await deps.updateEvent(event.id, { disavowaledAt: new Date() });
}

export class EventDisavowalService {
  private deps: EventDisavowalDeps;

  constructor(deps: EventDisavowalDeps) {
    this.deps = deps;
  }

  async findEvent(disavowalToken: string): Promise<Event | null> {
    return findDisavowedEvent(disavowalToken, this.deps);
  }

  async validate(event: Event | null): Promise<ValidationResult> {
    return validateDisavowedEvent(event, this.deps);
  }

  async disavow(event: Event): Promise<void> {
    return disavowEvent(event, this.deps);
  }

  buildAnalyticsAttributes(
    event: Event | null,
    user?: EventUser | null
  ): DisavowalAnalyticsAttributes {
    return buildDisavowedEventAnalyticsAttributes(event, user);
  }
}

export function createEventDisavowalService(
  deps: EventDisavowalDeps
): EventDisavowalService {
  return new EventDisavowalService(deps);
}
