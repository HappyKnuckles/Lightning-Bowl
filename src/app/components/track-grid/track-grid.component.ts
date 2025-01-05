import { Component, OnInit, EventEmitter, Output, QueryList, ViewChildren, ViewChild } from '@angular/core';
import { BowlingCalculatorService } from 'src/app/services/bowling-calculator/bowling-calculator.service';
import { ToastService } from 'src/app/services/toast/toast.service';
import { GameDataTransformerService } from 'src/app/services/transform-game/transform-game-data.service';
import { NgFor, NgIf } from '@angular/common';
import { IonGrid, IonRow, IonCol, IonInput, IonItem, IonTextarea, IonCheckbox, IonList } from '@ionic/angular/standalone';
import { FormsModule } from '@angular/forms';
import { HapticService } from 'src/app/services/haptic/haptic.service';
import { ImpactStyle } from '@capacitor/haptics';
import { addIcons } from 'ionicons';
import { documentTextOutline } from 'ionicons/icons';
import { StorageService } from 'src/app/services/storage/storage.service';
import { LeagueSelectorComponent } from '../league-selector/league-selector.component';
import { UtilsService } from 'src/app/services/utils/utils.service';
import { GameUtilsService } from 'src/app/services/game-utils/game-utils.service';

@Component({
  selector: 'app-track-grid',
  templateUrl: './track-grid.component.html',
  styleUrls: ['./track-grid.component.scss'],
  providers: [BowlingCalculatorService],
  standalone: true,
  imports: [IonList, IonCheckbox, IonItem, IonTextarea, IonGrid, IonRow, IonCol, IonInput, FormsModule, NgIf, NgFor, LeagueSelectorComponent],
})
export class TrackGridComponent implements OnInit {
  @Output() maxScoreChanged = new EventEmitter<number>();
  @Output() totalScoreChanged = new EventEmitter<number>();
  @Output() leagueChanged = new EventEmitter<string>();
  @Output() isPracticeChanged = new EventEmitter<boolean>();
  @ViewChildren(IonInput) inputs!: QueryList<IonInput>;
  @ViewChild('leagueSelector') leagueSelector!: LeagueSelectorComponent;
  @ViewChild('checkbox') checkbox!: IonCheckbox;
  totalScore: number = 0;
  maxScore: number = 300;
  note: string = '';
  selectedLeague = '';
  isPractice: boolean = true;
  frames = this.bowlingService.frames;
  frameScores = this.bowlingService.frameScores;
  constructor(
    private bowlingService: BowlingCalculatorService,
    private storageService: StorageService,
    private transformGameService: GameDataTransformerService,
    private toastService: ToastService,
    private hapticService: HapticService,
    private gameUtilsService: GameUtilsService,
    private utilsService: UtilsService
  ) {
    addIcons({ documentTextOutline });
  }

  ngOnInit(): void {
    this.maxScore = this.bowlingService.maxScore;
    this.totalScore = this.bowlingService.totalScore;
    this.maxScoreChanged.emit(this.maxScore);
    this.totalScoreChanged.emit(this.totalScore);
  }

  onLeagueChanged(league: string): void {
    this.selectedLeague = league;
    if (this.selectedLeague === '' || this.selectedLeague === 'New') {
      this.isPractice = true;
      this.checkbox.checked = true;
      this.checkbox.disabled = false;
    } else {
      this.isPractice = false;
      this.checkbox.checked = false;
      this.checkbox.disabled = true;
    }
    this.leagueChanged.emit(this.selectedLeague);
  }

  simulateScore(event: any, frameIndex: number, inputIndex: number): void {
    const inputValue = event.target.value;
    const parsedValue = this.parseInputValue(inputValue, frameIndex, inputIndex);

    if (!this.isValidNumber0to10(parsedValue)) {
      this.handleInvalidInput(event);
      return;
    }
    if (!this.isValidFrameScore(parsedValue, frameIndex, inputIndex)) {
      this.handleInvalidInput(event);
      return;
    }

    this.bowlingService.frames[frameIndex][inputIndex] = parsedValue;
    this.updateScores();
    this.focusNextInput(frameIndex, inputIndex);
  }

  async saveGameToLocalStorage(isSeries: boolean, seriesId: string): Promise<void> {
    try {
      if (this.selectedLeague === 'New') {
        this.toastService.showToast('Please select a league or create a new one.', 'bug', true);
        return;
      }
      const gameData = this.transformGameService.transformGameData(
        this.bowlingService.frames,
        this.bowlingService.frameScores,
        this.bowlingService.totalScore,
        this.isPractice,
        this.selectedLeague,
        isSeries,
        seriesId,
        this.note
      );

      await this.storageService.saveGameToLocalStorage(gameData);
      this.toastService.showToast('Game saved succesfully.', 'add');
      this.clearFrames(true);
    } catch (error) {
      this.toastService.showToast(`Error saving game data to local storage: ${error}`, 'bug', true);
    }
  }

  isGameValid(): boolean {
    return this.gameUtilsService.isGameValid(this.bowlingService);
  }

  isNumber(value: any): boolean {
    return this.utilsService.isNumber(value);
  }

  clearFrames(isSave: boolean): void {
    this.bowlingService.clearRolls();
    this.inputs.forEach((input) => {
      input.value = '';
    });
    if (isSave) {
      this.note = '';
      this.selectedLeague = '';
      this.leagueSelector.selectedLeague = '';
    }
    this.frames = this.bowlingService.frames;
    this.frameScores = this.bowlingService.frameScores;
    this.maxScore = this.bowlingService.maxScore;
    this.totalScore = this.bowlingService.totalScore;
    this.maxScoreChanged.emit(this.maxScore);
    this.totalScoreChanged.emit(this.totalScore);
  }

  private parseInputValue(inputValue: string, frameIndex: number, inputIndex: number): number {
    return this.gameUtilsService.parseInputValue(inputValue, frameIndex, inputIndex, this.bowlingService);
  }

  private isValidNumber0to10(value: number): boolean {
    return !isNaN(value) && value >= 0 && value <= 10;
  }

  private isValidFrameScore(inputValue: number, frameIndex: number, inputIndex: number): boolean {
    return this.gameUtilsService.isValidFrameScore(inputValue, frameIndex, inputIndex, this.bowlingService);
  }

  private handleInvalidInput(event: any): void {
    this.hapticService.vibrate(ImpactStyle.Heavy, 300);
    event.target.value = '';
  }

  private updateScores(): void {
    this.totalScore = this.bowlingService.calculateScore();
    this.maxScore = this.bowlingService.calculateMaxScore();
    this.maxScoreChanged.emit(this.maxScore);
    this.totalScoreChanged.emit(this.totalScore);
  }

  private async focusNextInput(frameIndex: number, inputIndex: number) {
    await new Promise((resolve) => setTimeout(resolve, 50));
    const inputArray = this.inputs.toArray();
    // Calculate the current index in the linear array of inputs
    const currentInputPosition = frameIndex * 2 + inputIndex;

    // Find the next input element that is not disabled
    for (let i = currentInputPosition + 1; i < inputArray.length; i++) {
      const nextInput = inputArray[i];
      const nextInputElement = await nextInput.getInputElement();

      if (!nextInputElement.disabled) {
        nextInput.setFocus();
        break;
      }
    }
  }
}
