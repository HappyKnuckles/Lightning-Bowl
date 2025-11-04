import {
  Component,
  OnInit,
  OnChanges,
  SimpleChanges,
  EventEmitter,
  Output,
  Input,
  QueryList,
  ViewChildren,
  ViewChild,
  CUSTOM_ELEMENTS_SCHEMA,
} from '@angular/core';
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
  IonLabel,
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
import { PinInputComponent, PinThrowEvent } from '../pin-input/pin-input.component';

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
    IonLabel,
    PinInputComponent,
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class GameGridComponent implements OnInit, OnChanges {
  @Input() isPinMode = false;
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

  // Pin mode properties
  throwsData: { value: number; pinsLeftStanding: number[] }[][] = Array.from({ length: 10 }, () => []); // Stores throw value and pins left standing
  currentFrameIndex = 0;
  currentThrowIndex = 0;

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

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['isPinMode'] && changes['isPinMode'].currentValue) {
      // Entering pin mode
      this.updateCurrentThrow();
    }
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
      // Clear corresponding throw data
      if (this.throwsData[frameIndex]) {
        this.throwsData[frameIndex].splice(inputIndex, 1);
      }
      this.updateScores();
      if (this.isPinMode) {
        this.updateCurrentThrow();
      }
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

    // Update pin mode if active
    if (this.isPinMode) {
      this.updateCurrentThrow();
    }
  }

  clearFrames(isSave: boolean): void {
    this.frames = Array.from({ length: 10 }, () => []);
    this.frameScores = [];
    this.totalScore = 0;
    this.maxScore = 300;
    this.throwsData = Array.from({ length: 10 }, () => []);
    this.currentFrameIndex = 0;
    this.currentThrowIndex = 0;

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
        this.throwsData,
        this.isPinMode,
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

  // Pin mode event handlers
  onPinThrowConfirmed(event: PinThrowEvent): void {
    // Save throw data with value and pins left standing
    if (!this.throwsData[event.frameIndex]) {
      this.throwsData[event.frameIndex] = [];
    }
    this.throwsData[event.frameIndex][event.throwIndex] = {
      value: event.pinsKnockedDown,
      pinsLeftStanding: event.pinsLeftStanding,
    };

    // Update the frame with the score
    this.frames[event.frameIndex][event.throwIndex] = event.pinsKnockedDown;

    // Move to next throw
    this.advanceToNextThrow();

    // Update scores
    this.updateScores();
  }

  onPinThrowUndone(): void {
    // Find the last recorded throw
    let lastFrameIndex = -1;
    let lastThrowIndex = -1;

    // Search backwards through frames
    for (let frameIndex = 9; frameIndex >= 0; frameIndex--) {
      const frame = this.frames[frameIndex];

      if (frameIndex === 9) {
        // 10th frame - check all three throws
        if (frame[2] !== undefined) {
          lastFrameIndex = frameIndex;
          lastThrowIndex = 2;
          break;
        } else if (frame[1] !== undefined) {
          lastFrameIndex = frameIndex;
          lastThrowIndex = 1;
          break;
        } else if (frame[0] !== undefined) {
          lastFrameIndex = frameIndex;
          lastThrowIndex = 0;
          break;
        }
      } else {
        // Frames 1-9 - check two throws
        if (frame[1] !== undefined) {
          lastFrameIndex = frameIndex;
          lastThrowIndex = 1;
          break;
        } else if (frame[0] !== undefined) {
          lastFrameIndex = frameIndex;
          lastThrowIndex = 0;
          break;
        }
      }
    }

    // If no throws found, nothing to undo
    if (lastFrameIndex === -1) {
      return;
    }

    // Remove the last throw
    delete this.frames[lastFrameIndex][lastThrowIndex];

    // Remove the throw data
    if (this.throwsData[lastFrameIndex] && this.throwsData[lastFrameIndex][lastThrowIndex]) {
      this.throwsData[lastFrameIndex].splice(lastThrowIndex, 1);
    }

    // Update current throw position
    this.currentFrameIndex = lastFrameIndex;
    this.currentThrowIndex = lastThrowIndex;

    // Update scores
    this.updateScores();
  }

  private updateCurrentThrow(): void {
    // Find the next throw that needs input
    for (let frameIndex = 0; frameIndex < 10; frameIndex++) {
      const frame = this.frames[frameIndex];

      if (frameIndex < 9) {
        // Frames 1-9
        if (frame[0] === undefined) {
          this.currentFrameIndex = frameIndex;
          this.currentThrowIndex = 0;
          return;
        } else if (frame[0] !== 10 && frame[1] === undefined) {
          this.currentFrameIndex = frameIndex;
          this.currentThrowIndex = 1;
          return;
        }
      } else {
        // Frame 10
        if (frame[0] === undefined) {
          this.currentFrameIndex = frameIndex;
          this.currentThrowIndex = 0;
          return;
        } else if (frame[1] === undefined) {
          this.currentFrameIndex = frameIndex;
          this.currentThrowIndex = 1;
          return;
        } else if ((frame[0] === 10 || frame[0] + frame[1] === 10) && frame[2] === undefined) {
          this.currentFrameIndex = frameIndex;
          this.currentThrowIndex = 2;
          return;
        }
      }
    }

    // All throws complete
    this.currentFrameIndex = 9;
    this.currentThrowIndex = 2;
  }

  private advanceToNextThrow(): void {
    const frame = this.frames[this.currentFrameIndex];

    if (this.currentFrameIndex < 9) {
      // Frames 1-9
      if (this.currentThrowIndex === 0) {
        if (frame[0] === 10) {
          // Strike - move to next frame
          this.currentFrameIndex++;
          this.currentThrowIndex = 0;
        } else {
          // Move to second throw
          this.currentThrowIndex = 1;
        }
      } else {
        // After second throw, move to next frame
        this.currentFrameIndex++;
        this.currentThrowIndex = 0;
      }
    } else {
      // Frame 10 - handle all valid combinations
      const firstThrow = frame[0];
      const secondThrow = frame[1];

      if (this.currentThrowIndex === 0) {
        // After first throw, always go to second
        this.currentThrowIndex = 1;
      } else if (this.currentThrowIndex === 1) {
        // After second throw
        if (firstThrow === 10 || firstThrow + secondThrow === 10) {
          // Strike or spare - get third throw
          this.currentThrowIndex = 2;
        }
      }
    }
  }

  getPinsLeftStandingForThrow(frameIndex: number, throwIndex: number): number[] {
    if (this.throwsData[frameIndex] && this.throwsData[frameIndex][throwIndex]) {
      return this.throwsData[frameIndex][throwIndex].pinsLeftStanding;
    }
    return [];
  }

  loadThrowsData(throwsData: { value: number; pinsLeftStanding: number[] }[][]): void {
    this.throwsData = throwsData || Array.from({ length: 10 }, () => []);
    // Sync frames with throws data
    this.frames = this.throwsData.map((frameThrows) => frameThrows.map((throwData) => throwData.value));
  }
}
