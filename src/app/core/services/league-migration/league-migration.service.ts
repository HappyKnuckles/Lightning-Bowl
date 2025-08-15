import { Injectable } from '@angular/core';
import { AlertController } from '@ionic/angular';
import { StorageService } from '../storage/storage.service';
import { League, LeagueData, isLeagueObject, EventType } from '../../models/league.model';
import { Game } from '../../models/game.model';
import { ToastService } from '../toast/toast.service';

@Injectable({
  providedIn: 'root'
})
export class LeagueMigrationService {
  private readonly MIGRATION_KEY = 'league_migration_completed';

  constructor(
    private alertController: AlertController,
    private toastService: ToastService
  ) {}

  /**
   * Checks if migration has already been completed
   */
  private isMigrationCompleted(): boolean {
    return localStorage.getItem(this.MIGRATION_KEY) === 'true';
  }

  /**
   * Marks migration as completed
   */
  private setMigrationCompleted(): void {
    localStorage.setItem(this.MIGRATION_KEY, 'true');
  }

  /**
   * Finds all legacy string leagues that need migration
   */
  private findLegacyLeagues(leagues: LeagueData[]): string[] {
    return leagues.filter(league => typeof league === 'string') as string[];
  }

  /**
   * Creates a League object from legacy string and user-selected event type
   */
  private createLeagueFromLegacy(name: string, eventType: EventType): League {
    return {
      Name: name,
      Show: true,
      Event: eventType
    };
  }

  /**
   * Shows user interface to collect event types for legacy leagues
   */
  private async collectEventTypesFromUser(legacyLeagues: string[]): Promise<Map<string, EventType> | null> {
    const eventTypeMap = new Map<string, EventType>();
    
    for (const leagueName of legacyLeagues) {
      const eventType = await this.askForEventType(leagueName);
      if (eventType === null) {
        // User cancelled the migration
        return null;
      }
      eventTypeMap.set(leagueName, eventType);
    }
    
    return eventTypeMap;
  }

  /**
   * Shows alert to ask user for event type of a specific league
   */
  private async askForEventType(leagueName: string): Promise<EventType | null> {
    return new Promise((resolve) => {
      this.alertController.create({
        header: 'League Migration',
        subHeader: `What type is "${leagueName}"?`,
        message: 'Please select whether this is a League or Tournament to complete the migration to the new system.',
        cssClass: 'league-migration-alert',
        buttons: [
          {
            text: 'Cancel Migration',
            role: 'cancel',
            handler: () => resolve(null)
          },
          {
            text: 'League',
            handler: () => resolve('League')
          },
          {
            text: 'Tournament',
            handler: () => resolve('Tournament')
          }
        ]
      }).then(alert => {
        alert.present();
      });
    });
  }

  /**
   * Updates all games that reference a legacy league to use the new League object
   */
  private updateGamesWithNewLeague(games: Game[], oldLeagueName: string, newLeague: League): Game[] {
    return games.map(game => {
      if (game.league === oldLeagueName) {
        return { ...game, league: newLeague };
      }
      return game;
    });
  }

  /**
   * Main migration method - migrates all legacy leagues to League objects
   */
  async migrateLeagues(storageService: StorageService): Promise<boolean> {
    // Check if migration already completed
    if (this.isMigrationCompleted()) {
      return true;
    }

    try {
      // Get current leagues and games
      const currentLeagues = storageService.leagues();
      const currentGames = storageService.games();
      
      // Find legacy string leagues
      const legacyLeagues = this.findLegacyLeagues(currentLeagues);
      
      if (legacyLeagues.length === 0) {
        // No legacy leagues found, mark migration as complete
        this.setMigrationCompleted();
        return true;
      }

      // Show introduction alert
      const shouldProceed = await this.showMigrationIntroduction(legacyLeagues.length);
      if (!shouldProceed) {
        return false;
      }

      // Collect event types from user
      const eventTypeMap = await this.collectEventTypesFromUser(legacyLeagues);
      if (!eventTypeMap) {
        // User cancelled migration
        return false;
      }

      // Perform migration for each legacy league
      let updatedGames = [...currentGames];
      const newLeagues: League[] = [];
      
      for (const [leagueName, eventType] of eventTypeMap) {
        // Create new League object
        const newLeague = this.createLeagueFromLegacy(leagueName, eventType);
        newLeagues.push(newLeague);
        
        // Update games to use new League object
        updatedGames = this.updateGamesWithNewLeague(updatedGames, leagueName, newLeague);
        
        // Delete old league from storage
        await storageService.deleteLeague(leagueName);
        
        // Add new League object
        await storageService.addLeague(newLeague);
      }

      // Save updated games
      if (updatedGames.length > 0) {
        await storageService.saveGamesToLocalStorage(updatedGames);
      }

      // Mark migration as completed
      this.setMigrationCompleted();
      
      // Show success message
      this.toastService.showToast(
        `Successfully migrated ${legacyLeagues.length} league(s) to the new system!`,
        'checkmark-circle'
      );
      
      return true;

    } catch (error) {
      console.error('Error during league migration:', error);
      this.toastService.showToast(
        'Error occurred during league migration. Please try again.',
        'warning',
        true
      );
      return false;
    }
  }

  /**
   * Shows introduction alert explaining the migration process
   */
  private async showMigrationIntroduction(legacyCount: number): Promise<boolean> {
    return new Promise((resolve) => {
      this.alertController.create({
        header: 'League System Upgrade',
        subHeader: 'Migration Required',
        message: `We've improved the league system! You have ${legacyCount} league(s) that need to be updated. This one-time process will ask you to specify whether each league is a "League" or "Tournament" to take advantage of new features.`,
        cssClass: 'league-migration-intro-alert',
        buttons: [
          {
            text: 'Skip for Now',
            role: 'cancel',
            handler: () => resolve(false)
          },
          {
            text: 'Start Migration',
            handler: () => resolve(true)
          }
        ]
      }).then(alert => {
        alert.present();
      });
    });
  }

  /**
   * Resets migration status (for development/testing purposes)
   */
  resetMigrationStatus(): void {
    localStorage.removeItem(this.MIGRATION_KEY);
  }
}