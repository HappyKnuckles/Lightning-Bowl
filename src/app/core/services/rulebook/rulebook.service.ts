import { Injectable } from '@angular/core';
import { BowlingOrganization, Rulebook } from '../../models/rulebook.model';
import { Storage } from '@ionic/storage-angular';
import { CacheService } from '../cache/cache.service';
import { RulebookDataService } from './rulebook-data.service';

@Injectable({
  providedIn: 'root',
})
export class RulebookService {
  private readonly STORAGE_KEY = 'selected-bowling-organization';
  
  constructor(
    private storage: Storage,
    private cacheService: CacheService,
    private rulebookDataService: RulebookDataService
  ) {}

  async getAvailableOrganizations(): Promise<BowlingOrganization[]> {
    const cacheKey = 'bowling-organizations';
    
    try {
      // Check cache first
      const cachedOrganizations = await this.cacheService.get<BowlingOrganization[]>(cacheKey);
      const isCacheValid = await this.cacheService.isValid(cacheKey);

      if (cachedOrganizations && isCacheValid) {
        return cachedOrganizations;
      }

      // Get data from local service
      const organizations = this.rulebookDataService.getOrganizations();

      // Cache the response for future use
      await this.cacheService.set(cacheKey, organizations, 7 * 24 * 60 * 60 * 1000); // 7 days
      
      return organizations;
    } catch (error) {
      console.error('Error fetching bowling organizations:', error);
      
      // Try to return cached data if available
      const cachedOrganizations = await this.cacheService.get<BowlingOrganization[]>(cacheKey);
      if (cachedOrganizations) {
        return cachedOrganizations;
      }
      
      // Return data directly as fallback
      return this.rulebookDataService.getOrganizations();
    }
  }

  async getRulebookForOrganization(organization: BowlingOrganization): Promise<Rulebook> {
    const cacheKey = `rulebook-${organization.code}`;
    
    try {
      // Check cache first
      const cachedRulebook = await this.cacheService.get<Rulebook>(cacheKey);
      const isCacheValid = await this.cacheService.isValid(cacheKey);

      if (cachedRulebook && isCacheValid) {
        return cachedRulebook;
      }

      // Get data from local service
      const rulebook = this.rulebookDataService.getRulebook(organization.code);

      // Cache the response for future use
      await this.cacheService.set(cacheKey, rulebook, 7 * 24 * 60 * 60 * 1000); // 7 days
      
      return rulebook;
    } catch (error) {
      console.error('Error fetching rulebook for organization:', organization.code, error);
      
      // Try to return cached data if available
      const cachedRulebook = await this.cacheService.get<Rulebook>(cacheKey);
      if (cachedRulebook) {
        return cachedRulebook;
      }
      
      // Try to get data directly from service as final fallback
      try {
        return this.rulebookDataService.getRulebook(organization.code);
      } catch {
        throw new Error(`Unable to load rulebook for ${organization.name}`);
      }
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