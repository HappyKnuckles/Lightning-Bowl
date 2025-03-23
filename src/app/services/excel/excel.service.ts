import { Injectable } from '@angular/core';
import { Directory, Filesystem } from '@capacitor/filesystem';
import * as ExcelJS from 'exceljs';
import { isPlatform } from '@ionic/angular';
import { ToastService } from 'src/app/services/toast/toast.service';
import { HapticService } from 'src/app/services/haptic/haptic.service';
import { ImpactStyle } from '@capacitor/haptics';
import { Game } from 'src/app/models/game.model';
import { StorageService } from 'src/app/services/storage/storage.service';
import { SortUtilsService } from '../sort-utils/sort-utils.service';
import { GameFilterService } from '../game-filter/game-filter.service';
import { GameStatsService } from '../game-stats/game-stats.service';
import { Stats } from 'src/app/models/stats.model';
type ExcelCellValue = string | number | boolean | Date | null;
type ExcelRow = Record<string, ExcelCellValue>;

@Injectable({
  providedIn: 'root',
})
export class ExcelService {
  constructor(
    private toastService: ToastService,
    private hapticService: HapticService,
    private storageService: StorageService,
    private sortUtils: SortUtilsService,
    private gameFilterService: GameFilterService,
    private statsService: GameStatsService,
  ) {}

  async exportToExcel(): Promise<boolean> {
    // Get the data objects for games and stats.
    const gameData: Record<string, ExcelCellValue>[] = this.getGameDataForExport(this.storageService.games());
    const statsData: Record<string, ExcelCellValue>[] = this.getStatsForExport(this.statsService.currentStats());

    const workbook = new ExcelJS.Workbook();
    const gameWorksheet = workbook.addWorksheet('Game History');
    const statsWorksheet = workbook.addWorksheet('Statistics');

    // Get headers from the first object of each export data array.
    const gameHeaders = Object.keys(gameData[0]);
    const statsHeaders = Object.keys(statsData[0]);

    // Create tables in each worksheet.
    gameWorksheet.addTable({
      name: 'GameHistoryTable',
      ref: 'A1',
      headerRow: true,
      totalsRow: false,
      style: { theme: 'TableStyleMedium1', showRowStripes: true },
      columns: gameHeaders.map((header) => ({
        name: header,
        filterButton: ['League', 'Practice', 'Clean', 'Perfect', 'Series', 'Balls', 'Notes', 'Date', 'Total Score'].includes(header),
      })),
      rows: gameData.map((row) => gameHeaders.map((header) => row[header])),
    });

    statsWorksheet.addTable({
      name: 'StatisticsTable',
      ref: 'A1',
      headerRow: true,
      totalsRow: false,
      style: { theme: 'TableStyleMedium1', showRowStripes: true },
      columns: statsHeaders.map((header) => ({ name: header })),
      rows: statsData.map((row) => statsHeaders.map((header) => row[header])),
    });

    gameWorksheet.columns = gameHeaders.map((header) => {
      const maxContentLength = Math.max(header.length, ...gameData.map((row) => (row[header] ?? '').toString().length));
      return {
        header,
        key: header,
        width: maxContentLength + 1,
      };
    });

    statsWorksheet.columns = statsHeaders.map((header) => {
      const maxContentLength = Math.max(header.length, ...statsData.map((row) => (row[header] ?? '').toString().length));
      return {
        header,
        key: header,
        width: maxContentLength + 1,
      };
    });

    const date = new Date();
    const formattedDate = date.toLocaleString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });

    const isIos = isPlatform('ios');
    const permissionsGranted = isIos ? (await Filesystem.requestPermissions()).publicStorage === 'granted' : true;

    if (isIos && !permissionsGranted) {
      const permissionRequestResult = await Filesystem.requestPermissions();
      if (!permissionRequestResult) {
        return false;
      }
    }

    this.hapticService.vibrate(ImpactStyle.Light, 100);
    let suffix = '';
    const fileName = `game_data_${formattedDate}`;
    let i = 1;
    const existingFiles = JSON.parse(localStorage.getItem('savedFilenames') || '[]');

    if (isPlatform('mobileweb')) {
      while (existingFiles.includes(fileName + suffix + '.xlsx')) {
        suffix = `(${i++})`;
      }
    } else {
      while (await this.fileExists(fileName + suffix)) {
        suffix = `(${i++})`;
      }
    }

    const buffer = await workbook.xlsx.writeBuffer();
    await this.saveExcelFile(buffer, `${fileName + suffix}.xlsx`);

    if (isPlatform('mobileweb')) {
      existingFiles.push(`${fileName + suffix}.xlsx`);
      localStorage.setItem('savedFilenames', JSON.stringify(existingFiles));
    }
    return true;
  }

  async readExcelData(file: File): Promise<ExcelRow[]> {
    const workbook = new ExcelJS.Workbook();
    const buffer = await this.fileToBuffer(file);
    await workbook.xlsx.load(buffer);
    const worksheet = workbook.worksheets[0];
    const gameData: ExcelRow[] = [];
    worksheet.eachRow((row, rowNumber) => {
      const rowData: Record<string, any> = {};
      row.eachCell((cell, colNumber) => {
        rowData[worksheet.getRow(1).getCell(colNumber).value as string] = cell.value;
      });
      if (rowNumber !== 1) gameData.push(rowData);
    });
    return gameData;
  }

  async transformData(data: ExcelRow[]): Promise<void> {
    const gameData: Game[] = [];
    const leagueMap = new Set<string>();
    const ballMap = new Set<string>();

    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      const frames = [];
      for (let j = 1; j <= 10; j++) {
        const frame: { frameIndex: number; throws: { value: number; throwIndex: number }[] } = {
          frameIndex: j,
          throws: [],
        };

        const throwsData = row[`Frame ${j}`];
        if (typeof throwsData === 'string' && throwsData.trim() !== '') {
          if (throwsData.includes('/')) {
            const throws = throwsData.split(' / ').map((value) => parseInt(value));
            for (let k = 0; k < throws.length; k++) {
              frame.throws.push({ value: throws[k], throwIndex: k + 1 });
            }
          } else {
            frame.throws.push({ value: parseInt(throwsData), throwIndex: 1 });
          }
        }
        frames.push(frame);
      }

      const game: Game = {
        gameId: row['Game'] as string,
        date: parseInt(row['Date'] as string),
        frames: frames,
        totalScore: parseInt(row['Total Score'] as string),
        frameScores: (row['Frame scores'] as string).split(', ').map((score: string) => parseInt(score)),
        league: row['League'] as string,
        isPractice: (row['Practice'] as string)?.trim().toLowerCase() === 'true',
        isClean: (row['Clean'] as string)?.trim().toLowerCase() === 'true',
        isPerfect: (row['Perfect'] as string)?.trim().toLowerCase() === 'true',
        isSeries: (row['Series'] as string)?.trim().toLowerCase() === 'true',
        seriesId: row['Series ID'] as string,
        balls: (row['Balls'] as string)?.trim() ? (row['Balls'] as string).split(', ') : [],
        note: row['Notes'] as string,
      };

      if (game.league !== undefined && game.league !== '') {
        leagueMap.add(game.league);
      }

      if (game.balls) {
        for (const ball of game.balls) {
          ballMap.add(ball);
        }
      }

      gameData.push(game);
    }

    for (const league of leagueMap.values()) {
      await this.storageService.addLeague(league);
    }

    for (const ball of ballMap.values()) {
      const ballToAdd = this.storageService.allBalls().find((b) => b.ball_name === ball);
      if (ballToAdd !== undefined) {
        await this.storageService.saveBallToArsenal(ballToAdd);
      }
    }
    const sortedGames = this.sortUtils.sortGameHistoryByDate(gameData);
    await this.storageService.saveGamesToLocalStorage(sortedGames);
    this.gameFilterService.setDefaultFilters();
  }

  private async saveExcelFile(buffer: ArrayBuffer, fileName: string): Promise<void> {
    try {
      let binary = '';
      const bytes = new Uint8Array(buffer);
      const length = bytes.byteLength;

      for (let i = 0; i < length; i++) {
        binary += String.fromCharCode(bytes[i]);
      }

      const base64Data = btoa(binary);
      const dataUri = 'data:application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;base64,' + base64Data;

      if (isPlatform('desktop') || isPlatform('mobileweb') || isPlatform('pwa')) {
        const anchor = document.createElement('a');
        anchor.href = dataUri;
        anchor.download = fileName;

        document.body.appendChild(anchor);
        anchor.click();
        document.body.removeChild(anchor);

        this.toastService.showToast(`File saved successfully.`, 'checkmark-outline');
      } else {
        const savedFile = await Filesystem.writeFile({
          path: fileName,
          data: dataUri,
          directory: Directory.Documents,
          recursive: true,
        });
        this.toastService.showToast(`File saved at path: ${savedFile.uri}`, 'checkmark-outline');
      }
    } catch (error) {
      this.toastService.showToast(`${error}`, 'bug', true);
    }
  }

  private getGameDataForExport(gameHistory: Game[]): Record<string, ExcelCellValue>[] {
    const headers = [
      'Game',
      'Date',
      ...Array.from({ length: 10 }, (_, i) => `Frame ${i + 1}`),
      'Total Score',
      'Frame scores',
      'League',
      'Practice',
      'Clean',
      'Perfect',
      'Series',
      'Series ID',
      'Balls',
      'Notes',
    ];

    return gameHistory.map((game) => {
      const frameValues = Array.from({ length: 10 }, (_, i) => {
        if (game.frames[i]) {
          const throws = game.frames[i].throws.map((t: any) => t.value);
          if (throws.length === 1) {
            return `${throws[0]}`;
          } else if (throws.length === 2) {
            return `${throws[0]} / ${throws[1]}`;
          } else if (throws.length === 3) {
            return `${throws[0]} / ${throws[1]} / ${throws[2]}`;
          }
        }
        return '';
      });

      const rowData = [
        game.gameId.toString(),
        game.date.toString(),
        ...frameValues,
        game.totalScore.toString(),
        game.frameScores.map((s) => s.toString()).join(', '),
        game.league || '',
        game.isPractice ? 'true' : 'false',
        game.isClean ? 'true' : 'false',
        game.isPerfect ? 'true' : 'false',
        game.isSeries ? 'true' : 'false',
        game.seriesId || '',
        game.balls?.join(', ') || '',
        game.note || '',
      ];

      return headers.reduce(
        (obj, header, idx) => {
          obj[header] = rowData[idx];
          return obj;
        },
        {} as Record<string, ExcelCellValue>,
      );
    });
  }

  // TODO maybe optimize so the layout is better for spares etc
  private getStatsForExport(stats: Stats): Record<string, ExcelCellValue>[] {
    const headerRow = [
      'Total Games',
      'Total Pins',
      'Perfect Game Count',
      'Clean Game Count',
      'Clean Game Percentage',
      'Total Strikes',
      'Total Spares',
      'Total Spares Missed',
      'Total Spares Converted',
      'Hit Pin Counts',
      'Missed Counts',
      'Average Strikes Per Game',
      'Average Spares Per Game',
      'Average Opens Per Game',
      'Strike Percentage',
      'Spare Percentage',
      'Open Percentage',
      'Spare Conversion Percentage',
      'Average First Count',
      'Average Score',
      'High Game',
      'Spare Rates',
      'Overall Spare Rate',
      'Overall Missed Rate',
      'Average 3 Series Score',
      'High 3 Series',
      'Average 4 Series Score',
      'High 4 Series',
      'Average 5 Series Score',
      'High 5 Series',
      'Average 6 Series Score',
      'High 6 Series',
    ];

    const dataRow = [
      stats.totalGames.toString(),
      stats.totalPins.toString(),
      stats.perfectGameCount.toString(),
      stats.cleanGameCount.toString(),
      `${stats.cleanGamePercentage.toFixed(2)}%`,
      stats.totalStrikes.toString(),
      stats.totalSpares.toString(),
      stats.totalSparesMissed.toString(),
      stats.totalSparesConverted.toString(),
      stats.pinCounts.slice(1).join(', '),
      stats.missedCounts.slice(1).join(', '),
      stats.averageStrikesPerGame.toFixed(2),
      stats.averageSparesPerGame.toFixed(2),
      stats.averageOpensPerGame.toFixed(2),
      `${stats.strikePercentage.toFixed(2)}%`,
      `${stats.sparePercentage.toFixed(2)}%`,
      `${stats.openPercentage.toFixed(2)}%`,
      `${stats.spareConversionPercentage.toFixed(2)}%`,
      stats.averageFirstCount.toFixed(2),
      stats.averageScore.toFixed(2),
      stats.highGame.toString(),
      stats.spareRates
        .slice(1)
        .map((rate) => `${rate.toFixed(2)}%`)
        .join(', '),
      `${stats.overallSpareRate.toFixed(2)}%`,
      `${stats.overallMissedRate.toFixed(2)}%`,
      stats.average3SeriesScore !== undefined ? stats.average3SeriesScore.toFixed(2) : '',
      stats.high3Series !== undefined ? stats.high3Series.toString() : '',
      stats.average4SeriesScore !== undefined ? stats.average4SeriesScore.toFixed(2) : '',
      stats.high4Series !== undefined ? stats.high4Series.toString() : '',
      stats.average5SeriesScore !== undefined ? stats.average5SeriesScore.toFixed(2) : '',
      stats.high5Series !== undefined ? stats.high5Series.toString() : '',
      stats.average6SeriesScore !== undefined ? stats.average6SeriesScore.toFixed(2) : '',
      stats.high6Series !== undefined ? stats.high6Series.toString() : '',
    ];

    return [Object.fromEntries(dataRow.map((value, index) => [headerRow[index], value]))];
  }

  private async fileExists(path: string): Promise<boolean> {
    try {
      await Filesystem.stat({
        path: path + '.xlsx',
        directory: Directory.Documents,
      });
      return true;
    } catch (error) {
      console.error(error);
      return false;
    }
  }

  private fileToBuffer(file: File): Promise<ArrayBuffer> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (event: ProgressEvent<FileReader>) => resolve(event.target?.result as ArrayBuffer);
      reader.onerror = reject;
      reader.readAsArrayBuffer(file);
    });
  }
}
