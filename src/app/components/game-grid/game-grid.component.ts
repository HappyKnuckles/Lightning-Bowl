import { Component, OnInit, EventEmitter, Output, QueryList, ViewChildren, ViewChild, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { ToastService } from 'src/app/services/toast/toast.service';
import { NgFor, NgIf } from '@angular/common';
import { IonGrid, IonSelect, IonSelectOption, IonRow, IonCol, IonInput, IonItem, IonTextarea, IonCheckbox, IonList } from '@ionic/angular/standalone';
import { FormsModule } from '@angular/forms';
import { HapticService } from 'src/app/services/haptic/haptic.service';
import { ImpactStyle } from '@capacitor/haptics';
import { StorageService } from 'src/app/services/storage/storage.service';
import { LeagueSelectorComponent } from '../league-selector/league-selector.component';
import { UtilsService } from 'src/app/services/utils/utils.service';
import { GameUtilsService } from 'src/app/services/game-utils/game-utils.service';
import { GameScoreCalculatorService } from 'src/app/services/game-score-calculator/game-score-calculator.service';
import { GameDataTransformerService } from 'src/app/services/game-transform/game-data-transform.service';
import { InputCustomEvent } from '@ionic/angular';

@Component({
  selector: 'app-game-grid',
  templateUrl: './game-grid.component.html',
  styleUrls: ['./game-grid.component.scss'],
  providers: [GameScoreCalculatorService],
  standalone: true,
  imports: [
    IonSelect,
    NgFor,
    IonSelectOption,
    IonList,
    IonCheckbox,
    IonItem,
    IonTextarea,
    IonGrid,
    IonRow,
    IonCol,
    IonInput,
    FormsModule,
    NgIf,
    NgFor,
    LeagueSelectorComponent,
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class GameGridComponent implements OnInit {
  @Output() maxScoreChanged = new EventEmitter<number>();
  @Output() totalScoreChanged = new EventEmitter<number>();
  @Output() leagueChanged = new EventEmitter<string>();
  @Output() isPracticeChanged = new EventEmitter<boolean>();
  @ViewChildren(IonInput) inputs!: QueryList<IonInput>;
  @ViewChild('leagueSelector') leagueSelector!: LeagueSelectorComponent;
  @ViewChild('checkbox') checkbox!: IonCheckbox;
  totalScore = 0;
  maxScore = 300;
  note = '';
  balls: string[] = [];
  selectedLeague = '';
  isPractice = true;
  frames = this.gameScoreCalculatorService.frames;
  frameScores = this.gameScoreCalculatorService.frameScores;
  constructor(
    private gameScoreCalculatorService: GameScoreCalculatorService,
    public storageService: StorageService,
    private transformGameService: GameDataTransformerService,
    private toastService: ToastService,
    private hapticService: HapticService,
    private gameUtilsService: GameUtilsService,
    private utilsService: UtilsService,
  ) {}

  ngOnInit(): void {
    this.maxScore = this.gameScoreCalculatorService.maxScore;
    this.totalScore = this.gameScoreCalculatorService.totalScore;
    this.maxScoreChanged.emit(this.maxScore);
    this.totalScoreChanged.emit(this.totalScore);
  }

  onLeagueChanged(league: string): void {
    this.selectedLeague = league;
    this.leagueChanged.emit(this.selectedLeague);
  }

  simulateScore(event: InputCustomEvent, frameIndex: number, inputIndex: number): void {
    const inputValue = event.detail.value!;
    const parsedValue = this.parseInputValue(inputValue, frameIndex, inputIndex);

    if (!this.isValidNumber0to10(parsedValue)) {
      this.handleInvalidInput(event);
      return;
    }
    if (!this.isValidFrameScore(parsedValue, frameIndex, inputIndex)) {
      this.handleInvalidInput(event);
      return;
    }

    this.gameScoreCalculatorService.frames[frameIndex][inputIndex] = parsedValue;
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
        this.gameScoreCalculatorService.frames,
        this.gameScoreCalculatorService.frameScores,
        this.gameScoreCalculatorService.totalScore,
        this.isPractice,
        this.selectedLeague,
        isSeries,
        seriesId,
        this.note,
        this.balls,
      );

      await this.storageService.saveGameToLocalStorage(gameData);
      this.clearFrames(true);
    } catch (error) {
      console.error('Error saving game to local storage:', error);
    }
  }

  isGameValid(): boolean {
    return this.gameUtilsService.isGameValid(this.gameScoreCalculatorService);
  }

  isNumber(value: unknown): boolean {
    return this.utilsService.isNumber(value);
  }

  clearFrames(isSave: boolean): void {
    this.gameScoreCalculatorService.clearRolls();
    this.inputs.forEach((input) => {
      input.value = '';
    });
    if (isSave) {
      this.note = '';
      this.selectedLeague = '';
      this.leagueSelector.selectedLeague = '';
      this.balls = [];
    }
    this.frames = this.gameScoreCalculatorService.frames;
    this.frameScores = this.gameScoreCalculatorService.frameScores;
    this.maxScore = this.gameScoreCalculatorService.maxScore;
    this.totalScore = this.gameScoreCalculatorService.totalScore;
    this.maxScoreChanged.emit(this.maxScore);
    this.totalScoreChanged.emit(this.totalScore);
  }

  private parseInputValue(inputValue: string, frameIndex: number, inputIndex: number): number {
    return this.gameUtilsService.parseInputValue(inputValue, frameIndex, inputIndex, this.gameScoreCalculatorService);
  }

  private isValidNumber0to10(value: number): boolean {
    return !isNaN(value) && value >= 0 && value <= 10;
  }

  private isValidFrameScore(inputValue: number, frameIndex: number, inputIndex: number): boolean {
    return this.gameUtilsService.isValidFrameScore(inputValue, frameIndex, inputIndex, this.gameScoreCalculatorService);
  }

  private handleInvalidInput(event: InputCustomEvent): void {
    this.hapticService.vibrate(ImpactStyle.Heavy, 300);
    event.target.value = '';
  }

  private updateScores(): void {
    this.totalScore = this.gameScoreCalculatorService.calculateScore();
    this.maxScore = this.gameScoreCalculatorService.calculateMaxScore();
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
