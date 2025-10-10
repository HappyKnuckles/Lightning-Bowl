import { Injectable, OnDestroy } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class ImageWorkerService implements OnDestroy {
  private worker: Worker | null = null;
  private workerSupported = typeof Worker !== 'undefined';

  constructor() {
    if (this.workerSupported) {
      this.initializeWorker();
    }
  }

  private initializeWorker(): void {
    try {
      this.worker = new Worker(new URL('../../workers/image-processor.worker', import.meta.url), { type: 'module' });
    } catch (error) {
      console.warn('Failed to initialize image worker, falling back to main thread:', error);
      this.workerSupported = false;
    }
  }

  async convertToBase64Async(imageData: ArrayBuffer): Promise<string> {
    if (!this.workerSupported || !this.worker) {
      // Fallback to main thread
      return this.convertToBase64Sync(imageData);
    }

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Image conversion timeout'));
      }, 10000);

      const handleMessage = (event: MessageEvent) => {
        const { type, payload } = event.data;
        if (type === 'BASE64_RESULT') {
          clearTimeout(timeout);
          this.worker?.removeEventListener('message', handleMessage);
          resolve(payload);
        } else if (type === 'ERROR') {
          clearTimeout(timeout);
          this.worker?.removeEventListener('message', handleMessage);
          reject(new Error(payload));
        }
      };

      this.worker!.addEventListener('message', handleMessage);
      this.worker!.addEventListener('error', (error) => {
        clearTimeout(timeout);
        reject(error);
      });

      this.worker!.postMessage({
        type: 'CONVERT_TO_BASE64',
        payload: { imageData },
      });
    });
  }

  isWorkerAvailable(): boolean {
    return this.workerSupported && this.worker !== null;
  }

  private convertToBase64Sync(imageData: ArrayBuffer): string {
    const bytes = new Uint8Array(imageData);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }

  ngOnDestroy(): void {
    if (this.worker) {
      this.worker.terminate();
    }
  }
}
