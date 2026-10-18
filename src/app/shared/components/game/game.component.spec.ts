import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AccordionGroupCustomEvent } from '@ionic/angular';
import { BallsStore } from 'src/app/core/stores/balls.store';
import { PatternsStore } from 'src/app/core/stores/patterns.store';
import { SettingsStore } from 'src/app/core/stores/settings.store';
import { GameComponent } from './game.component';
import { makeGame } from 'src/testing/fixtures';
import { vi } from 'vitest';

const mockSettingsStore = {
  pinInputMode: vi.fn().mockReturnValue(true),
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

  describe('game details accordion', () => {
    const toggleEvent = (value: string | undefined, fromNestedControl = false): AccordionGroupCustomEvent => {
      const group = document.createElement('ion-accordion-group');
      const target = fromNestedControl ? document.createElement('ion-checkbox') : group;
      return { detail: { value }, target, currentTarget: group } as unknown as AccordionGroupCustomEvent;
    };

    it('follows detailsOpen', () => {
      expect(component.detailsAccordionValue()).toBeUndefined();

      fixture.componentRef.setInput('detailsOpen', true);

      expect(component.detailsAccordionValue()).toBe('details');
    });

    it('reports opening and closing back through detailsOpen', () => {
      component.onDetailsToggle(toggleEvent('details'));
      expect(component.detailsOpen()).toBe(true);

      component.onDetailsToggle(toggleEvent(undefined));
      expect(component.detailsOpen()).toBe(false);
    });

    it('ignores ionChange bubbling up from controls inside the accordion', () => {
      fixture.componentRef.setInput('detailsOpen', true);

      component.onDetailsToggle(toggleEvent(undefined, true));

      expect(component.detailsOpen()).toBe(true);
    });
  });
});
