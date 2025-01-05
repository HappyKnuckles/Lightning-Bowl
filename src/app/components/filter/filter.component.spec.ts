import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { FilterComponent } from './filter.component';
import { ModalController } from '@ionic/angular';
import { TimeRange } from 'src/app/models/filter.model';
import { FilterService } from 'src/app/services/filter/filter.service';
import { BehaviorSubject } from 'rxjs';

const mockFilters = {
  excludePractice: false,
  minScore: 0,
  maxScore: 300,
  isClean: false,
  isPerfect: false,
  league: ['all'],
  timeRange: TimeRange.ALL,
  startDate: '',
  endDate: '',
};

const FilterServiceMock = {
  filterGames: jasmine.createSpy('filterGames').and.returnValue([]),
  // Mock filters$ as a BehaviorSubject to allow subscriptions
  filters$: new BehaviorSubject(mockFilters),
};

describe('FilterComponent', () => {
  let component: FilterComponent;
  let fixture: ComponentFixture<FilterComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [FilterComponent], // Corrected here
      providers: [
        {
          provide: ModalController,
          useValue: {
            create: jasmine.createSpy('create').and.returnValue(Promise.resolve({ present: jasmine.createSpy('present') })),
          },
        },
        { provide: FilterService, useValue: FilterServiceMock }, // Mocked FilterService with filters$
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(FilterComponent);
    component = fixture.componentInstance;

    component.games = [];
    component.filteredGames = [];
    fixture.detectChanges();

    // Ensure filters are initialized by triggering the subscription manually
    FilterServiceMock.filters$.next(mockFilters);
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
