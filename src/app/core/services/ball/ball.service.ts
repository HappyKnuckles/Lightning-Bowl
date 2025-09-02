import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, signal } from '@angular/core';
import { firstValueFrom, retry } from 'rxjs';
import { Ball, Brand, Core, Coverstock } from 'src/app/core/models/ball.model';
import { environment } from 'src/environments/environment';
import { CacheService } from '../cache/cache.service';
import { NetworkService } from '../network/network.service';

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

  constructor(
    private http: HttpClient,
    private cacheService: CacheService,
    private networkService: NetworkService,
  ) {}

  async loadBalls(page: number): Promise<Ball[]> {
    const cacheKey = `balls_page_${page}`;

    try {
      // Check cache first
      const cachedBalls = await this.cacheService.get<Ball[]>(cacheKey);
      const isCacheValid = await this.cacheService.isValid(cacheKey);

      if (cachedBalls && (isCacheValid || this.networkService.isOffline)) {
        return cachedBalls;
      }

      if (this.networkService.isOffline) {
        return [];
      }

      const response = await firstValueFrom(
        this.http.get<Ball[]>(`${environment.bowwwlEndpoint}balls-pages`, {
          params: {
            page: page.toString(),
          },
        }),
      );

      if (response.length !== 0) {
        await this.cacheService.set(cacheKey, response, 24 * 60 * 60 * 1000); // 6 hours
      }

      return response;
    } catch (error) {
      console.error(`Error loading balls for page ${page}:`, error);

      // Try to use cached data as fallback
      const cachedBalls = await this.cacheService.get<Ball[]>(cacheKey);
      if (cachedBalls) {
        return cachedBalls;
      }

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
    const cacheKey = 'brands';

    try {
      const cachedBrands = await this.cacheService.get<Brand[]>(cacheKey);
      const isCacheValid = await this.cacheService.isValid(cacheKey);

      if (cachedBrands && (isCacheValid || this.networkService.isOffline)) {
        this.brands.set(cachedBrands);
        return cachedBrands;
      }

      if (this.networkService.isOffline) {
        console.warn('Cannot load brands: offline and no cached data available');
        return [];
      }

      const response = await firstValueFrom(this.http.get<Brand[]>(`${environment.bowwwlEndpoint}brands`));
      this.brands.set(response);

      if (response.length !== 0) {
        await this.cacheService.set(cacheKey, response, 7 * 24 * 60 * 60 * 1000); // 7 days
      }

      return response;
    } catch (error) {
      console.error('Error loading brands:', error);

      // Try to use cached data as fallback
      const cachedBrands = await this.cacheService.get<Brand[]>(cacheKey);
      if (cachedBrands) {
        this.brands.set(cachedBrands);
        return cachedBrands;
      }

      throw error;
    }
  }

  async getCores(): Promise<Core[]> {
    const cacheKey = 'cores';

    try {
      const cachedCores = await this.cacheService.get<Core[]>(cacheKey);
      const isCacheValid = await this.cacheService.isValid(cacheKey);

      if (cachedCores && (isCacheValid || this.networkService.isOffline)) {
        cachedCores.sort((a, b) => a.brand.localeCompare(b.brand));
        this.cores.set(cachedCores);
        return cachedCores;
      }

      if (this.networkService.isOffline) {
        console.warn('Cannot load cores: offline and no cached data available');
        return [];
      }

      const response = await firstValueFrom(this.http.get<Core[]>(`${environment.bowwwlEndpoint}cores`));
      response.sort((a, b) => a.brand.localeCompare(b.brand));
      this.cores.set(response);

      if (response.length !== 0) {
        await this.cacheService.set(cacheKey, response, 7 * 24 * 60 * 60 * 1000); // 7 days
      }

      return response;
    } catch (error) {
      console.error('Error loading cores:', error);

      // Try to use cached data as fallback
      const cachedCores = await this.cacheService.get<Core[]>(cacheKey);
      if (cachedCores) {
        cachedCores.sort((a, b) => a.brand.localeCompare(b.brand));
        this.cores.set(cachedCores);
        return cachedCores;
      }

      throw error;
    }
  }

  async getCoverstocks(): Promise<Coverstock[]> {
    const cacheKey = 'coverstocks';

    try {
      const cachedCoverstocks = await this.cacheService.get<Coverstock[]>(cacheKey);
      const isCacheValid = await this.cacheService.isValid(cacheKey);

      if (cachedCoverstocks && (isCacheValid || this.networkService.isOffline)) {
        cachedCoverstocks.sort((a, b) => a.brand.localeCompare(b.brand));
        this.coverstocks.set(cachedCoverstocks);
        return cachedCoverstocks;
      }

      if (this.networkService.isOffline) {
        console.warn('Cannot load coverstocks: offline and no cached data available');
        return [];
      }

      const response = await firstValueFrom(this.http.get<Coverstock[]>(`${environment.bowwwlEndpoint}coverstocks`));
      response.sort((a, b) => a.brand.localeCompare(b.brand));
      this.coverstocks.set(response);

      if (response.length !== 0) {
        await this.cacheService.set(cacheKey, response, 7 * 24 * 60 * 60 * 1000); // 7 days
      }

      return response;
    } catch (error) {
      console.error('Error loading coverstocks:', error);

      // Try to use cached data as fallback
      const cachedCoverstocks = await this.cacheService.get<Coverstock[]>(cacheKey);
      if (cachedCoverstocks) {
        cachedCoverstocks.sort((a, b) => a.brand.localeCompare(b.brand));
        this.coverstocks.set(cachedCoverstocks);
        return cachedCoverstocks;
      }

      throw error;
    }
  }
}
