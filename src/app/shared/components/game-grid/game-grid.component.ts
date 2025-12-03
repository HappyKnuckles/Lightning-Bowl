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
  SimpleChanges,
  OnChanges,
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
import { InputCustomEvent } from '@ionic/angular';
import { UtilsService } from 'src/app/core/services/utils/utils.service';
import { Game, Frame, createEmptyGame, createEmptyFrames, createThrow, getThrowValue, cloneFrames } from 'src/app/core/models/game.model';
import { GenericTypeaheadComponent } from '../generic-typeahead/generic-typeahead.component';
import { createPartialPatternTypeaheadConfig } from '../generic-typeahead/typeahead-configs';
import { TypeaheadConfig } from '../generic-typeahead/typeahead-config.interface';
import { PatternService } from 'src/app/core/services/pattern/pattern.service';
import { Pattern } from 'src/app/core/models/pattern.model';
import { Keyboard } from '@capacitor/keyboard';
import { addIcons } from 'ionicons';
import { chevronExpandOutline } from 'ionicons/icons';
import { BallSelectComponent } from '../ball-select/ball-select.component';
import { alertEnterAnimation, alertLeaveAnimation } from '../../animations/alert.animation';
import { BowlingGameValidationService } from 'src/app/core/services/game-utils/bowling-game-validation.service';
import { BowlingFrameFormatterService } from 'src/app/core/services/game-utils/bowling-frame-formatter.service';
import { GameScoreToolbarComponent } from '../game-score-toolbar/game-score-toolbar.component';

/**
 * GameGridComponent is a PRESENTATIONAL component.
 * It receives game data via @Input and emits all changes via @Output events.
 * The parent component (AddGamePage or GameComponent) owns the game state and handles persistence.
 *
 * IMPORTANT: Frame[] is the SINGLE SOURCE OF TRUTH for game state.
 * No number[][] arrays are used.
 */
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
    BallSelectComponent,
    GameScoreToolbarComponent,
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class GameGridComponent implements OnInit, OnDestroy, OnChanges {
  // Input signals
  ballSelectorId = input<string>();
  showMetadata = input<boolean>(true);
  patternModalId = input.required<string>();
  game = input<Game>(createEmptyGame());

  // Output signals - emit all changes to parent
  maxScoreChanged = output<number>();
  totalScoreChanged = output<number>();
  leagueChanged = output<string>();
  isPracticeChanged = output<boolean>();
  patternChanged = output<string[]>();
  toolbarStateChanged = output<{ show: boolean; offset: number }>();
  toolbarButtonClick = output<string>();
  toolbarDisabledState = output<{ strikeDisabled: boolean; spareDisabled: boolean }>();

  // Output events for game state changes - parent handles persistence
  gameChanged = output<Game>();
  framesCleared = output<{ clearMetadata: boolean }>();
  saveRequested = output<{ isSeries: boolean; seriesId: string }>();
  noteChanged = output<string>();
  ballsChanged = output<string[]>();

  // View children and references
  @ViewChildren(IonInput) inputs!: QueryList<IonInput>;
  @ViewChild('leagueSelector') leagueSelector!: LeagueSelectorComponent;
  @ViewChild('checkbox') checkbox!: IonCheckbox;

  enterAnimation = alertEnterAnimation;
  leaveAnimation = alertLeaveAnimation;
  maxScore = 300;
  presentingElement?: HTMLElement;
  patternTypeaheadConfig!: TypeaheadConfig<Partial<Pattern>>;

  /**
   * LOCAL FRAME STATE - Frame[] is the SINGLE SOURCE OF TRUTH
   * All state management derives from this Frame[] array
   */
  private localFrames: Frame[] = createEmptyFrames();
  localFrameScores: number[] = [];
  private localTotalScore = 0;

  // Keyboard toolbar state
  showButtonToolbar = false;
  currentFrameIndex: number | null = null;
  currentThrowIndex: number | null = null;
  keyboardOffset = 0;
  isLandScapeMode = false;
  private isFrameInputFocused = false;

  private keyboardShowSubscription: Subscription | undefined;
  private keyboardHideSubscription: Subscription | undefined;
  private usingVisualViewportListener = false;
  private resizeSubscription: Subscription | undefined;

  /**
   * Check if strike button should be disabled based on current frame state
   */
  get isStrikeDisabled(): boolean {
    if (this.currentFrameIndex === null || this.currentThrowIndex === null) {
      return true;
    }
    return !this.canRecordStrike(this.currentFrameIndex, this.currentThrowIndex);
  }

  /**
   * Check if spare button should be disabled based on current frame state
   */
  get isSpareDisabled(): boolean {
    if (this.currentFrameIndex === null || this.currentThrowIndex === null) {
      return true;
    }
    return !this.canRecordSpare(this.currentFrameIndex, this.currentThrowIndex);
  }

  /**
   * Get current game with null safety for template binding
   */
  get currentGame(): Game {
    return this.game() || createEmptyGame();
  }

  constructor(
    private gameScoreCalculatorService: GameScoreCalculatorService,
    public storageService: StorageService,
    private toastService: ToastService,
    private hapticService: HapticService,
    private formatterService: BowlingFrameFormatterService,
    private utilsService: UtilsService,
    private platform: Platform,
    private patternService: PatternService,
    private validationService: BowlingGameValidationService,
  ) {
    this.initializeKeyboardListeners();
    addIcons({ chevronExpandOutline });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['game']) {
      this.syncLocalStateFromGame();
    }
  }

  async ngOnInit(): Promise<void> {
    this.syncLocalStateFromGame();
    this.presentingElement = document.querySelector('.ion-page')!;
    this.patternTypeaheadConfig = createPartialPatternTypeaheadConfig((searchTerm: string) => this.patternService.searchPattern(searchTerm));
  }

  /**
   * Sync local Frame[] state from the input game signal
   */
  private syncLocalStateFromGame(): void {
    const currentGame = this.game();
    if (!currentGame) {
      this.localFrames = createEmptyFrames();
      this.localFrameScores = [];
      this.localTotalScore = 0;
      return;
    }

    // Deep clone frames to avoid mutating the input
    this.localFrames = cloneFrames(currentGame.frames);
    this.localFrameScores = [...(currentGame.frameScores || [])];
    this.localTotalScore = currentGame.totalScore || 0;
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

  handleInputFocus(frameIndex: number, throwIndex: number) {
    this.currentFrameIndex = frameIndex;
    this.currentThrowIndex = throwIndex;
    this.isFrameInputFocused = true;

    setTimeout(() => {
      this.emitToolbarDisabledState();
    }, 100);
  }

  handleInputBlur() {
    this.isFrameInputFocused = false;
  }

  onLeagueChanged(league: string): void {
    this.leagueChanged.emit(league);
  }

  onPatternChanged(patterns: string[]): void {
    if (patterns.length > 2) {
      patterns = patterns.slice(-2);
    }
    this.patternChanged.emit(patterns);
  }

  onBallSelect(selectedBalls: string[], modal: IonModal): void {
    modal.dismiss();
    this.ballsChanged.emit(selectedBalls);
  }

  onNoteChange(note: string): void {
    this.noteChanged.emit(note);
  }

  onIsPracticeChange(isPractice: boolean): void {
    this.isPracticeChanged.emit(isPractice);
  }

  getSelectedBallsText(): string {
    const balls = this.currentGame?.balls || [];
    return balls.length > 0 ? balls.join(', ') : 'None';
  }

  /**
   * Get the display value for a throw (X for strike, / for spare, number otherwise)
   * Reads directly from Frame[] - the single source of truth
   */
  getFrameValue(frameIndex: number, throwIndex: number): string {
    const frame = this.localFrames[frameIndex];
    if (!frame) return '';

    const val = getThrowValue(frame, throwIndex);
    if (val === undefined || val === null) {
      return '';
    }

    const firstBall = getThrowValue(frame, 0);
    const isTenth = frameIndex === 9;

    if (throwIndex === 0) {
      return val === 10 ? 'X' : val.toString();
    }

    if (!isTenth) {
      if (firstBall !== undefined && firstBall !== 10 && firstBall + val === 10) {
        return '/';
      }
      return val.toString();
    }

    const secondBall = getThrowValue(frame, 1);

    if (throwIndex === 1) {
      if (firstBall !== undefined && firstBall !== 10 && firstBall + val === 10) {
        return '/';
      }
      return val === 10 ? 'X' : val.toString();
    }

    if (throwIndex === 2) {
      if (firstBall === 10) {
        if (secondBall === 10) {
          return val === 10 ? 'X' : val.toString();
        }
        return secondBall !== undefined && secondBall + val === 10 ? '/' : val.toString();
      }
      return val === 10 ? 'X' : val.toString();
    }

    return val.toString();
  }

  /**
   * Get frame score for display
   */
  getFrameScore(frameIndex: number): number | undefined {
    return this.localFrameScores[frameIndex];
  }

  /**
   * Get total score for display
   */
  getTotalScore(): number {
    return this.localTotalScore;
  }

  /**
   * Get local frames for template iteration
   */
  getLocalFrames(): Frame[] {
    return this.localFrames;
  }

  /**
   * Safely get a throw value from local frames
   * Used by template for disabled state checks and score display
   */
  getLocalFrameValue(frameIndex: number, throwIndex: number): number | undefined {
    return getThrowValue(this.localFrames[frameIndex], throwIndex);
  }

  emitToolbarDisabledState() {
    this.toolbarDisabledState.emit({
      strikeDisabled: this.isStrikeButtonDisabled(),
      spareDisabled: this.isSpareButtonDisabled(),
    });
  }

  selectSpecialScore(char: string) {
    if (this.currentFrameIndex === null || this.currentThrowIndex === null) {
      this.showButtonToolbar = false;
      return;
    }

    const mockEvent = {
      detail: { value: char },
    } as InputCustomEvent<{ value: string | undefined | null }>;

    this.simulateScore(mockEvent, this.currentFrameIndex, this.currentThrowIndex);
  }

  /**
   * Handle score input - updates Frame[] directly
   * This is the main entry point for recording throws
   */
  simulateScore(event: InputCustomEvent, frameIndex: number, throwIndex: number): void {
    const inputValue = event.detail.value!;
    const parsedValue = this.parseInputValue(inputValue, frameIndex, throwIndex);

    if (inputValue.length === 0) {
      // Remove the throw from the frame
      this.removeThrow(frameIndex, throwIndex);
      this.updateScores();
      return;
    }

    if (!this.isValidNumber0to10(parsedValue)) {
      this.handleInvalidInput(event);
      return;
    }

    if (!this.isValidFrameScore(parsedValue, frameIndex, throwIndex)) {
      this.handleInvalidInput(event);
      return;
    }

    // Record the throw in the Frame
    this.recordThrow(frameIndex, throwIndex, parsedValue);
    this.updateScores();
    this.focusNextInput(frameIndex, throwIndex);
    this.emitToolbarDisabledState();
  }

  /**
   * Record a throw in a frame - mutates localFrames directly
   */
  private recordThrow(frameIndex: number, throwIndex: number, value: number): void {
    const frame = this.localFrames[frameIndex];
    if (!frame) return;

    // Ensure throws array has enough elements
    while (frame.throws.length <= throwIndex) {
      frame.throws.push(createThrow(0, frame.throws.length + 1));
    }

    // Update the throw
    frame.throws[throwIndex] = createThrow(value, throwIndex + 1);
  }

  /**
   * Remove a throw from a frame
   */
  private removeThrow(frameIndex: number, throwIndex: number): void {
    const frame = this.localFrames[frameIndex];
    if (!frame || !frame.throws) return;

    if (throwIndex >= 0 && throwIndex < frame.throws.length) {
      frame.throws.splice(throwIndex, 1);
      // Re-index remaining throws
      frame.throws.forEach((t, idx) => {
        t.throwIndex = idx + 1;
      });
    }
  }

  /**
   * Parse input value (handles X, /, and numeric values)
   */
  private parseInputValue(input: string, frameIndex: number, throwIndex: number): number {
    const upperInput = input.toUpperCase();

    if (upperInput === 'X') {
      return 10;
    }

    if (upperInput === '/') {
      const firstThrow = getThrowValue(this.localFrames[frameIndex], 0);
      if (firstThrow !== undefined && throwIndex > 0) {
        // For 10th frame, handle the spare calculation based on the previous throw in that specific context
        if (frameIndex === 9 && throwIndex === 2) {
          const secondThrow = getThrowValue(this.localFrames[frameIndex], 1);
          if (getThrowValue(this.localFrames[frameIndex], 0) === 10 && secondThrow !== undefined) {
            return 10 - secondThrow;
          }
        }
        return 10 - firstThrow;
      }
      return 0;
    }

    return parseInt(input, 10) || 0;
  }

  /**
   * Validate that a number is between 0 and 10
   */
  private isValidNumber0to10(value: number): boolean {
    return !isNaN(value) && value >= 0 && value <= 10;
  }

  /**
   * Validate that a frame score is valid
   */
  private isValidFrameScore(inputValue: number, frameIndex: number, throwIndex: number): boolean {
    const frame = this.localFrames[frameIndex];

    if (throwIndex === 1 && getThrowValue(frame, 0) === undefined) {
      return false;
    }

    if (frameIndex < 9) {
      const firstThrow = getThrowValue(frame, 0) ?? 0;
      const secondThrow = throwIndex === 1 ? inputValue : (getThrowValue(frame, 1) ?? 0);

      if (throwIndex === 0 && getThrowValue(frame, 1) !== undefined) {
        return inputValue + (getThrowValue(frame, 1) ?? 0) <= 10;
      }
      return firstThrow + secondThrow <= 10;
    } else {
      // 10th frame validation
      const firstThrow = getThrowValue(frame, 0) ?? 0;
      const secondThrow = getThrowValue(frame, 1) ?? 0;

      switch (throwIndex) {
        case 0:
          return inputValue <= 10;
        case 1:
          if (firstThrow === 10) {
            return inputValue <= 10;
          }
          return firstThrow + inputValue <= 10 || firstThrow + inputValue === 10;
        case 2:
          if (firstThrow === 10 || firstThrow + secondThrow === 10) {
            if (firstThrow === 10 && secondThrow !== 10) {
              return secondThrow + inputValue <= 10;
            }
            return inputValue <= 10;
          }
          return false;
        default:
          return false;
      }
    }
  }

  /**
   * Check if a strike can be recorded at the current position
   */
  private canRecordStrike(frameIndex: number, throwIndex: number): boolean {
    if (frameIndex < 9) {
      return throwIndex === 0;
    }

    const frame = this.localFrames[9];
    const first = getThrowValue(frame, 0);
    const second = getThrowValue(frame, 1);

    if (throwIndex === 0) return true;
    if (throwIndex === 1) return first === 10;
    if (throwIndex === 2) {
      if (first === 10 && second === 10) return true;
      if (first !== undefined && second !== undefined && first + second === 10 && first !== 10) return true;
      if (first !== 10 && second === 10) return true;
      return false;
    }
    return false;
  }

  /**
   * Check if a spare can be recorded at the current position
   */
  private canRecordSpare(frameIndex: number, throwIndex: number): boolean {
    if (throwIndex === 0) return false;

    if (frameIndex < 9) {
      const first = getThrowValue(this.localFrames[frameIndex], 0);
      return first !== undefined && first !== 10;
    } else {
      const first = getThrowValue(this.localFrames[9], 0);
      const second = getThrowValue(this.localFrames[9], 1);

      if (throwIndex === 1) return first !== undefined && first !== 10;
      if (throwIndex === 2) {
        if (first === 10 && second !== undefined && second !== 10) return true;
        return false;
      }
      return false;
    }
  }

  /**
   * Clear frames - resets to empty Frame[]
   */
  clearFrames(clearMetadata: boolean): void {
    this.localFrames = createEmptyFrames();
    this.localFrameScores = [];
    this.localTotalScore = 0;
    this.maxScore = 300;

    this.inputs.forEach((input) => {
      input.value = '';
    });

    if (clearMetadata && this.leagueSelector) {
      this.leagueSelector.selectedLeague = '';
    }

    this.totalScoreChanged.emit(0);
    this.maxScoreChanged.emit(300);
    this.framesCleared.emit({ clearMetadata });
  }

  /**
   * Update scores from Frame[] - uses the new Frame-based calculator
   */
  updateScores(): void {
    const scoreResult = this.gameScoreCalculatorService.calculateScoreFromFrames(this.localFrames);
    this.localTotalScore = scoreResult.totalScore;
    this.localFrameScores = scoreResult.frameScores;

    this.maxScore = this.gameScoreCalculatorService.calculateMaxScoreFromFrames(this.localFrames, this.localTotalScore);
    this.totalScoreChanged.emit(this.localTotalScore);
    this.maxScoreChanged.emit(this.maxScore);

    // Emit full game state change for parent to handle
    this.emitGameChanged();
  }

  /**
   * Emit the current game state to parent
   * Frames are already in Frame[] format - no conversion needed
   */
  private emitGameChanged(): void {
    const currentGame = this.game();
    const updatedGame: Game = {
      ...currentGame,
      frames: cloneFrames(this.localFrames),
      frameScores: [...this.localFrameScores],
      totalScore: this.localTotalScore,
    };
    this.gameChanged.emit(updatedGame);
  }

  /**
   * Request parent to save the game
   */
  requestSave(isSeries: boolean, seriesId: string): void {
    this.saveRequested.emit({ isSeries, seriesId });
  }

  /**
   * Get the current game state for parent to use when saving
   * Returns Frame[] format - the single source of truth
   */
  getCurrentGameState(): { frames: Frame[]; frameScores: number[]; totalScore: number } {
    return {
      frames: cloneFrames(this.localFrames),
      frameScores: [...this.localFrameScores],
      totalScore: this.localTotalScore,
    };
  }

  /**
   * Validate if the game is complete and valid
   */
  isGameValid(): boolean {
    return this.validationService.isGameValidFromFrames(this.localFrames);
  }

  isNumber(value: unknown): boolean {
    return this.utilsService.isNumber(value);
  }

  isStrikeButtonDisabled(): boolean {
    if (this.currentFrameIndex === null || this.currentThrowIndex === null) return true;
    return !this.canRecordStrike(this.currentFrameIndex, this.currentThrowIndex);
  }

  isSpareButtonDisabled(): boolean {
    if (this.currentFrameIndex === null || this.currentThrowIndex === null) return true;
    return !this.canRecordSpare(this.currentFrameIndex, this.currentThrowIndex);
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

  private async focusNextInput(frameIndex: number, throwIndex: number) {
    await new Promise((resolve) => setTimeout(resolve, 50));
    const inputArray = this.inputs.toArray();
    const currentInputPosition = frameIndex * 2 + throwIndex;

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
