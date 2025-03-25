import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GameFilterActiveComponent } from './game-filter-active.component';

describe('GameFilterActiveComponent', () => {
  let component: GameFilterActiveComponent;
  let fixture: ComponentFixture<GameFilterActiveComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GameFilterActiveComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(GameFilterActiveComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
