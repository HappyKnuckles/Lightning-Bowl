import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, signal } from '@angular/core';
import { firstValueFrom, retry } from 'rxjs';
import { Ball, Brand, Core, Coverstock } from 'src/app/core/models/ball.model';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root',
})
export class BallService {
  #brands = signal<Brand[]>([]);
  #cores = signal<Core[]>([]);
  #coverstocks = signal<Coverstock[]>([]);

  get brands() {
    return this.#brands;
  }
  get cores() {
    return this.#cores;
  }
  get coverstocks() {
    return this.#coverstocks;
  }

  constructor(private http: HttpClient) {}

  async loadBalls(page: number): Promise<Ball[]> {
    try {
      const response = await firstValueFrom(
        this.http.get<Ball[]>(`${environment.bowwwlEndpoint}balls-pages`, {
          params: {
            page: page.toString(),
          },
        }),
      );
      return response;
    } catch (error) {
      console.error(`Error loading balls for page ${page}:`, error);
      throw error;
    }
  }

  async loadAllBalls(updated?: string, weight?: number): Promise<Ball[]> {
    try {
      let params = new HttpParams();
      if (updated) {
        params = params.set('updated', updated);
      }
      if (weight !== undefined) {
        params = params.set('weight', weight.toString());
      }
      const response = await firstValueFrom(
        this.http.get<Ball[]>(`${environment.bowwwlEndpoint}all-balls`, { params }).pipe(retry({ count: 5, delay: 2000 })),
      );
      const uniqueCoverstockTypes = [...new Set(response.map((ball) => ball.coverstock_type).filter(Boolean))];
      console.log('Unique coverstock types:', uniqueCoverstockTypes);
      return response;
    } catch (error) {
      console.error('Error loading all balls:', error);
      throw error;
    }
  }

  async getBallsByCore(ball: Ball): Promise<Ball[]> {
    try {
      const response = await firstValueFrom(
        this.http.get<Ball[]>(`${environment.bowwwlEndpoint}core-balls`, {
          params: {
            core: ball.core_name,
            ballId: ball.ball_id.toString(),
          },
        }),
      );
      return response;
    } catch (error) {
      console.error(`Error loading balls by core for ball ID ${ball.ball_id}:`, error);
      throw error;
    }
  }

  async getBallsByCoverstock(ball: Ball): Promise<Ball[]> {
    try {
      const response = await firstValueFrom(
        this.http.get<Ball[]>(`${environment.bowwwlEndpoint}coverstock-balls`, {
          params: {
            coverstock: ball.coverstock_name,
            ballId: ball.ball_id.toString(),
          },
        }),
      );
      return response;
    } catch (error) {
      console.error(`Error loading balls by coverstock for ball ID ${ball.ball_id}:`, error);
      throw error;
    }
  }

  async getBallByBrand(brand: string): Promise<Ball[]> {
    try {
      const response = await firstValueFrom(
        this.http.get<Ball[]>(`${environment.bowwwlEndpoint}brand`, {
          params: { brand },
        }),
      );
      return response;
    } catch (error) {
      console.error(`Error loading balls by brand "${brand}":`, error);
      throw error;
    }
  }

  async getBrands(): Promise<Brand[]> {
    try {
      const response = await firstValueFrom(this.http.get<Brand[]>(`${environment.bowwwlEndpoint}brands`));
      this.brands.set(response);
      return response;
    } catch (error) {
      console.error('Error loading brands:', error);
      throw error;
    }
  }

  async getCores(): Promise<Core[]> {
    try {
      const response = await firstValueFrom(this.http.get<Core[]>(`${environment.bowwwlEndpoint}cores`));
      response.sort((a, b) => a.brand.localeCompare(b.brand));
      this.cores.set(response);
      return response;
    } catch (error) {
      console.error('Error loading cores:', error);
      throw error;
    }
  }

  async getCoverstocks(): Promise<Coverstock[]> {
    try {
      const response = await firstValueFrom(this.http.get<Coverstock[]>(`${environment.bowwwlEndpoint}coverstocks`));
      response.sort((a, b) => a.brand.localeCompare(b.brand));
      this.coverstocks.set(response);
      return response;
    } catch (error) {
      console.error('Error loading coverstocks:', error);
      throw error;
    }
  }
}
