import { ComponentFixture, TestBed } from '@angular/core/testing';
import { GenericTypeaheadComponent } from './generic-typeahead.component';
import { ModalController } from '@ionic/angular';
import { LoadingService } from 'src/app/core/services/loader/loading.service';
import { signal } from '@angular/core';

// Mock interfaces for testing
interface TestItem {
  id: number;
  name: string;
}

describe('GenericTypeaheadComponent', () => {
  let component: GenericTypeaheadComponent<TestItem>;
  let fixture: ComponentFixture<GenericTypeaheadComponent<TestItem>>;
  let mockModalController: jasmine.SpyObj<ModalController>;
  let mockLoadingService: jasmine.SpyObj<LoadingService>;

  const testItems: TestItem[] = [
    { id: 1, name: 'Item 1' },
    { id: 2, name: 'Item 2' },
    { id: 3, name: 'Item 3' }
  ];

  const mockConfig = {
    title: 'Test Title',
    searchPlaceholder: 'Search...',
    identifierKey: 'id',
    displayFields: [{ key: 'name', isPrimary: true, isSecondary: false }],
    searchKeys: ['name'],
    searchMode: 'local' as const,
    loadingText: 'Loading...'
  };

  beforeEach(async () => {
    const modalControllerSpy = jasmine.createSpyObj('ModalController', ['dismiss']);
    const loadingServiceSpy = jasmine.createSpyObj('LoadingService', ['setLoading']);

    await TestBed.configureTestingModule({
      imports: [GenericTypeaheadComponent],
      providers: [
        { provide: ModalController, useValue: modalControllerSpy },
        { provide: LoadingService, useValue: loadingServiceSpy }
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(GenericTypeaheadComponent<TestItem>);
    component = fixture.componentInstance;
    mockModalController = TestBed.inject(ModalController) as jasmine.SpyObj<ModalController>;
    mockLoadingService = TestBed.inject(LoadingService) as jasmine.SpyObj<LoadingService>;

    // Set required inputs
    fixture.componentRef.setInput('items', testItems);
    fixture.componentRef.setInput('config', mockConfig);
    fixture.componentRef.setInput('prevSelectedItems', []);
    
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should reset selection and search bar properly', () => {
    // Select some items first
    component.selectedItems = [testItems[0], testItems[1]];
    
    // Simulate the reordering that would happen when items are selected
    component.filteredItems.set([testItems[0], testItems[1], testItems[2]]);
    
    // Mock the searchbar
    const mockSearchbar = { value: 'test search' } as any;
    component.searchbar = mockSearchbar;
    
    // Call resetSelection
    component.resetSelection();
    
    // Verify selectedItems is empty
    expect(component.selectedItems).toEqual([]);
    
    // Verify search bar is cleared
    expect(component.searchbar.value).toBe('');
    
    // Verify filteredItems is reset to original order
    expect(component.filteredItems()).toEqual(testItems);
    
    // Verify loadedCount is reset to batch size or items length
    expect(component.loadedCount()).toBe(Math.min(component['batchSize'], testItems.length));
  });

  it('should maintain filtered items in original order after reset', () => {
    // Select items to change the order
    component.selectedItems = [testItems[1], testItems[2]];
    component.filteredItems.set([testItems[1], testItems[2], testItems[0]]);
    
    // Reset selection
    component.resetSelection();
    
    // Verify items are back in original order
    expect(component.filteredItems()).toEqual([
      { id: 1, name: 'Item 1' },
      { id: 2, name: 'Item 2' },
      { id: 3, name: 'Item 3' }
    ]);
  });
});