import { Injectable } from '@angular/core';
import { environment } from 'src/environments/environment';
import { ImageWorkerService } from '../image-worker/image-worker.service';

@Injectable({
  providedIn: 'root',
})
export class ImageProcesserService {
  constructor(private imageWorkerService: ImageWorkerService) {}

  async performOCR(image: File): Promise<string> {
    // Read file as ArrayBuffer for worker processing
    const arrayBuffer = await image.arrayBuffer();
    
    // Offload base64 conversion to Web Worker
    let base64Image: string;
    if (this.imageWorkerService.isWorkerAvailable()) {
      base64Image = await this.imageWorkerService.convertToBase64Async(arrayBuffer);
    } else {
      // Fallback: use FileReader on main thread
      base64Image = await this.convertToBase64Fallback(image);
    }

    // Perform OCR API call
    const response = await fetch(environment.ocrEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ image: base64Image }),
    });

    if (!response.ok) {
      throw new Error('Network response was not ok ' + response.statusText);
    }

    return await response.text();
  }

  private async convertToBase64Fallback(image: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onloadend = () => {
        const base64Image = reader.result?.toString().split(',')[1];
        if (!base64Image) {
          reject(new Error('Failed to convert image to base64.'));
          return;
        }
        resolve(base64Image);
      };

      reader.onerror = () => {
        reject(new Error('Failed to read the image file.'));
      };

      reader.readAsDataURL(image);
    });
  }
}

