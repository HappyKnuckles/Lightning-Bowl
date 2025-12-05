import { Component, OnInit, OnDestroy, QueryList, ViewChildren, ViewChild, CUSTOM_ELEMENTS_SCHEMA, input, output, computed } from '@angular/core';
import { Platform } from '@ionic/angular';
import { Subscription } from 'rxjs';
import { NgFor, NgIf } from '@angular/common';
import { IonGrid, IonModal, IonRow, IonCol, IonInput, IonItem, IonTextarea, IonCheckbox, IonList, IonLabel } from '@ionic/angular/standalone';
import { FormsModule } from '@angular/forms';
import { HapticService } from 'src/app/core/services/haptic/haptic.service';
import { ImpactStyle } from '@capacitor/haptics';
import { StorageService } from 'src/app/core/services/storage/storage.service';
import { LeagueSelectorComponent } from '../league-selector/league-selector.component';
import { InputCustomEvent } from '@ionic/angular';
import { UtilsService } from 'src/app/core/services/utils/utils.service';
import { Game, createEmptyGame, getThrowValue } from 'src/app/core/models/game.model';
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
import { GameScoreToolbarComponent } from '../game-score-toolbar/game-score-toolbar.component';

@Component({
  selector: 'app-game-grid',
  templateUrl: './game-grid.component.html',
  styleUrls: ['./game-grid.component.scss'],
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
  ballSelectorId = input<string>();
  showMetadata = input<boolean>(true);
  patternModalId = input.required<string>();
  game = input.required<Game>();
  maxScore = input<number>(300);
  strikeDisabled = input<boolean>(true);
  spareDisabled = input<boolean>(true);
  throwInput = output<{ frameIndex: number; throwIndex: number; value: string }>();
  leagueChanged = output<string>();
  isPracticeChanged = output<boolean>();
  patternChanged = output<string[]>();
  noteChanged = output<string>();
  ballsChanged = output<string[]>();
  toolbarStateChanged = output<{ show: boolean; offset: number }>();
  inputFocused = output<{ frameIndex: number; throwIndex: number }>();
  @ViewChildren(IonInput) inputs!: QueryList<IonInput>;
  @ViewChild('leagueSelector') leagueSelector!: LeagueSelectorComponent;
  @ViewChild('checkbox') checkbox!: IonCheckbox;
  frameScores = computed(() => this.game()?.frameScores ?? []);
  enterAnimation = alertEnterAnimation;
  leaveAnimation = alertLeaveAnimation;
  presentingElement?: HTMLElement;
  patternTypeaheadConfig!: TypeaheadConfig<Partial<Pattern>>;
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

  get currentGame(): Game {
    return this.game() || createEmptyGame();
  }

  constructor(
    public storageService: StorageService,
    private hapticService: HapticService,
    private utilsService: UtilsService,
    private platform: Platform,
    private patternService: PatternService,
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

  handleInputFocus(frameIndex: number, throwIndex: number): void {
    this.currentFrameIndex = frameIndex;
    this.currentThrowIndex = throwIndex;
    this.isFrameInputFocused = true;
    this.inputFocused.emit({ frameIndex, throwIndex });
  }

  onScoreInput(event: InputCustomEvent, frameIndex: number, throwIndex: number): void {
    const inputValue = event.detail.value ?? '';
    this.throwInput.emit({ frameIndex, throwIndex, value: inputValue });
  }

  selectSpecialScore(char: string): void {
    if (this.currentFrameIndex === null || this.currentThrowIndex === null) {
      this.showButtonToolbar = false;
      return;
    }
    this.throwInput.emit({
      frameIndex: this.currentFrameIndex,
      throwIndex: this.currentThrowIndex,
      value: char,
    });
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

  getFrameValue(frameIndex: number, throwIndex: number): string {
    const frame = this.game().frames[frameIndex];
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

  getLocalFrameValue(frameIndex: number, throwIndex: number): number | undefined {
    return getThrowValue(this.game().frames[frameIndex], throwIndex);
  }

  isNumber(value: unknown): boolean {
    return this.utilsService.isNumber(value);
  }

  focusNextInput(frameIndex: number, throwIndex: number): void {
    requestAnimationFrame(() => {
      const inputs = this.inputs.toArray();
      const startIndex = this.getInputPosition(frameIndex, throwIndex) + 1;

      const nextInput = inputs.slice(startIndex).find((input) => !input.disabled);
      nextInput?.setFocus();
    });
  }

  handleInvalidInput(frameIndex: number, throwIndex: number): void {
    this.hapticService.vibrate(ImpactStyle.Heavy);

    // Reset the input to display the current valid value from game state
    const inputArray = this.inputs.toArray();
    const inputPosition = this.getInputPosition(frameIndex, throwIndex);

    if (inputPosition >= 0 && inputPosition < inputArray.length) {
      const input = inputArray[inputPosition];
      // Reset to the valid value from the game state
      const validValue = this.getFrameValue(frameIndex, throwIndex);
      input.value = validValue;
    }
  }

  private getInputPosition(frameIndex: number, throwIndex: number): number {
    if (frameIndex < 9) {
      return frameIndex * 2 + throwIndex;
    } else {
      // 10th frame starts at position 18 (9 frames * 2 inputs)
      return 18 + throwIndex;
    }
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
}
