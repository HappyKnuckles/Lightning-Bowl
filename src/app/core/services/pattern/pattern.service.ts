import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Pattern } from '../../models/pattern.model';
import { firstValueFrom } from 'rxjs';
import { environment } from 'src/environments/environment';

interface SearchResult {
  results: Pattern[];
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
  constructor(private http: HttpClient) {}

  async getPatterns(page: number): Promise<AllPatternsResult> {
    try {
      const response = await firstValueFrom(this.http.get<AllPatternsResult>(`${environment.patternEndpoint}patterns?page=${page}`));
      return response;
    } catch (error) {
      console.error('Error fetching patterns:', error);
      return { total: 0, patterns: [] };
    }
  }

  async getAllPatterns(): Promise<AllPatternsResult> {
    try {
      const response = await firstValueFrom(this.http.get<AllPatternsResult>(`${environment.patternEndpoint}patterns/all`));
      return response;
    } catch (error) {
      console.error('Error fetching all patterns:', error);
      return { total: 0, patterns: [] };
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
    try {
      const response = await firstValueFrom(this.http.get<SearchResult>(`${environment.patternEndpoint}search?q=${searchTerm}`));
      return response;
    } catch (error) {
      console.error('Error searching patterns:', error);
      return { results: [], count: 0, query: '', numeric_query: false, threshold: 0 };
    }
  }
}
