/**
 * Job Queue
 * Mirrors: GoodJob queue setup
 *
 * Uses BullMQ with Redis backend
 */

import { Queue, type QueueOptions } from 'bullmq';
import { getConfig } from '../config';

export type JobName =
  | 'sendEmail'
  | 'sendSms'
  | 'sendVoice'
  | 'accountResetGrant'
  | 'accountResetExpire'
  | 'gpoLetter'
  | 'gpoReminder'
  | 'gpoExpire'
  | 'uspsProofing'
  | 'fraudCheck'
  | 'newDeviceAlert'
  | 'addressProofing'
  | 'phoneOptOutSync'
  | 'heartbeat';

export type QueueName = 'default' | 'mailers' | 'sms' | 'low' | 'high';

const queues = new Map<QueueName, Queue>();

function getRedisConnection() {
  const config = getConfig();
  return {
    host: new URL(config.redisUrl).hostname,
    port: parseInt(new URL(config.redisUrl).port || '6379'),
    password: new URL(config.redisUrl).password || undefined,
  };
}

/**
 * Get or create a queue by name
 */
export function getQueue(name: QueueName = 'default'): Queue {
  if (!queues.has(name)) {
    const options: QueueOptions = {
      connection: getRedisConnection(),
      defaultJobOptions: {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 1000,
        },
        removeOnComplete: {
          count: 1000,
          age: 24 * 60 * 60, // 24 hours
        },
        removeOnFail: {
          count: 5000,
          age: 7 * 24 * 60 * 60, // 7 days
        },
      },
    };

    // Set different defaults per queue
    if (name === 'mailers') {
      options.defaultJobOptions = {
        ...options.defaultJobOptions,
        attempts: 5,
        backoff: {
          type: 'exponential',
          delay: 5000,
        },
      };
    } else if (name === 'sms') {
      options.defaultJobOptions = {
        ...options.defaultJobOptions,
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 2000,
        },
      };
    } else if (name === 'low') {
      options.defaultJobOptions = {
        ...options.defaultJobOptions,
        priority: 10,
      };
    } else if (name === 'high') {
      options.defaultJobOptions = {
        ...options.defaultJobOptions,
        priority: 1,
      };
    }

    queues.set(name, new Queue(name, options));
  }

  return queues.get(name)!;
}

/**
 * Add a job to a queue
 */
export async function enqueue<T>(
  jobName: JobName,
  data: T,
  options: {
    queue?: QueueName;
    delay?: number;
    priority?: number;
    jobId?: string;
  } = {}
): Promise<string> {
  const queue = getQueue(options.queue || 'default');
  
  const job = await queue.add(jobName, data, {
    delay: options.delay,
    priority: options.priority,
    jobId: options.jobId,
  });

  return job.id || '';
}

/**
 * Schedule a job for later
 */
export async function scheduleJob<T>(
  jobName: JobName,
  data: T,
  runAt: Date,
  options: {
    queue?: QueueName;
    jobId?: string;
  } = {}
): Promise<string> {
  const delay = Math.max(0, runAt.getTime() - Date.now());
  return enqueue(jobName, data, { ...options, delay });
}

/**
 * Schedule a recurring job
 */
export async function scheduleRecurring(
  jobName: JobName,
  pattern: string, // cron pattern
  data: unknown = {},
  options: { queue?: QueueName } = {}
): Promise<void> {
  const queue = getQueue(options.queue || 'default');
  
  await queue.upsertJobScheduler(
    jobName,
    { pattern },
    {
      name: jobName,
      data,
    }
  );
}

/**
 * Close all queues
 */
export async function closeQueues(): Promise<void> {
  const closePromises = Array.from(queues.values()).map((q) => q.close());
  await Promise.all(closePromises);
  queues.clear();
}
