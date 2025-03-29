import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Pattern } from '../../models/pattern.model';
import { firstValueFrom } from 'rxjs';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root',
})
export class PatternService {
  constructor(private http: HttpClient) {}

  async getPatterns(page: number): Promise<Pattern[]> {
    try {
      const response: any = await firstValueFrom(this.http.get(`${environment.patternEndpoint}patterns?page=${page}`));
      return response.patterns;
    } catch (error) {
      console.error('Error fetching patterns:', error);
      return [];
    }
  }

  async getAllPatterns(): Promise<any[]> {
    try {
      const response: any = await firstValueFrom(this.http.get(`${environment.patternEndpoint}patterns/all`));
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

  async searchPattern(searchTerm: string): Promise<Pattern[]> {
    try {
      const response = await firstValueFrom(this.http.get<Pattern[]>(`${environment.patternEndpoint}search?q=${searchTerm}`));
      return response;
    } catch (error) {
      console.error('Error searching patterns:', error);
      return [];
    }
  }
}
