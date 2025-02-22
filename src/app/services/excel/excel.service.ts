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

@Injectable({
  providedIn: 'root',
})
export class ExcelService {
  constructor(private toastService: ToastService, private hapticService: HapticService, private storageService: StorageService, private sortUtils: SortUtilsService) { }

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

  async readExcelData(file: File): Promise<any[]> {
    const workbook = new ExcelJS.Workbook();
    const buffer = await this.fileToBuffer(file);
    await workbook.xlsx.load(buffer);
    const worksheet = workbook.worksheets[0];
    const gameData: any[] = [];
    worksheet.eachRow((row, rowNumber) => {
      const rowData: { [key: string]: any } = {};
      row.eachCell((cell, colNumber) => {
        rowData[worksheet.getRow(1).getCell(colNumber).value as string] = cell.value;
      });
      if (rowNumber !== 1) gameData.push(rowData);
    });
    return gameData;
  }

  async transformData(data: any[]): Promise<void> {
    const gameData = [];
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
        gameId: data[i]['0'],
        date: data[i]['1'],
        frames: frames,
        totalScore: parseInt(data[i]['12']),
        frameScores: data[i]['13'].split(', ').map((score: string) => parseInt(score)),
        league: data[i]['14'],
        isPractice: data[i]['15']?.trim().toLowerCase() === 'true',
        isClean: data[i]['16']?.trim().toLowerCase() === 'true',
        isPerfect: data[i]['17']?.trim().toLowerCase() === 'true',
        isSeries: data[i]['18']?.trim().toLowerCase() === 'true',
        seriesId: data[i]['19'],
        balls: data[i]['20']?.trim() ? data[i]['20'].split(', ') : [],
        note: data[i]['21'],
      };

      if (game.league !== undefined) {
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
  }

  private async saveExcelFile(buffer: any, fileName: string): Promise<void> {
    try {
      let binary = '';
      const bytes = new Uint8Array(buffer);
      const length = bytes.byteLength;

      for (let i = 0; i < length; i++) {
        binary += String.fromCharCode(bytes[i]);
      }

      const base64Data = btoa(binary);
      const dataUri = 'data:application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;base64,' + base64Data;

      if (isPlatform('desktop') || isPlatform('mobileweb')) {
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

      const rowData: any[] = [gameId, gameDate];
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

      rowData.push(game.totalScore);
      rowData.push(game.frameScores.join(', '));
      rowData.push(game.league || '');
      rowData.push(game.isPractice ? 'true' : 'false');
      rowData.push(game.isClean ? 'true' : 'false');
      rowData.push(game.isPerfect ? 'true' : 'false');
      rowData.push(game.isSeries ? 'true' : 'false');
      rowData.push(game.seriesId || '');
      rowData.push(game.balls?.join(', '));
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
      return false;
    }
  }

  private fileToBuffer(file: File): Promise<ArrayBuffer> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (event: any) => resolve(event.target.result);
      reader.onerror = reject;
      reader.readAsArrayBuffer(file);
    });
  }
}
