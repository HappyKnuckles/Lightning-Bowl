import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SpareNamesComponent } from './spare-names.component';

describe('SpareNamesComponent', () => {
  let component: SpareNamesComponent;
  let fixture: ComponentFixture<SpareNamesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SpareNamesComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(SpareNamesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
