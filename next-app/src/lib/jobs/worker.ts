/**
 * Job Worker
 * Mirrors: GoodJob worker process
 *
 * Processes jobs from BullMQ queues
 */

import { Worker, type Job, type WorkerOptions } from 'bullmq';
import { getConfig } from '../config';
import type { JobName, QueueName } from './queue';

// Job handlers registry
type JobHandler<T = unknown> = (data: T) => Promise<void>;
const handlers = new Map<JobName, JobHandler>();

/**
 * Register a job handler
 */
export function registerHandler<T>(jobName: JobName, handler: JobHandler<T>): void {
  handlers.set(jobName, handler as JobHandler);
}

/**
 * Process a job
 */
async function processJob(job: Job): Promise<void> {
  const handler = handlers.get(job.name as JobName);
  
  if (!handler) {
    throw new Error(`No handler registered for job: ${job.name}`);
  }

  console.log(`Processing job ${job.name} (${job.id})`);
  
  try {
    await handler(job.data);
    console.log(`Completed job ${job.name} (${job.id})`);
  } catch (error) {
    console.error(`Failed job ${job.name} (${job.id}):`, error);
    throw error;
  }
}

function getRedisConnection() {
  const config = getConfig();
  return {
    host: new URL(config.redisUrl).hostname,
    port: parseInt(new URL(config.redisUrl).port || '6379'),
    password: new URL(config.redisUrl).password || undefined,
  };
}

const workers = new Map<QueueName, Worker>();

/**
 * Start a worker for a queue
 */
export function startWorker(
  queueName: QueueName = 'default',
  options: Partial<WorkerOptions> = {}
): Worker {
  if (workers.has(queueName)) {
    return workers.get(queueName)!;
  }

  const workerOptions: WorkerOptions = {
    connection: getRedisConnection(),
    concurrency: 5,
    ...options,
  };

  const worker = new Worker(queueName, processJob, workerOptions);

  worker.on('completed', (job) => {
    console.log(`Job ${job.name} completed`);
  });

  worker.on('failed', (job, error) => {
    console.error(`Job ${job?.name} failed:`, error.message);
  });

  worker.on('error', (error) => {
    console.error('Worker error:', error);
  });

  workers.set(queueName, worker);
  return worker;
}

/**
 * Stop a worker
 */
export async function stopWorker(queueName: QueueName): Promise<void> {
  const worker = workers.get(queueName);
  if (worker) {
    await worker.close();
    workers.delete(queueName);
  }
}

/**
 * Stop all workers
 */
export async function stopAllWorkers(): Promise<void> {
  const closePromises = Array.from(workers.values()).map((w) => w.close());
  await Promise.all(closePromises);
  workers.clear();
}

/**
 * Get worker status
 */
export function getWorkerStatus(): Record<QueueName, boolean> {
  const status: Record<string, boolean> = {};
  for (const [name, worker] of workers) {
    status[name] = worker.isRunning();
  }
  return status as Record<QueueName, boolean>;
}
