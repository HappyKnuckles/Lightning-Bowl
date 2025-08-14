import { Injectable } from '@angular/core';
import { Directory, Filesystem } from '@capacitor/filesystem';
import * as ExcelJS from 'exceljs';
import { isPlatform } from '@ionic/angular';
import { ToastService } from 'src/app/core/services/toast/toast.service';
import { HapticService } from 'src/app/core/services/haptic/haptic.service';
import { ImpactStyle } from '@capacitor/haptics';
import { Game } from 'src/app/core/models/game.model';
import { StorageService } from 'src/app/core/services/storage/storage.service';
import { SortUtilsService } from '../sort-utils/sort-utils.service';
import { GameFilterService } from '../game-filter/game-filter.service';
import { GameStatsService } from '../game-stats/game-stats.service';
import { Stats } from 'src/app/core/models/stats.model';

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

  // TODO make one folder for all and one for each league and in there have stats and game history for the league
  async exportToExcel(): Promise<boolean> {
    try {
      const gameData = this.getGameDataForExport(this.storageService.games());
      const { overall, spares, throwStats, strike, special, playFrequency, series } = this.getStatsTablesForExport(this.statsService.currentStats());

      const workbook = new ExcelJS.Workbook();
      const gameWorksheet = workbook.addWorksheet('Game History');
      const statsWorksheet = workbook.addWorksheet('Statistics');

      // Game History Table
      this.addTable(gameWorksheet, 'GameHistoryTable', 'A1', Object.keys(gameData[0]), gameData);

      // Stats Tables
      const sections = [
        { name: 'OverallStats', start: 'A1', headers: ['Overall', 'Value'], data: overall },
        { name: 'SparesStats', start: 'D1', headers: ['Spares', 'Value'], data: spares },
        { name: 'ThrowStats', start: 'G1', headers: ['Throw', 'Value'], data: throwStats },
        { name: 'StrikeStats', start: 'J1', headers: ['Strike', 'Value'], data: strike },
        { name: 'SpecialStats', start: 'M1', headers: ['Special', 'Value'], data: special },
        { name: 'PlayFrequency', start: 'P1', headers: ['Frequency', 'Value'], data: playFrequency },
        { name: 'SeriesStats', start: 'S1', headers: ['Series', 'Value'], data: series },
      ];

      sections.forEach(({ name, start, headers, data }) => {
        this.addTable(statsWorksheet, name, start, headers, data);
      });

      // Set column widths for each section
      sections.forEach(({ headers, data }, idx) => {
        const startColIndex = idx * 3; // each section is 2 cols + 1-col gap
        this.setColumnWidths(statsWorksheet, headers, data, startColIndex + 1);
      });

      this.setColumnWidths(gameWorksheet, Object.keys(gameData[0]), gameData, 1);

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
          throw new Error('Permission not granted to save file.');
        }
      }

      this.hapticService.vibrate(ImpactStyle.Light);
      let suffix = '';
      const fileName = `game_data_${formattedDate}`;
      let i = 1;
      const existingFiles = JSON.parse(localStorage.getItem('savedFilenames') || '[]');

      if (isPlatform('mobileweb')) {
        while (existingFiles.includes(fileName + suffix + '.xlsx')) {
          suffix = `(${i++})`;
        }
      } else if (isPlatform('android') || isPlatform('ios')) {
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
    } catch (error) {
      console.error('Error exporting to Excel:', error);
      throw new Error(`Export failed: ${error}`);
    }
  }

  async readExcelData(file: File): Promise<ExcelRow[]> {
    try {
      const workbook = new ExcelJS.Workbook();
      const buffer = await this.fileToBuffer(file);
      await workbook.xlsx.load(buffer);
      const worksheet = workbook.worksheets[0];
      const gameData: ExcelRow[] = [];
      worksheet.eachRow((row) => {
        const rowData: Record<string, any> = {};
        row.eachCell((cell, colNumber) => {
          rowData[worksheet.getRow(1).getCell(colNumber).value as string] = cell.value;
        });
        gameData.push(rowData);
      });
      return gameData;
    } catch (error) {
      console.error('Error reading Excel data:', error);
      throw new Error(`Failed to read Excel file: ${error}`);
    }
  }

  async transformData(data: ExcelRow[]): Promise<void> {
    try {
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
          date: new Date(row['Date'] as string).getTime(),
          frames: frames,
          totalScore: parseInt(row['Total Score'] as string),
          frameScores: (row['Frame Scores'] as string).split(', ').map((score: string) => parseInt(score)),
          league: row['League'] as string,
          isPractice: (row['Practice'] as string)?.trim().toLowerCase() === 'true',
          isClean: (row['Clean'] as string)?.trim().toLowerCase() === 'true',
          isPerfect: (row['Perfect'] as string)?.trim().toLowerCase() === 'true',
          isSeries: (row['Series'] as string)?.trim().toLowerCase() === 'true',
          seriesId: row['Series ID'] as string,
          patterns: (row['Patterns'] as string)?.trim() 
            ? (row['Patterns'] as string).split(', ').slice(0, 2) 
            : (row['Pattern'] as string)?.trim() 
              ? (row['Pattern'] as string).split(', ').slice(0, 2) 
              : [],
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

      // Save leagues and balls into storage if needed
      for (const league of leagueMap.values()) {
        await this.storageService.addLeague(league);
      }

      for (const ball of ballMap.values()) {
        const ballToAdd = this.storageService.allBalls().find((b) => b.ball_name === ball);
        if (ballToAdd !== undefined && !this.storageService.arsenal().some((b) => b.ball_name === ball)) {
          await this.storageService.saveBallToArsenal(ballToAdd);
        }
      }
      const sortedGames = this.sortUtils.sortGameHistoryByDate(gameData);
      await this.storageService.saveGamesToLocalStorage(sortedGames);
      this.gameFilterService.setDefaultFilters();
    } catch (error) {
      console.error('Error transforming data:', error);
      throw new Error(`Data transformation failed: ${error}`);
    }
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
      } else {
        await Filesystem.writeFile({
          path: fileName,
          data: dataUri,
          directory: Directory.Documents,
          recursive: true,
        });
      }
    } catch (error) {
      console.error('Error saving Excel file:', error);
      throw new Error(`Failed to save file: ${error}`);
    }
  }

  private getGameDataForExport(gameHistory: Game[]): Record<string, ExcelCellValue>[] {
    const headers = [
      'Game',
      'Date',
      ...Array.from({ length: 10 }, (_, i) => `Frame ${i + 1}`),
      'Total Score',
      'Frame Scores',
      'League',
      'Practice',
      'Clean',
      'Perfect',
      'Series',
      'Series ID',
      'Patterns',
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
        new Date(game.date).toLocaleDateString('en-US'),
        ...frameValues,
        game.totalScore.toString(),
        game.frameScores.map((s) => s.toString()).join(', '),
        game.league || '',
        game.isPractice ? 'true' : 'false',
        game.isClean ? 'true' : 'false',
        game.isPerfect ? 'true' : 'false',
        game.isSeries ? 'true' : 'false',
        game.seriesId || '',
        game.patterns?.join(', ') || '',
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

  // TODO add new stats to export
  private getStatsTablesForExport(stats: Stats): Record<string, Record<string, ExcelCellValue>[]> {
    const formatPercent = (v: number) => `${v.toFixed(2)}%`;
    const formatFixed = (v: number) => v.toFixed(2);

    // Overall Stats
    const overallDefs: [string, ExcelCellValue][] = [
      ['Total Games', stats.totalGames.toString()],
      ['Perfect Games', stats.perfectGameCount.toString()],
      ['Clean Games', stats.cleanGameCount.toString()],
      ['Clean Game %', formatPercent(stats.cleanGamePercentage)],
      ['Average Score', formatFixed(stats.averageScore)],
      ['High Game', stats.highGame.toString()],
      ['Total Pins', stats.totalPins.toString()],
      ['First Ball Avg', formatFixed(stats.averageFirstCount)],
    ];
    const overall = overallDefs.map(([label, val]) => ({ Overall: label, Value: val }));

    // Throw Stats
    const throwDefs: [string, ExcelCellValue][] = [
      ['Total Strikes', stats.totalStrikes.toString()],
      ['Strikes per Game', formatFixed(stats.averageStrikesPerGame)],
      ['Total Spares', stats.totalSpares.toString()],
      ['Spares per Game', formatFixed(stats.averageSparesPerGame)],
      ['Total Opens', stats.totalSparesMissed.toString()],
      ['Opens per Game', formatFixed(stats.averageOpensPerGame)],
      ['Spare Conversion %', formatPercent(stats.spareConversionPercentage)],
      ['Mark %', formatPercent(stats.markPercentage)],
      ['Strike %', formatPercent(stats.strikePercentage)],
      ['Spare %', formatPercent(stats.sparePercentage)],
      ['Open %', formatPercent(stats.openPercentage)],
    ];
    const throwStats = throwDefs.map(([label, val]) => ({ Throw: label, Value: val }));

    // Spares Table
    const sparesEntries: [string, ExcelCellValue][] = [
      ['Total Spares Converted', stats.totalSpares.toString()],
      ['Total Spares Missed', stats.totalSparesMissed.toString()],
      ...stats.pinCounts.slice(1).map((count, index): [string, ExcelCellValue] => {
        const hit = count.toString();
        const miss = stats.missedCounts.slice(1)[index]?.toString() || '0';
        const rate = stats.spareRates.slice(1)[index] !== undefined ? formatPercent(stats.spareRates.slice(1)[index]) : '0%';
        return [`${index + 1} ${index + 1 === 1 ? 'Pin' : 'Pins'} Hit / Miss / Rate`, `${hit} / ${miss} / ${rate}`];
      }),
      ['Overall Spare Rate', formatPercent(stats.overallSpareRate)],
      ['Overall Missed Rate', formatPercent(stats.overallMissedRate)],
    ];
    const spares = sparesEntries.map(([metric, value]) => ({
      Spares: metric,
      Value: value,
    }));

    // Strike Stats
    const strikeDefs: [string, ExcelCellValue][] = [
      ['Turkeys', stats.turkeyCount?.toString() || '0'],
      ['4-Baggers', stats.bagger4Count?.toString() || '0'],
      ['5-Baggers', stats.bagger5Count?.toString() || '0'],
      ['6-Baggers', stats.bagger6Count?.toString() || '0'],
      ['7-Baggers', stats.bagger7Count?.toString() || '0'],
      ['8-Baggers', stats.bagger8Count?.toString() || '0'],
      ['9-Baggers', stats.bagger9Count?.toString() || '0'],
      ['10-Baggers', stats.bagger10Count?.toString() || '0'],
      ['11-Baggers', stats.bagger11Count?.toString() || '0'],
      ['Longest Strike Streak', stats['longestStrikeStreak']?.toString() || ''],
      ['Strike-to-Strike %', formatPercent(stats.strikeToStrikePercentage || 0)],
      ['Strikeouts (10th Frame)', stats.strikeoutCount?.toString() || '0'],
    ];
    const strike = strikeDefs.map(([label, val]) => ({ Strike: label, Value: val }));

    // Special Stats
    const specialDefs: [string, ExcelCellValue][] = [
      ['Dutch 200s', stats.dutch200Count?.toString() || '0'],
      ['Varipapa 300s', stats.varipapa300Count?.toString() || '0'],
      ['Full Spare Games', stats.allSparesGameCount?.toString() || '0'],
    ];
    const special = specialDefs.map(([label, val]) => ({ Special: label, Value: val }));

    // Play Frequency
    const freqDefs: [string, ExcelCellValue][] = [
      ['Avg Games/Week', stats.averageGamesPerWeek?.toFixed(2) || '0'],
      ['Avg Games/Month', stats.averageGamesPerMonth?.toFixed(2) || '0'],
      ['Avg Sessions/Week', stats.averageSessionsPerWeek?.toFixed(2) || '0'],
      ['Avg Sessions/Month', stats.averageSessionsPerMonth?.toFixed(2) || '0'],
      ['Avg Games/Session', stats.averageGamesPerSession?.toFixed(2) || '0'],
    ];
    const playFrequency = freqDefs.map(([label, val]) => ({ Frequency: label, Value: val }));

    // Series Stats
    const seriesDefs: [string, ExcelCellValue][] = [
      ['Avg 3-Series Score', stats.average3SeriesScore?.toFixed(2) || ''],
      ['High 3-Series', stats.high3Series?.toString() || ''],
      ['Avg 4-Series Score', stats.average4SeriesScore?.toFixed(2) || ''],
      ['High 4-Series', stats.high4Series?.toString() || ''],
      ['Avg 5-Series Score', stats.average5SeriesScore?.toFixed(2) || ''],
      ['High 5-Series', stats.high5Series?.toString() || ''],
      ['Avg 6-Series Score', stats.average6SeriesScore?.toFixed(2) || ''],
      ['High 6-Series', stats.high6Series?.toString() || ''],
    ];
    const series = seriesDefs.map(([label, val]) => ({ Series: label, Value: val }));

    return { overall, spares, throwStats, strike, special, playFrequency, series };
  }

  private addTable(worksheet: ExcelJS.Worksheet, name: string, ref: string, headers: string[], rows: Record<string, ExcelCellValue>[]): void {
    worksheet.addTable({
      name,
      ref,
      headerRow: true,
      totalsRow: false,
      style: { theme: 'TableStyleMedium1', showRowStripes: true },
      columns: headers.map((header) => ({ name: header })),
      rows: rows.map((row) => headers.map((header) => row[header])),
    });
  }

  private setColumnWidths(worksheet: ExcelJS.Worksheet, headers: string[], data: Record<string, ExcelCellValue>[], startIndex: number): void {
    headers.forEach((header, index) => {
      const maxContentLength = Math.max(header.length, ...data.map((row) => (row[header] ?? '').toString().length));
      worksheet.getColumn(startIndex + index).width = maxContentLength + 1;
    });
  }

  private async fileExists(path: string): Promise<boolean> {
    try {
      await Filesystem.stat({
        path: path + '.xlsx',
        directory: Directory.Documents,
      });
      return true;
    } catch (error) {
      console.error('File existence check error:', error);
      return false;
    }
  }

  private fileToBuffer(file: File): Promise<ArrayBuffer> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (event: ProgressEvent<FileReader>) => resolve(event.target?.result as ArrayBuffer);
      reader.onerror = (err) => {
        console.error('Error reading file:', err);
        reject(err);
      };
      reader.readAsArrayBuffer(file);
    });
  }
}
