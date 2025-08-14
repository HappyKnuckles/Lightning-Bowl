import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SortHeaderComponent } from './sort-header.component';
import { PatternSortField, SortDirection } from '../../../core/models/sort.model';

describe('SortHeaderComponent', () => {
  let component: SortHeaderComponent;
  let fixture: ComponentFixture<SortHeaderComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SortHeaderComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(SortHeaderComponent);
    component = fixture.componentInstance;
    
    // Set up required model inputs
    component.sortOptions.set([
      { field: PatternSortField.TITLE, direction: SortDirection.ASC, label: 'Title (A-Z)' },
      { field: PatternSortField.VOLUME, direction: SortDirection.DESC, label: 'Volume (High to Low)' }
    ]);
    component.selectedSort.set({ field: PatternSortField.TITLE, direction: SortDirection.ASC, label: 'Title (A-Z)' });
    component.id.set('test-sort-header');
    
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize selectedSortKey correctly', () => {
    expect(component.selectedSortKey).toBe('title_asc');
  });

  it('should have onPopoverWillPresent method', () => {
    expect(typeof component.onPopoverWillPresent).toBe('function');
  });

  it('should generate correct sort key', () => {
    const option = { field: PatternSortField.VOLUME, direction: SortDirection.DESC, label: 'Volume (High to Low)' };
    const sortKey = component.getSortKey(option);
    expect(sortKey).toBe('volume_desc');
  });
});