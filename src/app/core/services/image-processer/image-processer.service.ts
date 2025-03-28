import { Injectable } from '@angular/core';
import { environment } from 'src/environments/environment';
@Injectable({
  providedIn: 'root',
})
export class ImageProcesserService {
  async performOCR(image: File): Promise<string> {
    // Convert image file to base64 string
    const reader = new FileReader();

    return new Promise((resolve, reject) => {
      reader.onloadend = async () => {
        const base64Image = reader.result?.toString().split(',')[1];

        if (!base64Image) {
          reject(new Error('Failed to convert image to base64.'));
          return;
        }

        try {
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

          const extractedText = await response.text();
          resolve(extractedText);
        } catch (error) {
          reject(error);
        }
      };

      reader.onerror = () => {
        reject(new Error('Failed to read the image file.'));
      };

      reader.readAsDataURL(image);
    });
  }
}
