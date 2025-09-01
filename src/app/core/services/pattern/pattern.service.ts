import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Pattern } from '../../models/pattern.model';
import { firstValueFrom, retry } from 'rxjs';
import { environment } from 'src/environments/environment';
import { CacheService } from '../cache/cache.service';
import { NetworkService } from '../network/network.service';

interface SearchResult {
  patterns: Pattern[];
  count: number;
  query: string;
  numeric_query: boolean;
  threshold: number;
}

interface AllPatternsResult {
  total: number;
  patterns: Pattern[];
  page?: number;
  per_page?: number;
}

@Injectable({
  providedIn: 'root',
})
export class PatternService {
  constructor(
    private http: HttpClient,
    private cacheService: CacheService,
    private networkService: NetworkService,
  ) {}

  async getPatterns(page: number): Promise<AllPatternsResult> {
    const cacheKey = `patterns_page_${page}`;

    try {
      const cachedPatterns = await this.cacheService.get<AllPatternsResult>(cacheKey);
      const isCacheValid = await this.cacheService.isValid(cacheKey);

      if (cachedPatterns && (isCacheValid || this.networkService.isOffline)) {
        return cachedPatterns;
      }

      if (this.networkService.isOffline) {
        console.warn('Cannot fetch patterns: offline and no cached data available');
        return { total: 0, patterns: [] };
      }

      const response = await firstValueFrom(
        this.http.get<AllPatternsResult>(`${environment.patternEndpoint}patterns?page=${page}`).pipe(retry({ count: 5, delay: 2000 })),
      );

      if (response.total !== 0) {
        await this.cacheService.set(cacheKey, response, 24 * 60 * 60 * 1000); // 6 hours
      }

      return response;
    } catch (error) {
      console.error('Error fetching patterns:', error);

      // Try to use cached data as fallback
      const cachedPatterns = await this.cacheService.get<AllPatternsResult>(cacheKey);
      if (cachedPatterns) {
        return cachedPatterns;
      }

      return { total: 0, patterns: [] };
    }
  }

  async getAllPatterns(): Promise<Pattern[]> {
    try {
      const response = await firstValueFrom(
        this.http.get<Pattern[]>(`${environment.patternEndpoint}patterns/all`).pipe(retry({ count: 5, delay: 2000 })),
      );
      return response;
    } catch (error) {
      console.error('Error fetching all patterns:', error);
      return [];
    }
  }

  async getPatternCategories(): Promise<string[]> {
    try {
      const response = await firstValueFrom(this.http.get<string[]>(`${environment.patternEndpoint}categories`));
      return response;
    } catch (error) {
      console.error('Error fetching pattern categories:', error);
      return [];
    }
  }

  async getPatternData(url: string): Promise<Pattern> {
    try {
      const response = await firstValueFrom(this.http.get<Pattern>(`${environment.patternEndpoint}patterns/${url}`));
      return response;
    } catch (error) {
      console.error('Error fetching pattern data:', error);
      return {} as Pattern;
    }
  }

  async getPatternStats() {
    try {
      const response = await firstValueFrom(this.http.get(`${environment.patternEndpoint}stats`));
      return response;
    } catch (error) {
      console.error('Error fetching pattern stats:', error);
      return {};
    }
  }

  async searchPattern(searchTerm: string): Promise<SearchResult> {
    const cacheKey = `pattern_search_${encodeURIComponent(searchTerm)}`;

    try {
      const cachedResult = await this.cacheService.get<SearchResult>(cacheKey);
      const isCacheValid = await this.cacheService.isValid(cacheKey);

      if (cachedResult && (isCacheValid || this.networkService.isOffline)) {
        return cachedResult;
      }

      if (this.networkService.isOffline) {
        console.warn('Cannot search patterns: offline and no cached data available');
        return { patterns: [], count: 0, query: searchTerm, numeric_query: false, threshold: 0 };
      }

      const response = await firstValueFrom(this.http.get<SearchResult>(`${environment.patternEndpoint}search?q=${searchTerm}`));

      await this.cacheService.set(cacheKey, response, 2 * 60 * 60 * 1000); // 2 hours

      return response;
    } catch (error) {
      console.error('Error searching patterns:', error);

      // Try to use cached data as fallback
      const cachedResult = await this.cacheService.get<SearchResult>(cacheKey);
      if (cachedResult) {
        return cachedResult;
      }

      return { patterns: [], count: 0, query: '', numeric_query: false, threshold: 0 };
    }
  }

  async addPattern(pattern: Partial<Pattern>): Promise<void> {
    try {
      await firstValueFrom(this.http.post<Partial<Pattern>>(`${environment.patternEndpoint}add-pattern`, pattern));
    } catch (error) {
      console.error('Error adding pattern:', error);
    }
  }
}
