import { Injectable } from '@angular/core';
import { BowlingOrganization, Rulebook } from '../../models/rulebook.model';
import { Storage } from '@ionic/storage-angular';

@Injectable({
  providedIn: 'root',
})
export class RulebookService {
  private readonly STORAGE_KEY = 'selected-bowling-organization';
  
  constructor(private storage: Storage) {}

  async getAvailableOrganizations(): Promise<BowlingOrganization[]> {
    // For now, return a static list of bowling organizations
    // In the future, this could be fetched from an API
    return [
      { name: 'United States Bowling Congress', code: 'USBC', country: 'United States' },
      { name: 'Bowls Canada', code: 'BC', country: 'Canada' },
      { name: 'European Bowling Federation', code: 'EBF', country: 'Europe' },
      { name: 'Deutscher Bowling Verband', code: 'DBV', country: 'Germany' },
      { name: 'British Crown Green Bowling Association', code: 'BCGBA', country: 'United Kingdom' },
      { name: 'Bowling Federation of Australia', code: 'BFA', country: 'Australia' },
      { name: 'Japan Bowling Congress', code: 'JBC', country: 'Japan' },
    ];
  }

  async getRulebookForOrganization(organization: BowlingOrganization): Promise<Rulebook> {
    // For now, return sample rulebook data
    // In the future, this could be fetched from an API based on organization
    return {
      organization,
      title: `${organization.name} Official Rulebook`,
      version: '2024.1',
      lastUpdated: '2024-01-15',
      sections: [
        {
          title: 'Basic Rules and Regulations',
          content: 'Standard bowling rules and game regulations as defined by the organization.',
          order: 1,
        },
        {
          title: 'Equipment Standards',
          content: 'Requirements for balls, pins, lanes, and other bowling equipment.',
          order: 2,
        },
        {
          title: 'Scoring System',
          content: 'Official scoring methods and procedures.',
          order: 3,
        },
        {
          title: 'Tournament Guidelines',
          content: 'Rules specific to tournament play and competitions.',
          order: 4,
        },
        {
          title: 'League Play Standards',
          content: 'Regulations for league bowling and seasonal play.',
          order: 5,
        },
      ],
    };
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