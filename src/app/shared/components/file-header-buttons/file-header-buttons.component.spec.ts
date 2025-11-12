import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FileHeaderButtonsComponent } from './file-header-buttons.component';

describe('FileHeaderButtonsComponent', () => {
  let component: FileHeaderButtonsComponent;
  let fixture: ComponentFixture<FileHeaderButtonsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FileHeaderButtonsComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(FileHeaderButtonsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
