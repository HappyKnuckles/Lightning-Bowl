import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AlleymapComponent } from './alleymap.component';

describe('AlleymapComponent', () => {
  let component: AlleymapComponent;
  let fixture: ComponentFixture<AlleymapComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AlleymapComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(AlleymapComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
