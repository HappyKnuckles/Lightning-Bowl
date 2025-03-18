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
  ) {}

  async exportToExcel(gameHistory: Game[]): Promise<boolean> {
    const gameData = this.getGameDataForExport(gameHistory);
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Game History');

    worksheet.columns = Object.keys(gameData[0]).map((key) => ({
      header: key,
      key,
    }));
    worksheet.addRows(gameData);

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
      const frames = [];
      for (let j = 2; j <= 11; j++) {
        const frame = {
          frameIndex: j,
          throws: [] as { value: number; throwIndex: number }[],
        };

        const throwsData = data[i][j.toString()];
        if (typeof throwsData === 'string') {
          if (throwsData.includes('/')) {
            const throws = throwsData.split(' / ').map((value) => parseInt(value));
            for (let k = 0; k < throws.length; k++) {
              frame.throws.push({ value: throws[k], throwIndex: k + 1 });
            }
          } else {
            // Handle case when only one throw is present
            frame.throws.push({ value: parseInt(throwsData), throwIndex: 1 });
          }
        }
        frames.push(frame);
      }

      const game: Game = {
        gameId: data[i]['0'] as string,
        date: parseInt(data[i]['1'] as string),
        frames: frames,
        totalScore: parseInt(data[i]['12'] as string),
        frameScores: (data[i]['13'] as string).split(', ').map((score: string) => parseInt(score)),
        league: data[i]['14'] as string,
        isPractice: (data[i]['15'] as string)?.trim().toLowerCase() === 'true',
        isClean: (data[i]['16'] as string)?.trim().toLowerCase() === 'true',
        isPerfect: (data[i]['17'] as string)?.trim().toLowerCase() === 'true',
        isSeries: (data[i]['18'] as string)?.trim().toLowerCase() === 'true',
        seriesId: data[i]['19'] as string,
        balls: (data[i]['20'] as string)?.trim() ? (data[i]['20'] as string).split(', ') : [],
        note: data[i]['21'] as string,
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
      // Create a Blob from the buffer
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      // Generate a temporary URL for the blob
      const blobUrl = URL.createObjectURL(blob);
      
      // Create an anchor element and set its properties for download
      const anchor = document.createElement('a');
      anchor.href = blobUrl;
      anchor.download = fileName;
      document.body.appendChild(anchor);
      anchor.click();
      document.body.removeChild(anchor);
      
      // Revoke the URL after the download starts
      URL.revokeObjectURL(blobUrl);
      
      this.toastService.showToast('File saved successfully.', 'checkmark-outline');
    } catch (error) {
      this.toastService.showToast(`${error}`, 'bug', true);
    }
  }
  

  private getGameDataForExport(gameHistory: Game[]): string[][] {
    const gameData: string[][] = [];

    // Add header row
    const headerRow = ['Game', 'Date'];
    for (let i = 1; i <= 10; i++) {
      headerRow.push(`Frame ${i}`);
    }
    headerRow.push('Total Score');
    headerRow.push('FrameScores');
    headerRow.push('League');
    headerRow.push('Practice');
    headerRow.push('Clean');
    headerRow.push('Perfect');
    headerRow.push('Series');
    headerRow.push('Series ID');
    headerRow.push('Balls');
    headerRow.push('Notes');
    gameData.push(headerRow);

    // Iterate through game history and format data for export
    gameHistory.forEach((game: Game) => {
      const gameId = game.gameId;
      const gameDate = game.date;

      const rowData: string[] = [gameId.toString(), gameDate.toString()];
      const frames = game.frames;
      frames.forEach((frame: any) => {
        const throws = frame.throws.map((throwData: any) => throwData.value);
        const firstThrow = throws.length > 0 ? throws[0] : '';
        const secondThrow = throws.length > 1 ? throws[1] : '';
        const thirdThrow = throws.length > 2 ? throws[2] : '';

        if (throws.length === 1) {
          rowData.push(`${firstThrow}`);
        }
        if (throws.length === 2) {
          rowData.push(`${firstThrow} / ${secondThrow}`);
        }
        if (throws.length === 3) {
          rowData.push(`${firstThrow} / ${secondThrow} / ${thirdThrow}`);
        }
      });

      // Pad missing frames with empty values
      const numFrames = frames.length;
      for (let i = numFrames; i < 10; i++) {
        rowData.push('', '');
      }

      rowData.push(game.totalScore.toString());
      rowData.push(game.frameScores.map((score) => score.toString()).join(', '));
      rowData.push(game.league || '');
      rowData.push(game.isPractice ? 'true' : 'false');
      rowData.push(game.isClean ? 'true' : 'false');
      rowData.push(game.isPerfect ? 'true' : 'false');
      rowData.push(game.isSeries ? 'true' : 'false');
      rowData.push(game.seriesId || '');
      rowData.push(game.balls?.join(', ') || '');
      rowData.push(game.note || '');
      gameData.push(rowData);
    });

    return gameData;
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
