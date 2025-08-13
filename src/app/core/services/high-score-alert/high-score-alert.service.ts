import { Injectable } from '@angular/core';
import { AlertController } from '@ionic/angular';
import { Game } from '../../models/game.model';
import { GameStatsService } from '../game-stats/game-stats.service';
import { StorageService } from '../storage/storage.service';

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
    private gameStatsService: GameStatsService,
    private storageService: StorageService,
  ) {}

  /**
   * Check if a new game achieves any new high scores and display alerts
   */
  async checkAndDisplayHighScoreAlerts(newGame: Game): Promise<void> {
    const records = await this.checkForNewRecords(newGame);

    for (const record of records) {
      await this.displayHighScoreAlert(record);
    }
  }

  /**
   * Check for new high score records
   */
  private async checkForNewRecords(newGame: Game): Promise<HighScoreRecord[]> {
    const records: HighScoreRecord[] = [];
    const allGames = this.storageService.games();

    // Get previous stats (all games except the new one)
    const previousGames = allGames.filter((game: Game) => game.gameId !== newGame.gameId);
    const previousStats = previousGames.length > 0 ? this.gameStatsService.calculateBowlingStats(previousGames) : { highGame: 0, highSeries: 0 };

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
      const seriesTotal = seriesGames.reduce((total: number, game: Game) => total + game.totalScore, 0);

      // Get previous best series
      const previousSeriesScores = this.getPreviousSeriesScores(allGames, newGame.seriesId);
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

    return records;
  }

  /**
   * Display congratulatory alert for new high score
   */
  private async displayHighScoreAlert(record: HighScoreRecord): Promise<void> {
    const isNewRecord = record.previousRecord === 0;
    const improvementText = isNewRecord ? 'Your first record!' : `Previous best: ${record.previousRecord}`;

    const alert = await this.alertController.create({
      header: '🎉 NEW HIGH SCORE! 🎉',
      subHeader: record.type === 'single_game' ? 'Single Game Record' : 'Series Record',
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
      details.push(`Patterns: ${game.patterns.join(', ')}`);
    }

    if (game.balls && game.balls.length > 0) {
      details.push(`Balls: ${game.balls.join(', ')}`);
    }

    details.push(`Date: ${new Date(game.date).toLocaleDateString()}`);

    return details.join(' • ');
  }

  /**
   * Get formatted series details for display
   */
  private getSeriesDetails(seriesGames: Game[]): string {
    const details = [];
    const scores = seriesGames.map((g) => g.totalScore).join(', ');

    details.push(`Games: ${scores}`);

    if (seriesGames[0]?.league) {
      details.push(`League: ${seriesGames[0].league}`);
    }

    details.push(`Date: ${new Date(seriesGames[0]?.date || Date.now()).toLocaleDateString()}`);

    return details.join(' • ');
  }

  /**
   * Get all previous series scores excluding the current series
   */
  private getPreviousSeriesScores(allGames: Game[], currentSeriesId: string): number[] {
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

    // Calculate total score for each series
    return Array.from(seriesMap.values()).map((seriesGames: Game[]) => seriesGames.reduce((total: number, game: Game) => total + game.totalScore, 0));
  }
}
