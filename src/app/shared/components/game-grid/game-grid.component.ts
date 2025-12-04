import { Component, OnInit, OnDestroy, QueryList, ViewChildren, ViewChild, CUSTOM_ELEMENTS_SCHEMA, input, output, computed } from '@angular/core';
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
 * It receives game data via input signals and emits all changes via output events.
 * The parent component (AddGamePage or GameComponent) owns the game state and handles persistence.
 *
 * IMPORTANT: The parent owns the Game state. This component only displays and emits changes.
 * All frame data is derived from the input game signal using computed().
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
export class GameGridComponent implements OnInit, OnDestroy {
  // Input signals - game state owned by parent
  ballSelectorId = input<string>();
  showMetadata = input<boolean>(true);
  patternModalId = input.required<string>();
  game = input<Game>(createEmptyGame());

  // Computed values derived from input game - NO local state copy
  frames = computed(() => this.game()?.frames ?? createEmptyFrames());
  frameScores = computed(() => this.game()?.frameScores ?? []);
  totalScore = computed(() => this.game()?.totalScore ?? 0);

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
  presentingElement?: HTMLElement;
  patternTypeaheadConfig!: TypeaheadConfig<Partial<Pattern>>;

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

  /**
   * Calculate max score from current frames
   */
  maxScore = computed(() => {
    const currentFrames = this.frames();
    const currentTotal = this.totalScore();
    return this.gameScoreCalculatorService.calculateMaxScoreFromFrames(currentFrames, currentTotal);
  });

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

  async ngOnInit(): Promise<void> {
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
   * Reads directly from computed frames - derived from parent's game state
   */
  getFrameValue(frameIndex: number, throwIndex: number): string {
    const frame = this.frames()[frameIndex];
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
   * Get frame score for display - derived from parent's game state
   */
  getFrameScore(frameIndex: number): number | undefined {
    return this.frameScores()[frameIndex];
  }

  /**
   * Get total score for display - derived from parent's game state
   */
  getTotalScore(): number {
    return this.totalScore();
  }

  /**
   * Get frames for template iteration - derived from parent's game state
   */
  getLocalFrames(): Frame[] {
    return this.frames();
  }

  /**
   * Safely get a throw value from frames
   * Used by template for disabled state checks and score display
   */
  getLocalFrameValue(frameIndex: number, throwIndex: number): number | undefined {
    return getThrowValue(this.frames()[frameIndex], throwIndex);
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
   * Handle score input - creates updated game and emits to parent
   * Parent owns the state, we just calculate and emit the new state
   */
  simulateScore(event: InputCustomEvent, frameIndex: number, throwIndex: number): void {
    const inputValue = event.detail.value!;
    const currentFrames = this.frames();
    const parsedValue = this.parseInputValue(inputValue, frameIndex, throwIndex, currentFrames);

    if (inputValue.length === 0) {
      // Remove the throw from the frame and emit updated game
      const newFrames = this.removeThrow(cloneFrames(currentFrames), frameIndex, throwIndex);
      this.emitUpdatedGame(newFrames);
      return;
    }

    if (!this.isValidNumber0to10(parsedValue)) {
      this.handleInvalidInput(event);
      return;
    }

    if (!this.isValidFrameScore(parsedValue, frameIndex, throwIndex, currentFrames)) {
      this.handleInvalidInput(event);
      return;
    }

    // Record the throw and emit updated game to parent
    const newFrames = this.recordThrow(cloneFrames(currentFrames), frameIndex, throwIndex, parsedValue);
    this.emitUpdatedGame(newFrames);
    this.focusNextInput(frameIndex, throwIndex);
    this.emitToolbarDisabledState();
  }

  /**
   * Record a throw in a frame - returns new frames array (immutable)
   */
  private recordThrow(frames: Frame[], frameIndex: number, throwIndex: number, value: number): Frame[] {
    const frame = frames[frameIndex];
    if (!frame) return frames;

    // Ensure throws array has enough elements
    while (frame.throws.length <= throwIndex) {
      frame.throws.push(createThrow(0, frame.throws.length + 1));
    }

    // Update the throw
    frame.throws[throwIndex] = createThrow(value, throwIndex + 1);
    return frames;
  }

  /**
   * Remove a throw from a frame - returns new frames array (immutable)
   */
  private removeThrow(frames: Frame[], frameIndex: number, throwIndex: number): Frame[] {
    const frame = frames[frameIndex];
    if (!frame || !frame.throws) return frames;

    if (throwIndex >= 0 && throwIndex < frame.throws.length) {
      frame.throws.splice(throwIndex, 1);
      // Re-index remaining throws
      frame.throws.forEach((t, idx) => {
        t.throwIndex = idx + 1;
      });
    }
    return frames;
  }

  /**
   * Calculate scores and emit updated game to parent
   */
  private emitUpdatedGame(newFrames: Frame[]): void {
    const scoreResult = this.gameScoreCalculatorService.calculateScoreFromFrames(newFrames);
    const newMaxScore = this.gameScoreCalculatorService.calculateMaxScoreFromFrames(newFrames, scoreResult.totalScore);

    const currentGame = this.game();
    const updatedGame: Game = {
      ...currentGame,
      frames: newFrames,
      frameScores: scoreResult.frameScores,
      totalScore: scoreResult.totalScore,
    };

    // Emit to parent - parent will update its state
    this.gameChanged.emit(updatedGame);
    this.totalScoreChanged.emit(scoreResult.totalScore);
    this.maxScoreChanged.emit(newMaxScore);
  }

  /**
   * Parse input value (handles X, /, and numeric values)
   */
  private parseInputValue(input: string, frameIndex: number, throwIndex: number, frames: Frame[]): number {
    const upperInput = input.toUpperCase();

    if (upperInput === 'X') {
      return 10;
    }

    if (upperInput === '/') {
      const firstThrow = getThrowValue(frames[frameIndex], 0);
      if (firstThrow !== undefined && throwIndex > 0) {
        // For 10th frame, handle the spare calculation based on the previous throw in that specific context
        if (frameIndex === 9 && throwIndex === 2) {
          const secondThrow = getThrowValue(frames[frameIndex], 1);
          if (getThrowValue(frames[frameIndex], 0) === 10 && secondThrow !== undefined) {
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
  private isValidFrameScore(inputValue: number, frameIndex: number, throwIndex: number, frames: Frame[]): boolean {
    const frame = frames[frameIndex];

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

    const frame = this.frames()[9];
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

    const currentFrames = this.frames();

    if (frameIndex < 9) {
      const first = getThrowValue(currentFrames[frameIndex], 0);
      return first !== undefined && first !== 10;
    } else {
      const first = getThrowValue(currentFrames[9], 0);
      const second = getThrowValue(currentFrames[9], 1);

      if (throwIndex === 1) return first !== undefined && first !== 10;
      if (throwIndex === 2) {
        if (first === 10 && second !== undefined && second !== 10) return true;
        return false;
      }
      return false;
    }
  }

  /**
   * Clear frames - emits cleared state to parent
   */
  clearFrames(clearMetadata: boolean): void {
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
   * Request parent to save the game
   */
  requestSave(isSeries: boolean, seriesId: string): void {
    this.saveRequested.emit({ isSeries, seriesId });
  }

  /**
   * Get the current game state for parent to use when saving
   * Returns current state from parent's game
   */
  getCurrentGameState(): { frames: Frame[]; frameScores: number[]; totalScore: number } {
    return {
      frames: cloneFrames(this.frames()),
      frameScores: [...this.frameScores()],
      totalScore: this.totalScore(),
    };
  }

  /**
   * Validate if the game is complete and valid
   */
  isGameValid(): boolean {
    return this.validationService.isGameValidFromFrames(this.frames());
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
