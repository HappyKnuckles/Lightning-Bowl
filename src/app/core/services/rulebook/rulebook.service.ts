import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { firstValueFrom, retry } from 'rxjs';
import { BowlingOrganization, Rulebook } from '../../models/rulebook.model';
import { Storage } from '@ionic/storage-angular';
import { environment } from 'src/environments/environment';
import { CacheService } from '../cache/cache.service';
import { NetworkService } from '../network/network.service';

@Injectable({
  providedIn: 'root',
})
export class RulebookService {
  private readonly STORAGE_KEY = 'selected-bowling-organization';
  
  constructor(
    private storage: Storage,
    private http: HttpClient,
    private cacheService: CacheService,
    private networkService: NetworkService
  ) {}

  async getAvailableOrganizations(): Promise<BowlingOrganization[]> {
    const cacheKey = 'bowling-organizations';
    
    try {
      // Check cache first
      const cachedOrganizations = await this.cacheService.get<BowlingOrganization[]>(cacheKey);
      const isCacheValid = await this.cacheService.isValid(cacheKey);

      if (cachedOrganizations && (isCacheValid || this.networkService.isOffline)) {
        return cachedOrganizations;
      }

      if (this.networkService.isOffline) {
        return [];
      }

      // Fetch from API
      const response = await firstValueFrom(
        this.http.get<BowlingOrganization[]>(`${environment.bowwwlEndpoint}bowling-organizations`)
          .pipe(retry({ count: 3, delay: 1000 }))
      );

      // Cache the response
      await this.cacheService.set(cacheKey, response);
      
      return response;
    } catch (error) {
      console.error('Error fetching bowling organizations:', error);
      
      // Try to return cached data if available
      const cachedOrganizations = await this.cacheService.get<BowlingOrganization[]>(cacheKey);
      if (cachedOrganizations) {
        return cachedOrganizations;
      }
      
      // Return empty array as fallback
      return [];
    }
  }

  async getRulebookForOrganization(organization: BowlingOrganization): Promise<Rulebook> {
    const cacheKey = `rulebook-${organization.code}`;
    
    try {
      // Check cache first
      const cachedRulebook = await this.cacheService.get<Rulebook>(cacheKey);
      const isCacheValid = await this.cacheService.isValid(cacheKey);

      if (cachedRulebook && (isCacheValid || this.networkService.isOffline)) {
        return cachedRulebook;
      }

      if (this.networkService.isOffline) {
        throw new Error('No cached rulebook available and device is offline');
      }

      // Fetch from API
      const response = await firstValueFrom(
        this.http.get<Rulebook>(`${environment.bowwwlEndpoint}rulebooks/${organization.code}`)
          .pipe(retry({ count: 3, delay: 1000 }))
      );

      // Cache the response
      await this.cacheService.set(cacheKey, response);
      
      return response;
    } catch (error) {
      console.error('Error fetching rulebook for organization:', organization.code, error);
      
      // Try to return cached data if available
      const cachedRulebook = await this.cacheService.get<Rulebook>(cacheKey);
      if (cachedRulebook) {
        return cachedRulebook;
      }
      
      // Throw error if no fallback is available
      throw new Error(`Unable to load rulebook for ${organization.name}`);
    }
  }

  async saveSelectedOrganization(organization: BowlingOrganization): Promise<void> {
    await this.storage.set(this.STORAGE_KEY, organization);
  }

  async getSelectedOrganization(): Promise<BowlingOrganization | null> {
    return await this.storage.get(this.STORAGE_KEY);
  }

  async clearSelectedOrganization(): Promise<void> {
    await this.storage.remove(this.STORAGE_KEY);
  }
}