import { ComponentFixture, TestBed } from '@angular/core/testing';
import { GenericTypeaheadComponent } from './generic-typeahead.component';

describe('GenericTypeaheadComponent', () => {
  let component: GenericTypeaheadComponent<any>;
  let fixture: ComponentFixture<GenericTypeaheadComponent<any>>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GenericTypeaheadComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(GenericTypeaheadComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
