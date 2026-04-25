import { describe, it, expect } from 'vitest';
import {
  EventDisavowalService,
  buildDisavowedEventAnalyticsAttributes,
  validateDisavowedEvent,
  type Event,
  type EventDisavowalDeps,
} from './index';

function createMockDeps(overrides: Partial<EventDisavowalDeps> = {}): EventDisavowalDeps {
  return {
    config: {
      eventDisavowalExpirationHours: 24,
      hmacKey: 'test-key',
      hmacKeyQueue: [],
    },
    findEventByFingerprint: async () => null,
    updateEvent: async () => {},
    getEventUser: async () => ({ id: '123', uuid: 'uuid-123' }),
    fingerprint: (token, key) => `fp_${token}_${key || 'default'}`,
    t: (key) => key,
    ...overrides,
  };
}

function createMockEvent(overrides: Partial<Event> = {}): Event {
  return {
    id: 'event-123',
    eventType: 'sign_in',
    createdAt: new Date(),
    disavowalTokenFingerprint: 'fp_123',
    userId: 'user-123',
    ...overrides,
  };
}

describe('buildDisavowedEventAnalyticsAttributes', () => {
  it('returns empty object for null event', () => {
    const result = buildDisavowedEventAnalyticsAttributes(null);
    expect(result).toEqual({});
  });

  it('returns event attributes', () => {
    const event = createMockEvent({
      ip: '192.168.1.1',
      device: {
        id: 'device-123',
        userAgent: 'Mozilla/5.0',
        lastIp: '10.0.0.1',
        lastUsedAt: new Date('2024-01-01'),
      },
    });
    const user = { id: '123', uuid: 'uuid-123' };

    const result = buildDisavowedEventAnalyticsAttributes(event, user);

    expect(result.eventId).toBe('event-123');
    expect(result.eventType).toBe('sign_in');
    expect(result.eventIp).toBe('192.168.1.1');
    expect(result.userId).toBe('uuid-123');
    expect(result.disavowedDeviceUserAgent).toBe('Mozilla/5.0');
    expect(result.disavowedDeviceLastIp).toBe('10.0.0.1');
  });
});

describe('validateDisavowedEvent', () => {
  it('returns error if event is null', async () => {
    const deps = createMockDeps();
    const result = await validateDisavowedEvent(null, deps);

    expect(result.success).toBe(false);
    expect(result.errors).toContainEqual(
      expect.objectContaining({ field: 'event' })
    );
  });

  it('returns error if event already disavowed', async () => {
    const event = createMockEvent({ disavowaledAt: new Date() });
    const deps = createMockDeps();

    const result = await validateDisavowedEvent(event, deps);

    expect(result.success).toBe(false);
    expect(result.errors).toContainEqual(
      expect.objectContaining({ type: 'event_already_disavowed' })
    );
  });

  it('returns error if event expired', async () => {
    const expiredDate = new Date();
    expiredDate.setHours(expiredDate.getHours() - 48);
    
    const event = createMockEvent({ createdAt: expiredDate });
    const deps = createMockDeps();

    const result = await validateDisavowedEvent(event, deps);

    expect(result.success).toBe(false);
    expect(result.errors).toContainEqual(
      expect.objectContaining({ type: 'event_disavowal_expired' })
    );
  });

  it('returns error if no user', async () => {
    const event = createMockEvent();
    const deps = createMockDeps({
      getEventUser: async () => null,
    });

    const result = await validateDisavowedEvent(event, deps);

    expect(result.success).toBe(false);
    expect(result.errors).toContainEqual(
      expect.objectContaining({ field: 'user' })
    );
  });

  it('returns success for valid event', async () => {
    const event = createMockEvent();
    const deps = createMockDeps();

    const result = await validateDisavowedEvent(event, deps);

    expect(result.success).toBe(true);
    expect(result.errors).toHaveLength(0);
  });
});

describe('EventDisavowalService', () => {
  it('finds event by token', async () => {
    const mockEvent = createMockEvent();
    const deps = createMockDeps({
      findEventByFingerprint: async (fingerprints) => {
        expect(fingerprints).toContain('fp_token123_test-key');
        return mockEvent;
      },
    });

    const service = new EventDisavowalService(deps);
    const event = await service.findEvent('token123');

    expect(event).toBe(mockEvent);
  });

  it('validates event', async () => {
    const mockEvent = createMockEvent();
    const deps = createMockDeps();

    const service = new EventDisavowalService(deps);
    const result = await service.validate(mockEvent);

    expect(result.success).toBe(true);
  });

  it('disavows event', async () => {
    let updatedEventId: string | null = null;
    let updatedData: { disavowaledAt: Date } | undefined;

    const mockEvent = createMockEvent();
    const deps = createMockDeps({
      updateEvent: async (eventId, data) => {
        updatedEventId = eventId;
        updatedData = data;
      },
    });

    const service = new EventDisavowalService(deps);
    await service.disavow(mockEvent);

    expect(updatedEventId).toBe('event-123');
    expect(updatedData).toBeDefined();
    expect(updatedData!.disavowaledAt).toBeInstanceOf(Date);
  });

  it('uses key queue for fingerprints', async () => {
    let receivedFingerprints: string[] = [];

    const deps = createMockDeps({
      config: {
        eventDisavowalExpirationHours: 24,
        hmacKey: 'current-key',
        hmacKeyQueue: ['old-key-1', 'old-key-2'],
      },
      findEventByFingerprint: async (fingerprints) => {
        receivedFingerprints = fingerprints;
        return null;
      },
    });

    const service = new EventDisavowalService(deps);
    await service.findEvent('token');

    expect(receivedFingerprints).toHaveLength(3);
    expect(receivedFingerprints[0]).toContain('current-key');
    expect(receivedFingerprints[1]).toContain('old-key-1');
    expect(receivedFingerprints[2]).toContain('old-key-2');
  });
});
