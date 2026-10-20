import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AlertController, IonModal } from '@ionic/angular/standalone';
import { BallsStore } from 'src/app/core/stores/balls.store';
import { PatternsStore } from 'src/app/core/stores/patterns.store';
import { SettingsStore } from 'src/app/core/stores/settings.store';
import { GameComponent } from './game.component';
import { makeFrame, makeFrames, makeGame, makeThrow } from 'src/testing/fixtures';
import { vi } from 'vitest';

const mockSettingsStore = {
  pinInputMode: vi.fn().mockReturnValue(true),
  ballTracking: vi.fn().mockReturnValue('game'),
};

const mockPatternsStore = {
  allPatterns: vi.fn().mockReturnValue([]),
};

const mockBallsStore = {
  allBalls: vi.fn().mockReturnValue([]),
  arsenal: vi.fn().mockReturnValue([]),
};

describe('GameComponent', () => {
  let component: GameComponent;
  let fixture: ComponentFixture<GameComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GameComponent],
      providers: [
        { provide: SettingsStore, useValue: mockSettingsStore },
        { provide: PatternsStore, useValue: mockPatternsStore },
        { provide: BallsStore, useValue: mockBallsStore },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(GameComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('game', makeGame());
    fixture.componentRef.setInput('patternModalId', 'test-pattern-modal');
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('game-level ball selection', () => {
    const modal = { dismiss: vi.fn() } as unknown as IonModal;

    const answerPrompt = (role: 'confirm' | 'cancel') => {
      const alert = { present: vi.fn().mockResolvedValue(undefined), onDidDismiss: vi.fn().mockResolvedValue({ role }) };
      return vi.spyOn(TestBed.inject(AlertController), 'create').mockResolvedValue(alert as never);
    };

    const setThrowTrackedGame = () => {
      const frames = [makeFrame(0, [makeThrow(0, [], { ball: { name: 'Phaze II' } })]), ...makeFrames().slice(1)];
      fixture.componentRef.setInput('game', makeGame({ frames, ballTracking: 'throw' }));
    };

    it('emits straight away when no throw carries a ball', async () => {
      const create = answerPrompt('cancel');
      const emitted = vi.fn();
      component.ballsChanged.subscribe(emitted);

      await component.onBallSelect(['Hammer15'], modal);

      expect(create).not.toHaveBeenCalled();
      expect(emitted).toHaveBeenCalledWith(['Hammer15']);
    });

    it('emits only once replacing the per-throw balls is confirmed', async () => {
      setThrowTrackedGame();
      const emitted = vi.fn();
      component.ballsChanged.subscribe(emitted);

      answerPrompt('cancel');
      await component.onBallSelect(['Hammer15'], modal);
      expect(emitted).not.toHaveBeenCalled();

      answerPrompt('confirm');
      await component.onBallSelect(['Hammer15'], modal);
      expect(emitted).toHaveBeenCalledWith(['Hammer15']);
    });
  });
});
