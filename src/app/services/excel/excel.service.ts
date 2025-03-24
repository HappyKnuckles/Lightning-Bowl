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
    const { overall, spares, series } = this.getStatsTablesForExport(this.statsService.currentStats());

    const workbook = new ExcelJS.Workbook();
    const gameWorksheet = workbook.addWorksheet('Game History');
    const statsWorksheet = workbook.addWorksheet('Statistics');

    // Add tables
    this.addTable(gameWorksheet, 'GameHistoryTable', 'A1', Object.keys(gameData[0]), gameData);
    this.addTable(statsWorksheet, 'OverallStats', 'A1', ['Overall', 'Value'], overall);
    this.addTable(statsWorksheet, 'SparesStats', 'D1', ['Spares', 'Value'], spares);
    this.addTable(statsWorksheet, 'SeriesStats', 'G1', ['Series', 'Value'], series);

    // Set column widths
    this.setColumnWidths(gameWorksheet, Object.keys(gameData[0]), gameData, 1);
    this.setColumnWidths(statsWorksheet, Object.keys(overall[0]), overall, 1);
    this.setColumnWidths(statsWorksheet, Object.keys(spares[0]), spares, Object.keys(overall[0]).length + 2);
    this.setColumnWidths(statsWorksheet, Object.keys(series[0]), series, Object.keys(overall[0]).length + Object.keys(spares[0]).length + 3);

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
      if (ballToAdd !== undefined && !this.storageService.arsenal().some((b) => b.ball_name === ball)) {
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
      'Frame Scores',
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

  private getStatsTablesForExport(stats: Stats): {
    overall: Record<string, ExcelCellValue>[];
    spares: Record<string, ExcelCellValue>[];
    series: Record<string, ExcelCellValue>[];
  } {
    const formatPercent = (value: number): string => `${value.toFixed(2)}%`;
    const formatFixed = (value: number): string => value.toFixed(2);

    // Overall Table
    const overallEntries: [string, ExcelCellValue][] = [
      ['Total Games', stats.totalGames.toString()],
      ['Perfect Game Count', stats.perfectGameCount.toString()],
      ['Clean Game Count', stats.cleanGameCount.toString()],
      ['Clean Game Percentage', formatPercent(stats.cleanGamePercentage)],
      ['Average First Count', formatFixed(stats.averageFirstCount)],
      ['Average Score', formatFixed(stats.averageScore)],
      ['High Game', stats.highGame.toString()],
      ['Total Pins', stats.totalPins.toString()],
      ['Total Strikes', stats.totalStrikes.toString()],
      ['Average Strikes Per Game', formatFixed(stats.averageStrikesPerGame)],
      ['Average Spares Per Game', formatFixed(stats.averageSparesPerGame)],
      ['Average Opens Per Game', formatFixed(stats.averageOpensPerGame)],
      ['Strike Percentage', formatPercent(stats.strikePercentage)],
      ['Spare Percentage', formatPercent(stats.sparePercentage)],
      ['Open Percentage', formatPercent(stats.openPercentage)],
    ];
    const overallTable = overallEntries.map(([metric, value]) => ({
      Overall: metric,
      Value: value,
    }));

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
    const sparesTable = sparesEntries.map(([metric, value]) => ({
      Spares: metric,
      Value: value,
    }));

    // Series Table
    const seriesEntries: [string, ExcelCellValue][] = [
      ['Average 3 Series Score', stats.average3SeriesScore !== undefined ? formatFixed(stats.average3SeriesScore) : ''],
      ['High 3 Series', stats.high3Series !== undefined ? stats.high3Series.toString() : ''],
      ['Average 4 Series Score', stats.average4SeriesScore !== undefined ? formatFixed(stats.average4SeriesScore) : ''],
      ['High 4 Series', stats.high4Series !== undefined ? stats.high4Series.toString() : ''],
      ['Average 5 Series Score', stats.average5SeriesScore !== undefined ? formatFixed(stats.average5SeriesScore) : ''],
      ['High 5 Series', stats.high5Series !== undefined ? stats.high5Series.toString() : ''],
      ['Average 6 Series Score', stats.average6SeriesScore !== undefined ? formatFixed(stats.average6SeriesScore) : ''],
      ['High 6 Series', stats.high6Series !== undefined ? stats.high6Series.toString() : ''],
    ];
    const seriesTable = seriesEntries.map(([metric, value]) => ({
      Series: metric,
      Value: value,
    }));

    return { overall: overallTable, spares: sparesTable, series: seriesTable };
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
