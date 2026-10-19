import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, signal } from '@angular/core';
import { firstValueFrom, retry } from 'rxjs';
import { BALL_API } from 'src/app/core/constants/ball-api.constants';
import { Ball, BallPage, BallQueryParams, Brand, Core, Coverstock } from 'src/app/core/models/ball.model';
import { environment } from 'src/environments/environment';
import { CacheService } from '../cache/cache.service';
import { NetworkService } from '../network/network.service';

@Injectable({
  providedIn: 'root',
})
export class BallService {
  readonly brands = signal<Brand[]>([]);
  readonly cores = signal<Core[]>([]);
  readonly coverstocks = signal<Coverstock[]>([]);
  private readonly pending = new Map<string, Promise<unknown>>();

  constructor(
    private http: HttpClient,
    private cacheService: CacheService,
    private networkService: NetworkService,
  ) {}

  /** Server-side search, filter, sort and paging (see `buildBallQueryParams`). */
  async searchBalls(params: BallQueryParams): Promise<BallPage> {
    return firstValueFrom(this.http.get<BallPage>(this.url(BALL_API.balls), { params }));
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
      const response = await firstValueFrom(this.http.get<Ball[]>(this.url(BALL_API.export), { params }).pipe(retry({ count: 5, delay: 2000 })));
      return response;
    } catch (error) {
      console.error('Error loading all balls:', error);
      throw error;
    }
  }

  async getBallsByWeight(weight: number): Promise<Ball[]> {
    return this.fetchWithCache(`balls_weight_${weight}`, () => this.loadAllBalls(undefined, weight), 24 * 60 * 60 * 1000);
  }

  async getBallsByCore(ball: Ball): Promise<Ball[]> {
    try {
      return await this.findRelatedBalls({ core: ball.core_name, excludeId: ball.ball_id.toString(), weight: ball.core_weight });
    } catch (error) {
      console.error(`Error loading balls by core for ball ID ${ball.ball_id}:`, error);
      throw error;
    }
  }

  async getBallsByCoverstock(ball: Ball): Promise<Ball[]> {
    try {
      return await this.findRelatedBalls({ coverstock: ball.coverstock_name, excludeId: ball.ball_id.toString(), weight: ball.core_weight });
    } catch (error) {
      console.error(`Error loading balls by coverstock for ball ID ${ball.ball_id}:`, error);
      throw error;
    }
  }

  async getBallByBrand(brand: string): Promise<Ball[]> {
    try {
      return await this.findRelatedBalls({ brand });
    } catch (error) {
      console.error(`Error loading balls by brand "${brand}":`, error);
      throw error;
    }
  }

  async getBrands(): Promise<Brand[]> {
    return this.fetchWithCache(
      'brands',
      () => firstValueFrom(this.http.get<Brand[]>(this.url(BALL_API.brands))),
      7 * 24 * 60 * 60 * 1000,
      (data) => this.brands.set(data),
    );
  }

  async getCores(): Promise<Core[]> {
    return this.fetchWithCache(
      'cores',
      () => firstValueFrom(this.http.get<Core[]>(this.url(BALL_API.cores))),
      7 * 24 * 60 * 60 * 1000,
      (data) => {
        data.sort((a, b) => a.brand.localeCompare(b.brand));
        this.cores.set(data);
      },
    );
  }

  async getCoverstocks(): Promise<Coverstock[]> {
    return this.fetchWithCache(
      'coverstocks',
      () => firstValueFrom(this.http.get<Coverstock[]>(this.url(BALL_API.coverstocks))),
      7 * 24 * 60 * 60 * 1000,
      (data) => {
        data.sort((a, b) => a.brand.localeCompare(b.brand));
        this.coverstocks.set(data);
      },
    );
  }

  /**
   * Balls with a similar expected reaction (same weight, core and coverstock
   * type, close RG/differential), newest first. The matching runs on the API.
   */
  async getBallsByMovementPattern(ball: Ball): Promise<Ball[]> {
    try {
      const { path, params } = BALL_API.similar(ball.ball_id.toString());
      const similar = await firstValueFrom(this.http.get<Ball[]>(this.url(path), { params: { ...params, weight: ball.core_weight, limit: '10' } }));
      // add original ball back it to have a title for the modal at index 0 (workaround)
      return similar.length > 0 ? [ball, ...similar] : [];
    } catch (error) {
      console.error(`Error finding balls with similar movement pattern for ball ID ${ball.ball_id}:`, error);
      throw error;
    }
  }

  private url(path: string): string {
    return `${environment.ballApiEndpoint}${path}`;
  }

  /** First 100 matches of a list query, newest first. */
  private async findRelatedBalls(filters: BallQueryParams): Promise<Ball[]> {
    const page = await this.searchBalls({ ...filters, size: '100', sort: 'release_date,desc' });
    return page.content;
  }

  private async fetchWithCache<T>(cacheKey: string, fetcher: () => Promise<T[]>, ttl: number, onData?: (data: T[]) => void): Promise<T[]> {
    const cached = await this.cacheService.get<T[]>(cacheKey);
    const isCacheValid = await this.cacheService.isValid(cacheKey);

    if (cached && (isCacheValid || this.networkService.isOffline)) {
      onData?.(cached);
      return cached;
    }

    if (this.networkService.isOffline) return [];

    if (this.pending.has(cacheKey)) {
      try {
        const data = await (this.pending.get(cacheKey) as Promise<T[]>);
        onData?.(data);
        return data;
      } catch (error) {
        if (cached) {
          onData?.(cached);
          return cached;
        }
        throw error;
      }
    }

    const request = (async () => {
      try {
        const data = await fetcher();
        onData?.(data);
        if (data.length > 0) await this.cacheService.set(cacheKey, data, ttl);
        return data;
      } catch (error) {
        if (cached) {
          onData?.(cached);
          return cached;
        }
        throw error;
      } finally {
        this.pending.delete(cacheKey);
      }
    })();

    this.pending.set(cacheKey, request);
    return request;
  }
}
