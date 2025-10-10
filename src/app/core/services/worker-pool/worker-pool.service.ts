import { Injectable, OnDestroy } from '@angular/core';

interface WorkerTask {
  id: string;
  resolve: (value: any) => void;
  reject: (error: any) => void;
  timeout: NodeJS.Timeout;
}

@Injectable({
  providedIn: 'root',
})
export class WorkerPoolService implements OnDestroy {
  private workerPool: Worker[] = [];
  private availableWorkers: Worker[] = [];
  private taskQueue: { workerUrl: string; data: any; task: WorkerTask }[] = [];
  private workerTasks = new Map<Worker, WorkerTask>();
  private readonly MAX_WORKERS = navigator.hardwareConcurrency || 4;
  private readonly TASK_TIMEOUT = 30000;

  constructor() {
    // Worker pool initialized
  }

  /**
   * Execute a task using a worker from the pool
   */
  async executeTask<T>(workerUrl: string, data: any): Promise<T> {
    return new Promise((resolve, reject) => {
      const taskId = `task_${Date.now()}_${Math.random()}`;
      const timeout = setTimeout(() => {
        reject(new Error(`Task ${taskId} timed out after ${this.TASK_TIMEOUT}ms`));
      }, this.TASK_TIMEOUT);

      const task: WorkerTask = { id: taskId, resolve, reject, timeout };

      // Try to get an available worker or create a new one
      const worker = this.getOrCreateWorker(workerUrl);
      
      if (worker) {
        this.assignTaskToWorker(worker, data, task);
      } else {
        // Queue the task if no workers are available
        this.taskQueue.push({ workerUrl, data, task });
      }
    });
  }

  private getOrCreateWorker(workerUrl: string): Worker | null {
    // Check if there's an available worker
    if (this.availableWorkers.length > 0) {
      return this.availableWorkers.pop()!;
    }

    // Create a new worker if under the limit
    if (this.workerPool.length < this.MAX_WORKERS) {
      try {
        const worker = new Worker(new URL(workerUrl, import.meta.url), { type: 'module' });
        this.workerPool.push(worker);
        return worker;
      } catch (error) {
        console.error('Failed to create worker:', error);
        return null;
      }
    }

    // No workers available and at max capacity
    return null;
  }

  private assignTaskToWorker(worker: Worker, data: any, task: WorkerTask): void {
    this.workerTasks.set(worker, task);

    const handleMessage = (event: MessageEvent) => {
      const currentTask = this.workerTasks.get(worker);
      if (currentTask && currentTask.id === task.id) {
        clearTimeout(task.timeout);
        this.workerTasks.delete(worker);
        worker.removeEventListener('message', handleMessage);
        worker.removeEventListener('error', handleError);
        
        task.resolve(event.data.payload);
        
        // Return worker to available pool
        this.returnWorkerToPool(worker);
      }
    };

    const handleError = (error: ErrorEvent) => {
      const currentTask = this.workerTasks.get(worker);
      if (currentTask && currentTask.id === task.id) {
        clearTimeout(task.timeout);
        this.workerTasks.delete(worker);
        worker.removeEventListener('message', handleMessage);
        worker.removeEventListener('error', handleError);
        
        task.reject(error);
        
        // Return worker to available pool even on error
        this.returnWorkerToPool(worker);
      }
    };

    worker.addEventListener('message', handleMessage);
    worker.addEventListener('error', handleError);
    worker.postMessage(data);
  }

  private returnWorkerToPool(worker: Worker): void {
    this.availableWorkers.push(worker);

    // Process next task in queue if any
    if (this.taskQueue.length > 0) {
      const nextTask = this.taskQueue.shift();
      if (nextTask) {
        const worker = this.availableWorkers.pop();
        if (worker) {
          this.assignTaskToWorker(worker, nextTask.data, nextTask.task);
        }
      }
    }
  }

  /**
   * Get pool statistics
   */
  getPoolStats(): { total: number; available: number; busy: number; queued: number } {
    return {
      total: this.workerPool.length,
      available: this.availableWorkers.length,
      busy: this.workerTasks.size,
      queued: this.taskQueue.length,
    };
  }

  ngOnDestroy(): void {
    // Terminate all workers
    this.workerPool.forEach((worker) => worker.terminate());
    this.workerPool = [];
    this.availableWorkers = [];
    this.taskQueue = [];
    this.workerTasks.clear();
  }
}
