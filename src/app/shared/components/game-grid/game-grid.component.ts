import {
  Component,
  OnInit,
  OnDestroy,
  QueryList,
  ViewChildren,
  ViewChild,
  CUSTOM_ELEMENTS_SCHEMA,
  input,
  output,
  effect,
  Input,
} from '@angular/core';
import { Platform } from '@ionic/angular';
import { Subscription } from 'rxjs';
import { ToastService } from 'src/app/core/services/toast/toast.service';
import { NgFor, NgIf } from '@angular/common';
import { IonGrid, IonModal, IonRow, IonCol, IonInput, IonItem, IonTextarea, IonCheckbox, IonList, IonLabel } from '@ionic/angular/standalone';
import { FormsModule } from '@angular/forms';
import { HapticService } from 'src/app/core/services/haptic/haptic.service';
import { ImpactStyle } from '@capacitor/haptics';
import { StorageService } from 'src/app/core/services/storage/storage.service';
import { LeagueSelectorComponent } from '../league-selector/league-selector.component';
import { GameScoreCalculatorService } from 'src/app/core/services/game-score-calculator/game-score-calculator.service';
import { GameDataTransformerService } from 'src/app/core/services/game-transform/game-data-transform.service';
import { InputCustomEvent } from '@ionic/angular';
import { ToastMessages } from 'src/app/core/constants/toast-messages.constants';
import { UtilsService } from 'src/app/core/services/utils/utils.service';
import { Game } from 'src/app/core/models/game.model';
import { GenericTypeaheadComponent } from '../generic-typeahead/generic-typeahead.component';
import { createPartialPatternTypeaheadConfig } from '../generic-typeahead/typeahead-configs';
import { TypeaheadConfig } from '../generic-typeahead/typeahead-config.interface';
import { PatternService } from 'src/app/core/services/pattern/pattern.service';
import { Pattern } from 'src/app/core/models/pattern.model';
import { Keyboard } from '@capacitor/keyboard';
import { addIcons } from 'ionicons';
import { chevronExpandOutline } from 'ionicons/icons';
import { BallSelectComponent } from '../ball-select/ball-select.component';
import { GameScoreToolbarComponent } from '../game-score-toolbar/game-score-toolbar.component';
import { alertEnterAnimation, alertLeaveAnimation } from '../../animations/alert.animation';
import { AnalyticsService } from 'src/app/core/services/analytics/analytics.service';
import { PinInputComponent, PinThrowEvent } from '../pin-input/pin-input.component';
import { PinDeckFrameRowComponent } from '../pin-deck-frame-row/pin-deck-frame-row.component';
import { BowlingGameValidationService } from 'src/app/core/services/game-utils/bowling-game-validation.service';
import { BowlingFrameFormatterService } from 'src/app/core/services/game-utils/bowling-frame-formatter.service';

@Component({
  selector: 'app-game-grid',
  templateUrl: './game-grid.component.html',
  styleUrls: ['./game-grid.component.scss'],
  providers: [GameScoreCalculatorService],
  standalone: true,
  imports: [
    NgFor,
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
    LeagueSelectorComponent,
    IonModal,
    GenericTypeaheadComponent,
    IonLabel,
    PinInputComponent,
    PinDeckFrameRowComponent,
    BallSelectComponent,
    GameScoreToolbarComponent,
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class GameGridComponent implements OnInit, OnDestroy {
  // Input signals
  ballSelectorId = input<string>();
  showMetadata = input<boolean>(true);
  patternModalId = input.required<string>();
  @Input() game: Game = {
    gameId: '',
    date: 0,
    frames: [],
    frameScores: [],
    totalScore: 0,
    isPractice: true,
    league: '',
    patterns: [],
    balls: [],
    note: '',
    isClean: false,
    isPerfect: false,
  };
  isPinInputMode = input<boolean>(false);

  // Output signals
  maxScoreChanged = output<number>();
  totalScoreChanged = output<number>();
  leagueChanged = output<string>();
  isPracticeChanged = output<boolean>();
  patternChanged = output<string[]>();
  toolbarStateChanged = output<{ show: boolean; offset: number }>();
  toolbarButtonClick = output<string>();
  toolbarDisabledState = output<{ strikeDisabled: boolean; spareDisabled: boolean }>();

  // View children and references
  @ViewChildren(IonInput) inputs!: QueryList<IonInput>;
  @ViewChild('leagueSelector') leagueSelector!: LeagueSelectorComponent;
  @ViewChild('checkbox') checkbox!: IonCheckbox;

  enterAnimation = alertEnterAnimation;
  leaveAnimation = alertLeaveAnimation;
  get isStrikeDisabled(): boolean {
    if (this.currentFrameIndex === null || this.currentRollIndex === null) {
      return true;
    }
    return !this.validationService.canRecordStrike(this.currentFrameIndex, this.currentRollIndex, this.game.frames);
  }

  get isSpareDisabled(): boolean {
    if (this.currentFrameIndex === null || this.currentRollIndex === null) {
      return true;
    }
    return !this.validationService.canRecordSpare(this.currentFrameIndex, this.currentRollIndex, this.game.frames);
  }
  maxScore = 300;
  presentingElement?: HTMLElement;
  patternTypeaheadConfig!: TypeaheadConfig<Partial<Pattern>>;
  // Pin mode properties
  throwsData: { value: number; pinsLeftStanding: number[]; pinsKnockedDown: number[]; isSplit: boolean }[][] = Array.from({ length: 10 }, () => []); // Stores throw value, pins left standing, and pins knocked down
  currentThrowIndex = 0;
  // Keyboard toolbar
  showButtonToolbar = false;
  currentFrameIndex: number | null = null;
  currentRollIndex: number | null = null;
  keyboardOffset = 0;
  isLandScapeMode = false;
  private isFrameInputFocused = false;

  private keyboardShowSubscription: Subscription | undefined;
  private keyboardHideSubscription: Subscription | undefined;
  private usingVisualViewportListener = false;
  private resizeSubscription: Subscription | undefined;

  constructor(
    private gameScoreCalculatorService: GameScoreCalculatorService,
    public storageService: StorageService,
    private transformGameService: GameDataTransformerService,
    private toastService: ToastService,
    private hapticService: HapticService,
    private utilsService: UtilsService,
    private platform: Platform,
    private patternService: PatternService,
    private analyticsService: AnalyticsService,
    private validationService: BowlingGameValidationService,
    private formatterService: BowlingFrameFormatterService,
  ) {
    this.initializeKeyboardListeners();
    addIcons({ chevronExpandOutline });

    effect(() => {
      if (this.isPinInputMode()) {
        this.updateCurrentThrow();
      }
    });
  }

  async ngOnInit(): Promise<void> {
    // TODO change this so it just uses the real game structure
    const currentGame = this.game;
    if (this.game.date != 0) {
      const newFrames: number[][] = [];
      for (let i = 0; i < 10; i++) {
        const frameData = currentGame.frames[i];

        if (frameData && Array.isArray(frameData.throws)) {
          newFrames.push(frameData.throws.map((t: { value: number }) => t.value));
        } else {
          newFrames.push([]);
        }
      }
      this.game.frames = newFrames;
    } else {
      this.game.frames = Array.from({ length: 10 }, () => []);
    }
    this.presentingElement = document.querySelector('.ion-page')!;
    this.patternTypeaheadConfig = createPartialPatternTypeaheadConfig((searchTerm: string) => this.patternService.searchPattern(searchTerm));
  }

  ngOnDestroy() {
    if (this.keyboardShowSubscription) {
      this.keyboardShowSubscription.unsubscribe();
    }
    if (this.keyboardHideSubscription) {
      this.keyboardHideSubscription.unsubscribe();
    }
    if (this.resizeSubscription) {
      this.resizeSubscription.unsubscribe();
    }
    if (this.usingVisualViewportListener && 'visualViewport' in window && window.visualViewport) {
      window.visualViewport.removeEventListener('resize', this.onViewportResize);
    }
  }

  initializeKeyboardListeners() {
    if (this.platform.is('mobile') && !this.platform.is('mobileweb')) {
      Keyboard.addListener('keyboardWillShow', (info) => {
        this.keyboardOffset = Math.max(0, info.keyboardHeight || 0);
        if (this.isFrameInputFocused) {
          this.showButtonToolbar = true;
          this.toolbarStateChanged.emit({ show: true, offset: this.keyboardOffset });
        }
      });

      Keyboard.addListener('keyboardWillHide', () => {
        this.keyboardOffset = 0;
        this.showButtonToolbar = false;
        this.toolbarStateChanged.emit({ show: false, offset: this.keyboardOffset });
      });
    } else if ('visualViewport' in window && window.visualViewport) {
      window.visualViewport.addEventListener('resize', this.onViewportResize);
    }
    this.resizeSubscription = this.platform.resize.subscribe(() => {
      this.isLandScapeMode = this.platform.isLandscape();
    });
  }

  handleInputFocus(frameIndex: number, rollIndex: number) {
    this.currentFrameIndex = frameIndex;
    this.currentRollIndex = rollIndex;
    this.isFrameInputFocused = true;

    setTimeout(() => {
      this.emitToolbarDisabledState();
    }, 100);
  }

  handleInputBlur() {
    this.isFrameInputFocused = false;
  }

  emitToolbarDisabledState(): void {
    if (this.currentFrameIndex === null || this.currentRollIndex === null) {
      return;
    }

    const canStrike = this.validationService.canRecordStrike(this.currentFrameIndex, this.currentRollIndex, this.game.frames);
    const canSpare = this.validationService.canRecordSpare(this.currentFrameIndex, this.currentRollIndex, this.game.frames);

    this.toolbarDisabledState.emit({ strikeDisabled: !canStrike, spareDisabled: !canSpare });
  }

  selectSpecialScore(char: string) {
    if (this.currentFrameIndex === null || this.currentRollIndex === null) {
      this.showButtonToolbar = false;
      return;
    }

    const mockEvent = {
      detail: { value: char },
    } as InputCustomEvent<{ value: string | undefined | null }>;

    this.simulateScore(mockEvent, this.currentFrameIndex, this.currentRollIndex);
  }

  onLeagueChanged(league: string): void {
    this.leagueChanged.emit(league);
  }

  onPatternChanged(patterns: string[]): void {
    if (patterns.length > 2) {
      patterns = patterns.slice(-2);
    }
    this.game.patterns = patterns;
    this.patternChanged.emit(patterns);
  }

  onBallSelect(selectedBalls: string[], modal: IonModal): void {
    modal.dismiss();
    this.game.balls = selectedBalls;
  }

  getSelectedBallsText(): string {
    const balls = this.game.balls || [];
    return balls.length > 0 ? balls.join(', ') : 'None';
  }

  getFrameValue(frameIndex: number, throwIndex: number): string {
    return this.formatterService.formatThrowValue(frameIndex, throwIndex, this.game.frames);
  }

  simulateScore(event: InputCustomEvent, frameIndex: number, inputIndex: number): void {
    const inputValue = event.detail.value!;
    const parsedValue = this.formatterService.parseInputValue(inputValue, frameIndex, inputIndex, this.game.frames);

    if (inputValue.length === 0) {
      this.game.frames[frameIndex].splice(inputIndex, 1);
      if (this.throwsData[frameIndex]) {
        this.throwsData[frameIndex].splice(inputIndex, 1);
      }
      this.updateScores();
      return;
    }
    if (!this.validationService.isValidNumber0to10(parsedValue)) {
      this.handleInvalidInput(event);
      return;
    }
    if (!this.validationService.isValidFrameScore(parsedValue, frameIndex, inputIndex, this.game.frames)) {
      this.handleInvalidInput(event);
      return;
    }

    this.game.frames[frameIndex][inputIndex] = parsedValue;
    this.updateScores();
    this.focusNextInput(frameIndex, inputIndex);

    this.emitToolbarDisabledState();
  }

  clearFrames(isSave: boolean): void {
    this.game.frames = Array.from({ length: 10 }, () => []);
    this.game.frameScores = [];
    this.game.totalScore = 0;
    this.maxScore = 300;
    this.throwsData = Array.from({ length: 10 }, () => []);
    this.currentFrameIndex = 0;
    this.currentThrowIndex = 0;

    this.inputs.forEach((input) => {
      input.value = '';
    });

    if (isSave) {
      this.game.note = '';
      this.game.league = '';
      this.leagueSelector.selectedLeague = '';
      this.game.patterns = [];
      this.game.isPractice = true;
      this.game.balls = [];
    }

    this.updateScores();
    this.totalScoreChanged.emit(this.game.totalScore);
    this.maxScoreChanged.emit(this.maxScore);
  }

  updateScores(): void {
    const scoreResult = this.gameScoreCalculatorService.calculateScore(this.game.frames);
    this.game.totalScore = scoreResult.totalScore;
    this.game.frameScores = scoreResult.frameScores;

    this.maxScore = this.gameScoreCalculatorService.calculateMaxScore(this.game.frames, this.game.totalScore);
    this.totalScoreChanged.emit(this.game.totalScore);
    this.maxScoreChanged.emit(this.maxScore);
  }

  async saveGameToLocalStorage(isSeries: boolean, seriesId: string): Promise<Game | null> {
    try {
      if (this.game.league === 'New') {
        this.toastService.showToast(ToastMessages.selectLeague, 'bug', true);
        return null;
      }
      const gameData = this.transformGameService.transformGameData(
        this.game.frames,
        this.game.frameScores,
        this.game.totalScore,
        this.game.isPractice,
        this.game.league,
        isSeries,
        seriesId,
        this.game.note,
        this.game.patterns,
        this.game.balls,
        this.game.gameId,
        this.game.date,
        this.throwsData,
        this.isPinInputMode(),
      );
      this.game.frames = gameData.frames;
      await this.storageService.saveGameToLocalStorage(gameData);
      if (this.showMetadata()) {
        this.clearFrames(true);
      }
      this.analyticsService.trackGameSaved({ score: gameData.totalScore });

      return gameData;
    } catch (error) {
      console.error('Error saving game to local storage:', error);
      this.analyticsService.trackError('game_calculate_score_error', error instanceof Error ? error.message : String(error));

      return null;
    }
  }

  isGameValid(): boolean {
    return this.validationService.isGameValid(undefined, this.game.frames);
  }

  isNumber(value: unknown): boolean {
    return this.utilsService.isNumber(value);
  }

  isStrikeButtonDisabled(): boolean {
    return this.validationService.isStrikeButtonDisabled(this.currentFrameIndex, this.currentRollIndex, this.game.frames);
  }

  isSpareButtonDisabled(): boolean {
    return this.validationService.isSpareButtonDisabled(this.currentFrameIndex, this.currentRollIndex, this.game.frames);
  }

  private handleInvalidInput(event: InputCustomEvent): void {
    this.hapticService.vibrate(ImpactStyle.Heavy);
    event.target.value = '';
  }

  private onViewportResize = () => {
    if (!window.visualViewport) return;

    const viewportHeight = window.visualViewport.height;
    const fullHeight = window.innerHeight;
    const keyboardActualHeight = fullHeight - viewportHeight;

    if (keyboardActualHeight > 100) {
      this.keyboardOffset = this.isLandScapeMode ? Math.max(0, keyboardActualHeight - 72) : Math.max(0, keyboardActualHeight - 85);

      if (this.isFrameInputFocused) {
        if (!this.showButtonToolbar) {
          this.showButtonToolbar = true;
          this.toolbarStateChanged.emit({ show: true, offset: this.keyboardOffset });
        } else {
          this.toolbarStateChanged.emit({ show: true, offset: this.keyboardOffset });
        }
      }
    } else {
      this.keyboardOffset = 0;
      if (this.showButtonToolbar) {
        this.showButtonToolbar = false;
        this.toolbarStateChanged.emit({ show: false, offset: this.keyboardOffset });
      }
    }
  };

  private async focusNextInput(frameIndex: number, inputIndex: number) {
    await new Promise((resolve) => setTimeout(resolve, 50));
    const inputArray = this.inputs.toArray();
    const currentInputPosition = frameIndex * 2 + inputIndex;

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
  onPinThrowConfirmed(pinThrow: PinThrowEvent): void {
    const { frameIndex, throwIndex, pinsKnockedDown, pinsKnockedDownNumbers, pinsLeftStanding } = pinThrow;

    if (!this.throwsData[frameIndex]) {
      this.throwsData[frameIndex] = [];
    }

    let isSplit = false;
    if (frameIndex < 9) {
      if (throwIndex === 0) {
        isSplit = this.validationService.isSplit(pinsLeftStanding);
      }
    } else {
      const frameThrows = this.game.frames[frameIndex].throws || [];
      const prevThrow = frameThrows[throwIndex - 1];

      let allowSplit = true;

      if (prevThrow) {
        const prevValue = prevThrow.value;
        const prevWasSplit = prevThrow.isSplit;
        const prevWasSpareOrStrike = prevValue === 10 || prevThrow.spare;

        if (prevWasSplit && !prevWasSpareOrStrike) {
          allowSplit = false;
        }
      }

      if (allowSplit) {
        isSplit = this.validationService.isSplit(pinsLeftStanding);
      }
    }

    const throwData = {
      value: pinsKnockedDown,
      pinsLeftStanding,
      pinsKnockedDown: pinsKnockedDownNumbers,
      isSplit,
    };

    this.throwsData[frameIndex][throwIndex] = throwData;

    if (!this.game.frames[frameIndex].throws) {
      this.game.frames[frameIndex].throws = [];
    }
    this.game.frames[frameIndex].throws[throwIndex] = throwData;

    this.game.frames[frameIndex][throwIndex] = pinsKnockedDown;

    this.throwsData = [...this.throwsData];

    this.game = { ...this.game };

    this.advanceToNextThrow();
    this.updateScores();
  }

  onPinThrowUndone(): void {
    if (!this.game || !Array.isArray(this.game.frames)) return;

    let frameIndex = this.currentFrameIndex ?? this.game.frames.length - 1;
    let throwIndex = (this.currentThrowIndex ?? 0) - 1;

    // Move to previous frame if needed
    while (throwIndex < 0 && frameIndex > 0) {
      frameIndex--;
      const prevFrame = this.game.frames[frameIndex];
      if (!prevFrame) continue;

      if (Array.isArray(prevFrame.throws)) {
        throwIndex = prevFrame.throws.length - 1;
      } else if (Array.isArray(prevFrame)) {
        throwIndex = prevFrame.length - 1;
      } else {
        throwIndex = -1;
      }
    }

    if (throwIndex < 0) return; // nothing left to undo

    // --- Remove the throw from throwsData immutably ---
    if (this.throwsData?.[frameIndex]) {
      const tdCopy = [...this.throwsData];
      const tdFrame = [...tdCopy[frameIndex]];
      tdFrame.splice(throwIndex, 1);
      tdCopy[frameIndex] = tdFrame;
      this.throwsData = tdCopy;
    }

    // For undo, always take the last throw in the frame
    const frameThrows = this.game.frames[frameIndex]?.throws ?? [];
    if (!frameThrows.length) return;

    // Undo the last throw in the frame
    const throwIndexToRemove = frameThrows.length - 1;
    const newThrows = [...frameThrows];
    newThrows.splice(throwIndexToRemove, 1);

    // Update frames numeric array for calculation
    const framesCopy = [...this.game.frames];
    framesCopy[frameIndex] = newThrows.map((t) => t.value);
    this.game.frames = framesCopy;

    // Keep metadata
    (this.game.frames[frameIndex] as any).throws = newThrows;

    // Update throwsData
    if (this.throwsData?.[frameIndex]) {
      const tdCopy = [...this.throwsData];
      const tdFrame = [...tdCopy[frameIndex]];
      tdFrame.splice(throwIndexToRemove, 1);
      tdCopy[frameIndex] = tdFrame;
      this.throwsData = tdCopy;
    }

    // Update indices
    this.currentFrameIndex = frameIndex;
    this.currentThrowIndex = newThrows.length;

    // Recompute
    this.updateScores();
  }

  private updateCurrentThrow(): void {
    for (let frameIndex = 0; frameIndex < 10; frameIndex++) {
      const frame = this.game.frames[frameIndex];

      if (frameIndex < 9) {
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

    this.currentFrameIndex = 9;
    this.currentThrowIndex = 2;
  }

  private advanceToNextThrow(): void {
    if (this.currentFrameIndex === null) return;

    const frame = this.game.frames[this.currentFrameIndex];

    if (this.currentFrameIndex < 9) {
      if (this.currentThrowIndex === 0) {
        if (frame[0] === 10) {
          this.currentFrameIndex++;
          this.currentThrowIndex = 0;
        } else {
          this.currentThrowIndex = 1;
        }
      } else {
        this.currentFrameIndex++;
        this.currentThrowIndex = 0;
      }
    } else {
      const firstThrow = frame[0];
      const secondThrow = frame[1];

      if (this.currentThrowIndex === 0) {
        this.currentThrowIndex = 1;
      } else if (this.currentThrowIndex === 1) {
        if (firstThrow === 10 || firstThrow + secondThrow === 10) {
          this.currentThrowIndex = 2;
        }
      }
    }
  }
}
