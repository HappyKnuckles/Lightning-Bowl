import { ComponentFixture, TestBed } from '@angular/core/testing';
import { BallsPage } from './balls.page';

describe('BallsPage', () => {
  let component: BallsPage;
  let fixture: ComponentFixture<BallsPage>;

  beforeEach(() => {
    fixture = TestBed.createComponent(BallsPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
