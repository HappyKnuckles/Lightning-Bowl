import { Injectable } from '@angular/core';
import { AlertController } from '@ionic/angular';
import { Game } from '../../models/game.model';
import { StorageService } from '../storage/storage.service';
import { Pattern } from '../../models/pattern.model';

export interface HighScoreRecord {
  type: 'single_game' | 'series';
  newRecord: number;
  previousRecord: number;
  details: string;
  gameOrSeries: Game | Game[];
}

@Injectable({
  providedIn: 'root',
})
export class HighScoreAlertService {
  constructor(
    private alertController: AlertController,
    private storageService: StorageService
  ) {}

  /**
   * Check if a new game achieves any new high scores and display alerts
   */
  async checkAndDisplayHighScoreAlerts(newGame: Game, allGames: Game[]): Promise<void> {
    const records = await this.checkForNewRecords(newGame, allGames);

    for (const record of records) {
      await this.displayHighScoreAlert(record);
    }
  }

  /**
   * Check for new high score records
   */
  private async checkForNewRecords(newGame: Game, allGames: Game[]): Promise<HighScoreRecord[]> {
    const records: HighScoreRecord[] = [];

    // Get previous stats (all games except the new one)
    const previousGames = allGames.filter((game: Game) => game.gameId !== newGame.gameId);
    const previousStats = this.calculateHighScores(previousGames);

    // Check for new single game high score
    if (newGame.totalScore > (previousStats.highGame || 0)) {
      records.push({
        type: 'single_game',
        newRecord: newGame.totalScore,
        previousRecord: previousStats.highGame || 0,
        details: this.getGameDetails(newGame),
        gameOrSeries: newGame,
      });
    }

    // Check for new series high score if this game is part of a series
    if (newGame.isSeries && newGame.seriesId) {
      const seriesGames = allGames.filter((game: Game) => game.seriesId === newGame.seriesId);
      const seriesGameCount = seriesGames.length;

      // Only alert for series of 3, 4, 5, or 6 games (standard series formats)
      if (seriesGameCount >= 3 && seriesGameCount <= 6) {
        const seriesTotal = seriesGames.reduce((total: number, game: Game) => total + game.totalScore, 0);

        // Get previous best series of the same length
        const previousSeriesScores = this.getPreviousSeriesScores(allGames, newGame.seriesId, seriesGameCount);
        const previousBestSeries = Math.max(...previousSeriesScores, 0);

        if (seriesTotal > previousBestSeries) {
          records.push({
            type: 'series',
            newRecord: seriesTotal,
            previousRecord: previousBestSeries,
            details: this.getSeriesDetails(seriesGames),
            gameOrSeries: seriesGames,
          });
        }
      }
    }

    return records;
  }

  /**
   * Display congratulatory alert for new high score
   */
  public async displayHighScoreAlert(record: HighScoreRecord): Promise<void> {
    const isNewRecord = record.previousRecord === 0;
    const improvementText = isNewRecord ? 'Your first record!' : `Previous best: ${record.previousRecord}`;

    // Extract series info for better subheader
    let subHeaderText = record.type === 'single_game' ? 'Single Game Record' : 'Series Record';
    if (record.type === 'series' && record.details.includes('-Game Series')) {
      const gameCountMatch = record.details.match(/(\d+)-Game Series/);
      if (gameCountMatch) {
        subHeaderText = `${gameCountMatch[1]}-Game Series Record`;
      }
    }

    const alert = await this.alertController.create({
      header: 'NEW HIGH SCORE!',
      subHeader: subHeaderText,
      message: `
        <div style="text-align: center; padding: 10px;">
          <h2 style="color: #4CAF50; margin: 10px 0;">${record.newRecord}</h2>
          <p style="margin: 5px 0;"><strong>${improvementText}</strong></p>
          <p style="margin: 5px 0; font-size: 0.9em;">${record.details}</p>
        </div>
      `,
      buttons: [
        {
          text: 'Awesome!',
          role: 'confirm',
          cssClass: 'alert-button-confirm',
        },
      ],
      cssClass: 'high-score-alert',
    });

    await alert.present();
  }

  /**
   * Get formatted game details for display
   */
  private getGameDetails(game: Game): string {
    const details = [];

    if (game.league) {
      details.push(`League: ${game.league}`);
    }

    if (game.patterns && game.patterns.length > 0) {
      const patternNames = this.getPatternDisplayNames(game.patterns);
      details.push(`Patterns: ${patternNames}`);
    }

    if (game.balls && game.balls.length > 0) {
      details.push(`Balls: ${game.balls.join(', ')}`);
    }

    details.push(`Date: ${new Date(game.date).toLocaleDateString()}`);

    return details.join(' • ');
  }

  /**
   * Convert pattern URLs to display names
   */
  private getPatternDisplayNames(patternUrls: string[]): string {
    const patternTitles = patternUrls.map(patternUrl => {
      const pattern = this.storageService.allPatterns().find((p: Partial<Pattern>) => p.url === patternUrl);
      return pattern?.title || patternUrl;
    });
    
    return patternTitles.join(', ');
  }

  /**
   * Get formatted series details for display
   */
  private getSeriesDetails(seriesGames: Game[]): string {
    const details = [];
    const scores = seriesGames.map((g) => g.totalScore).join(', ');
    const gameCount = seriesGames.length;

    const seriesTypeText = gameCount ? `${gameCount}-Game Series` : 'Series';
    details.push(`${seriesTypeText}: ${scores}`);

    if (seriesGames[0]?.league) {
      details.push(`League: ${seriesGames[0].league}`);
    }

    details.push(`Date: ${new Date(seriesGames[0]?.date || Date.now()).toLocaleDateString()}`);

    return details.join(' • ');
  }

  /**
   * Get all previous series scores excluding the current series
   */
  /**
   * Get all previous series scores excluding the current series, optionally filtered by game count
   */
  private getPreviousSeriesScores(allGames: Game[], currentSeriesId: string, targetGameCount?: number): number[] {
    const seriesMap = new Map<string, Game[]>();

    // Group games by series ID, excluding current series
    allGames
      .filter((game: Game) => game.isSeries && game.seriesId && game.seriesId !== currentSeriesId)
      .forEach((game: Game) => {
        if (!seriesMap.has(game.seriesId!)) {
          seriesMap.set(game.seriesId!, []);
        }
        seriesMap.get(game.seriesId!)!.push(game);
      });

    // Calculate total score for each series, optionally filtering by game count
    return Array.from(seriesMap.values())
      .filter((seriesGames: Game[]) => !targetGameCount || seriesGames.length === targetGameCount)
      .map((seriesGames: Game[]) => seriesGames.reduce((total: number, game: Game) => total + game.totalScore, 0));
  }

  /**
   * Calculate high game and high series from a list of games
   */
  private calculateHighScores(games: Game[]): { highGame: number; highSeries: number } {
    if (games.length === 0) {
      return { highGame: 0, highSeries: 0 };
    }

    // Calculate high game
    const highGame = Math.max(...games.map((game) => game.totalScore));

    // Calculate high series by grouping games by seriesId
    const seriesMap = new Map<string, Game[]>();

    games
      .filter((game) => game.isSeries && game.seriesId)
      .forEach((game) => {
        if (!seriesMap.has(game.seriesId!)) {
          seriesMap.set(game.seriesId!, []);
        }
        seriesMap.get(game.seriesId!)!.push(game);
      });

    // Calculate total score for each series and find the highest
    const seriesScores = Array.from(seriesMap.values()).map((seriesGames) => seriesGames.reduce((total, game) => total + game.totalScore, 0));

    const highSeries = seriesScores.length > 0 ? Math.max(...seriesScores) : 0;

    return { highGame, highSeries };
  }
}
