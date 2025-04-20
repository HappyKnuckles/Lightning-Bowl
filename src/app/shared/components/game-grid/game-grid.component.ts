import { Component, OnInit, EventEmitter, Output, QueryList, ViewChildren, ViewChild, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { ToastService } from 'src/app/core/services/toast/toast.service';
import { NgFor, NgIf } from '@angular/common';
import {
  IonGrid,
  IonModal,
  IonSelect,
  IonSelectOption,
  IonRow,
  IonCol,
  IonInput,
  IonItem,
  IonTextarea,
  IonCheckbox,
  IonList,
} from '@ionic/angular/standalone';
import { FormsModule } from '@angular/forms';
import { HapticService } from 'src/app/core/services/haptic/haptic.service';
import { ImpactStyle } from '@capacitor/haptics';
import { StorageService } from 'src/app/core/services/storage/storage.service';
import { LeagueSelectorComponent } from '../league-selector/league-selector.component';
import { GameUtilsService } from 'src/app/core/services/game-utils/game-utils.service';
import { GameScoreCalculatorService } from 'src/app/core/services/game-score-calculator/game-score-calculator.service';
import { GameDataTransformerService } from 'src/app/core/services/game-transform/game-data-transform.service';
import { InputCustomEvent } from '@ionic/angular';
import { ToastMessages } from 'src/app/core/constants/toast-messages.constants';
import { UtilsService } from 'src/app/core/services/utils/utils.service';
import { PatternTypeaheadComponent } from '../pattern-typeahead/pattern-typeahead.component';

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
    IonModal,
    PatternTypeaheadComponent,
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
  pattern = '';
  selectedLeague = '';
  isPractice = true;
  frames: number[][] = Array.from({ length: 10 }, () => []);
  frameScores: number[] = [];
  presentingElement?: HTMLElement;

  constructor(
    private gameScoreCalculatorService: GameScoreCalculatorService,
    public storageService: StorageService,
    private transformGameService: GameDataTransformerService,
    private toastService: ToastService,
    private hapticService: HapticService,
    private gameUtilsService: GameUtilsService,
    private utilsService: UtilsService,
  ) {}

  async ngOnInit(): Promise<void> {
    this.updateScores();
    this.maxScoreChanged.emit(this.maxScore);
    this.totalScoreChanged.emit(this.totalScore);
    this.presentingElement = document.querySelector('.ion-page')!;
  }

  onLeagueChanged(league: string): void {
    this.selectedLeague = league;
    this.leagueChanged.emit(this.selectedLeague);
  }

  selectPattern(pattern: string): void {
    this.pattern = pattern;
  }

  getFrameValue(frameIndex: number, inputIndex: number): string {
    const val = this.frames[frameIndex][inputIndex];
    return val !== undefined ? val.toString() : '';
  }

  simulateScore(event: InputCustomEvent, frameIndex: number, inputIndex: number): void {
    const inputValue = event.detail.value!;
    const parsedValue = this.gameUtilsService.parseInputValue(inputValue, frameIndex, inputIndex, this.frames);

    if (inputValue.length === 0) {
      this.frames[frameIndex].splice(inputIndex, 1);
      this.updateScores();
      return;
    }
    if (!this.isValidNumber0to10(parsedValue)) {
      this.handleInvalidInput(event);
      return;
    }
    if (!this.gameUtilsService.isValidFrameScore(parsedValue, frameIndex, inputIndex, this.frames)) {
      this.handleInvalidInput(event);
      return;
    }

    this.frames[frameIndex][inputIndex] = parsedValue;
    this.updateScores();
    this.focusNextInput(frameIndex, inputIndex);
  }

  clearFrames(isSave: boolean): void {
    this.frames = Array.from({ length: 10 }, () => []);
    this.frameScores = [];
    this.totalScore = 0;
    this.maxScore = 300;

    this.inputs.forEach((input) => {
      input.value = '';
    });

    if (isSave) {
      this.note = '';
      this.selectedLeague = '';
      this.leagueSelector.selectedLeague = '';
      this.pattern = '';
      this.isPractice = true;
      this.balls = [];
    }

    this.updateScores();
    this.maxScoreChanged.emit(this.maxScore);
    this.totalScoreChanged.emit(this.totalScore);
  }

  updateScores(): void {
    const scoreResult = this.gameScoreCalculatorService.calculateScore(this.frames);
    this.totalScore = scoreResult.totalScore;
    this.frameScores = scoreResult.frameScores;

    this.maxScore = this.gameScoreCalculatorService.calculateMaxScore(this.frames, this.totalScore);

    this.maxScoreChanged.emit(this.maxScore);
    this.totalScoreChanged.emit(this.totalScore);
  }

  async saveGameToLocalStorage(isSeries: boolean, seriesId: string): Promise<void> {
    try {
      if (this.selectedLeague === 'New') {
        this.toastService.showToast(ToastMessages.selectLeague, 'bug', true);
        return;
      }
      const gameData = this.transformGameService.transformGameData(
        this.frames,
        this.frameScores,
        this.totalScore,
        this.isPractice,
        this.selectedLeague,
        isSeries,
        seriesId,
        this.note,
        this.pattern,
        this.balls,
      );

      await this.storageService.saveGameToLocalStorage(gameData);
      this.clearFrames(true);
    } catch (error) {
      console.error('Error saving game to local storage:', error);
    }
  }

  isGameValid(): boolean {
    return this.gameUtilsService.isGameValid(undefined, this.frames);
  }

  isNumber(value: unknown): boolean {
    return this.utilsService.isNumber(value);
  }

  private isValidNumber0to10(value: number): boolean {
    return !isNaN(value) && value >= 0 && value <= 10;
  }

  private handleInvalidInput(event: InputCustomEvent): void {
    this.hapticService.vibrate(ImpactStyle.Heavy);
    event.target.value = '';
  }

  private async focusNextInput(frameIndex: number, inputIndex: number) {
    await new Promise((resolve) => setTimeout(resolve, 50));
    const inputArray = this.inputs.toArray();
    // Calculate the current index in the linear array of inputs.
    const currentInputPosition = frameIndex * 2 + inputIndex;

    // Find the next input element that is not disabled.
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
