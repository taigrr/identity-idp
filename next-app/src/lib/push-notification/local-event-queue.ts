/**
 * Local Event Queue - In-memory queue for local testing/development
 * Mirrors: app/services/push_notification/local_event_queue.rb
 */

import type { LocalEventEntry } from './types';

/**
 * Local event queue for testing/development
 * Stores events in memory instead of delivering via HTTP
 */
class LocalEventQueue {
  private events: LocalEventEntry[] = [];

  /**
   * Get all events
   */
  getAll(): LocalEventEntry[] {
    return [...this.events];
  }

  /**
   * Push an event to the queue
   */
  push(event: LocalEventEntry): void {
    this.events.push(event);
  }

  /**
   * Clear all events
   */
  clear(): void {
    this.events = [];
  }

  /**
   * Get event count
   */
  get length(): number {
    return this.events.length;
  }

  /**
   * Check if queue is empty
   */
  isEmpty(): boolean {
    return this.events.length === 0;
  }
}

/**
 * Singleton instance
 */
export const localEventQueue = new LocalEventQueue();

/**
 * Factory function
 */
export function createLocalEventQueue(): LocalEventQueue {
  return new LocalEventQueue();
}

export { LocalEventQueue };
