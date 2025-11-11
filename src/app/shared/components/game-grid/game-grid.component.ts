import { Component, OnInit, OnDestroy, QueryList, ViewChildren, ViewChild, CUSTOM_ELEMENTS_SCHEMA, input, output } from '@angular/core';
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
import { alertEnterAnimation, alertLeaveAnimation } from '../../animations/alert.animation';
import { AnalyticsService } from 'src/app/core/services/analytics/analytics.service';
import { BowlingGameValidationService } from 'src/app/core/services/game-utils/bowling-game-validation.service';
import { BowlingFrameFormatterService } from 'src/app/core/services/game-utils/bowling-frame-formatter.service';
import { GameScoreToolbarComponent } from '../game-score-toolbar/game-score-toolbar.component';

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
  // Input signals
  ballSelectorId = input<string>();
  showMetadata = input<boolean>(true);
  patternId = input.required<string>();
  game = input<Game>({
    frames: [],
    totalScore: 0,
    note: '',
    balls: [],
    patterns: [],
    league: '',
    isPractice: true,
    gameId: '',
    date: 0,
    frameScores: [],
    isClean: false,
    isPerfect: false,
  });

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
  maxScore = 300;
  presentingElement?: HTMLElement;
  patternTypeaheadConfig!: TypeaheadConfig<Partial<Pattern>>;

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

  get isStrikeDisabled(): boolean {
    if (this.currentFrameIndex === null || this.currentRollIndex === null) {
      return true;
    }
    return !this.validationService.canRecordStrike(this.currentFrameIndex, this.currentRollIndex, this.game().frames);
  }

  get isSpareDisabled(): boolean {
    if (this.currentFrameIndex === null || this.currentRollIndex === null) {
      return true;
    }
    return !this.validationService.canRecordSpare(this.currentFrameIndex, this.currentRollIndex, this.game().frames);
  }

  constructor(
    private gameScoreCalculatorService: GameScoreCalculatorService,
    public storageService: StorageService,
    private transformGameService: GameDataTransformerService,
    private toastService: ToastService,
    private hapticService: HapticService,
    private formatterService: BowlingFrameFormatterService,
    private utilsService: UtilsService,
    private platform: Platform,
    private patternService: PatternService,
    private analyticsService: AnalyticsService,
    private validationService: BowlingGameValidationService,
  ) {
    this.initializeKeyboardListeners();
    addIcons({ chevronExpandOutline });
  }

  async ngOnInit(): Promise<void> {
    const currentGame = this.game();
    if (this.game().date != 0) {
      const newFrames: number[][] = [];
      for (let i = 0; i < 10; i++) {
        const frameData = currentGame.frames[i];

        if (frameData && Array.isArray(frameData.throws)) {
          newFrames.push(frameData.throws.map((t: any) => t.value));
        } else {
          newFrames.push([]);
        }
      }
      this.game().frames = newFrames;
    } else {
      this.game().frames = Array.from({ length: 10 }, () => []);
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

  onLeagueChanged(league: string): void {
    this.leagueChanged.emit(league);
  }

  onPatternChanged(patterns: string[]): void {
    if (patterns.length > 2) {
      patterns = patterns.slice(-2);
    }
    this.game().patterns = patterns;
    this.patternChanged.emit(patterns);
  }

  onBallSelect(selectedBalls: string[], modal: IonModal): void {
    modal.dismiss();
    this.game().balls = selectedBalls;
  }

  getSelectedBallsText(): string {
    const balls = this.game().balls || [];
    return balls.length > 0 ? balls.join(', ') : 'None';
  }

  getFrameValue(frameIndex: number, throwIndex: number): string {
    const frame = this.game().frames[frameIndex];
    const val = frame[throwIndex];

    if (val === undefined || val === null) {
      return '';
    }

    const firstBall = frame[0];
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

    const secondBall = frame[1];

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

  emitToolbarDisabledState() {
    this.toolbarDisabledState.emit({
      strikeDisabled: this.isStrikeButtonDisabled(),
      spareDisabled: this.isSpareButtonDisabled(),
    });
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

  simulateScore(event: InputCustomEvent, frameIndex: number, inputIndex: number): void {
    const inputValue = event.detail.value!;
    const parsedValue = this.formatterService.parseInputValue(inputValue, frameIndex, inputIndex, this.game().frames);

    if (inputValue.length === 0) {
      this.game().frames[frameIndex].splice(inputIndex, 1);
      this.updateScores();
      return;
    }
    if (!this.validationService.isValidNumber0to10(parsedValue)) {
      this.handleInvalidInput(event);
      return;
    }
    if (!this.validationService.isValidFrameScore(parsedValue, frameIndex, inputIndex, this.game().frames)) {
      this.handleInvalidInput(event);
      return;
    }

    this.game().frames[frameIndex][inputIndex] = parsedValue;
    this.updateScores();
    this.focusNextInput(frameIndex, inputIndex);
    this.emitToolbarDisabledState();
  }

  clearFrames(isSave: boolean): void {
    this.game().frames = Array.from({ length: 10 }, () => []);
    this.game().frameScores = [];
    this.game().totalScore = 0;
    this.maxScore = 300;

    this.inputs.forEach((input) => {
      input.value = '';
    });

    if (isSave) {
      this.game().note = '';
      this.game().league = '';
      this.leagueSelector.selectedLeague = '';
      this.game().patterns = [];
      this.game().isPractice = true;
      this.game().balls = [];
    }

    this.updateScores();
    this.totalScoreChanged.emit(this.game().totalScore);
    this.maxScoreChanged.emit(this.maxScore);
  }

  updateScores(): void {
    const scoreResult = this.gameScoreCalculatorService.calculateScore(this.game().frames);
    this.game().totalScore = scoreResult.totalScore;
    this.game().frameScores = scoreResult.frameScores;

    this.maxScore = this.gameScoreCalculatorService.calculateMaxScore(this.game().frames, this.game().totalScore);
    this.totalScoreChanged.emit(this.game().totalScore);
    this.maxScoreChanged.emit(this.maxScore);
  }

  async saveGameToLocalStorage(isSeries: boolean, seriesId: string): Promise<Game | null> {
    try {
      if (this.game().league === 'New') {
        this.toastService.showToast(ToastMessages.selectLeague, 'bug', true);
        return null;
      }
      const gameData = this.transformGameService.transformGameData(
        this.game().frames,
        this.game().frameScores,
        this.game().totalScore,
        this.game().isPractice,
        this.game().league,
        isSeries,
        seriesId,
        this.game().note,
        this.game().patterns,
        this.game().balls,
        this.game().gameId,
        this.game().date,
      );
      this.game().frames = gameData.frames;
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
    return this.validationService.isGameValid(undefined, this.game().frames);
  }

  isNumber(value: unknown): boolean {
    return this.utilsService.isNumber(value);
  }

  isStrikeButtonDisabled(): boolean {
    if (this.currentFrameIndex === null || this.currentRollIndex === null) return true;

    const frameIndex = this.currentFrameIndex;
    const rollIndex = this.currentRollIndex;

    if (frameIndex < 9) {
      return rollIndex !== 0;
    }

    const frame = this.game().frames[9];
    const first = frame[0];
    const second = frame[1];

    switch (rollIndex) {
      case 0:
        return false; // Always allowed on first
      case 1:
        return first !== 10; // Only allowed if first was strike
      case 2:
        // Allow if:
        // - first and second are both strikes
        // - OR first + second == 10 (i.e. spare), but neither is 10
        // - OR second is 10 (i.e. second strike after first miss)
        return !((first === 10 && second === 10) || (first + second === 10 && first !== 10 && second !== 10) || (first !== 10 && second === 10));
      default:
        return true;
    }
  }

  isSpareButtonDisabled(): boolean {
    if (this.currentFrameIndex === null || this.currentRollIndex === null) return true;

    const frameIndex = this.currentFrameIndex;
    const rollIndex = this.currentRollIndex;

    if (frameIndex < 9) {
      return rollIndex !== 1;
    }

    const frame = this.game().frames[9];
    const first = frame[0];
    const second = frame[1];

    switch (rollIndex) {
      case 0:
        return true; // Never allowed on first
      case 1:
        return first === 10; // Not allowed if first was strike
      case 2:
        // Disable if:
        // 1. First two balls were strikes (e.g., X, X, then this throw)
        // 2. First two balls formed a spare (e.g., 5, /, then this throw)
        return (first === 10 && second === 10) || (first !== 10 && first + second === 10);
      default:
        return true;
    }
  }

  private handleInvalidInput(event: InputCustomEvent): void {
    this.hapticService.vibrate(ImpactStyle.Heavy);
    event.target.value = '';
  }

  private onViewportResize = () => {
    // Fallback for web/PWA keyboard detection using visualViewport
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
