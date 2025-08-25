import {
  Component,
  OnInit,
  OnDestroy,
  EventEmitter,
  Output,
  QueryList,
  ViewChildren,
  ViewChild,
  CUSTOM_ELEMENTS_SCHEMA,
  input,
  output,
} from '@angular/core';
import { Platform } from '@ionic/angular';
import { Subscription } from 'rxjs';
import { ToastService } from 'src/app/core/services/toast/toast.service';
import { NgFor, NgIf, NgStyle } from '@angular/common';
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
import { Game } from 'src/app/core/models/game.model';
import { GenericTypeaheadComponent } from '../generic-typeahead/generic-typeahead.component';
import { createPartialPatternTypeaheadConfig } from '../generic-typeahead/typeahead-configs';
import { TypeaheadConfig } from '../generic-typeahead/typeahead-config.interface';
import { PatternService } from 'src/app/core/services/pattern/pattern.service';
import { Pattern } from 'src/app/core/models/pattern.model';
import { Keyboard } from '@capacitor/keyboard';

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
    LeagueSelectorComponent,
    IonModal,
    GenericTypeaheadComponent,
    NgStyle,
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class GameGridComponent implements OnInit, OnDestroy {
  @Output() maxScoreChanged = new EventEmitter<number>();
  @Output() totalScoreChanged = new EventEmitter<number>();
  @Output() leagueChanged = new EventEmitter<string>();
  @Output() isPracticeChanged = new EventEmitter<boolean>();
  patternChanged = output<string[]>();
  @ViewChildren(IonInput) inputs!: QueryList<IonInput>;
  @ViewChild('leagueSelector') leagueSelector!: LeagueSelectorComponent;
  @ViewChild('checkbox') checkbox!: IonCheckbox;
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
  maxScore = 300;
  presentingElement?: HTMLElement;
  patternTypeaheadConfig!: TypeaheadConfig<Partial<Pattern>>;

  // Keyboard toolbar
  showButtonToolbar = false;
  currentFrameIndex: number | null = null;
  currentRollIndex: number | null = null;
  keyboardOffset = 0;
  isLandScapeMode = false;

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
    private gameUtilsService: GameUtilsService,
    private utilsService: UtilsService,
    private platform: Platform,
    private patternService: PatternService,
  ) {
    this.initializeKeyboardListeners();
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
    this.patternTypeaheadConfig = createPartialPatternTypeaheadConfig(
      (searchTerm: string) => this.patternService.searchPattern(searchTerm)
    );
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
        this.showButtonToolbar = true;
      });

      Keyboard.addListener('keyboardWillHide', () => {
        this.keyboardOffset = 0;
        this.showButtonToolbar = false;
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

    setTimeout(() => {
      this.showButtonToolbar = true;
    }, 100);
  }

  handleInputBlur() {
    this.showButtonToolbar = false;
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
    const parsedValue = this.gameUtilsService.parseInputValue(inputValue, frameIndex, inputIndex, this.game().frames);

    if (inputValue.length === 0) {
      this.game().frames[frameIndex].splice(inputIndex, 1);
      this.updateScores();
      return;
    }
    if (!this.isValidNumber0to10(parsedValue)) {
      this.handleInvalidInput(event);
      return;
    }
    if (!this.gameUtilsService.isValidFrameScore(parsedValue, frameIndex, inputIndex, this.game().frames)) {
      this.handleInvalidInput(event);
      return;
    }

    this.game().frames[frameIndex][inputIndex] = parsedValue;
    this.updateScores();
    this.focusNextInput(frameIndex, inputIndex);
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

  async saveGameToLocalStorage(isSeries: boolean, seriesId: string): Promise<void> {
    try {
      if (this.game().league === 'New') {
        this.toastService.showToast(ToastMessages.selectLeague, 'bug', true);
        return;
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
    } catch (error) {
      console.error('Error saving game to local storage:', error);
    }
  }

  isGameValid(): boolean {
    return this.gameUtilsService.isGameValid(undefined, this.game().frames);
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

  private isValidNumber0to10(value: number): boolean {
    return !isNaN(value) && value >= 0 && value <= 10;
  }

  private handleInvalidInput(event: InputCustomEvent): void {
    this.hapticService.vibrate(ImpactStyle.Heavy);
    event.target.value = '';
  }

  private onViewportResize = () => {
    // This method is now primarily a fallback.
    if (!window.visualViewport) return;

    const viewportHeight = window.visualViewport.height;
    const fullHeight = window.innerHeight;
    const keyboardActualHeight = fullHeight - viewportHeight;

    if (keyboardActualHeight > 100) {
      this.keyboardOffset = this.isLandScapeMode ? Math.max(0, keyboardActualHeight - 72) : Math.max(0, keyboardActualHeight - 85);
    } else {
      {
        this.keyboardOffset = 0;
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

  getPatternDisplayNames(): string {
    if (!this.game().patterns || this.game().patterns.length === 0) {
      return 'None';
    }
    
    const patternTitles = this.game().patterns.map(patternUrl => {
      const pattern = this.storageService.allPatterns().find((p: Partial<Pattern>) => p.url === patternUrl);
      return pattern?.title || patternUrl;
    });
    
    return patternTitles.join(', ');
  }
}
