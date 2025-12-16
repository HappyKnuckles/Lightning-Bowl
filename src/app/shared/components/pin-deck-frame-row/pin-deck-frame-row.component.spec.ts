import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PinDeckFrameRowComponent } from './pin-deck-frame-row.component';

describe('PinDeckFrameRowComponent', () => {
  let component: PinDeckFrameRowComponent;
  let fixture: ComponentFixture<PinDeckFrameRowComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PinDeckFrameRowComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(PinDeckFrameRowComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
