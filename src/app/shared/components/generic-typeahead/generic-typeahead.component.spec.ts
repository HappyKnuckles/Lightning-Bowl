import { ComponentFixture, TestBed } from '@angular/core/testing';
import { GenericTypeaheadComponent } from './generic-typeahead.component';
import { ModalController, IonSearchbar } from '@ionic/angular';
import { LoadingService } from 'src/app/core/services/loader/loading.service';

// Mock interfaces for testing
interface TestItem {
  id: number;
  name: string;
}

describe('GenericTypeaheadComponent', () => {
  let component: GenericTypeaheadComponent<TestItem>;
  let fixture: ComponentFixture<GenericTypeaheadComponent<TestItem>>;

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
    const mockSearchbar = { value: 'test search' } as IonSearchbar;
    component.searchbar = mockSearchbar;
    
    // Spy on searchItems method to verify it gets called
    spyOn(component, 'searchItems').and.callThrough();
    
    // Call resetSelection
    component.resetSelection();
    
    // Verify selectedItems is empty
    expect(component.selectedItems).toEqual([]);
    
    // Verify search bar is cleared
    expect(component.searchbar.value).toBe('');
    
    // Verify searchItems was called with empty search term
    expect(component.searchItems).toHaveBeenCalledWith(jasmine.objectContaining({
      detail: { value: '' }
    }));
    
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

  it('should properly reset when search pattern was active', () => {
    // Simulate a scenario where user had searched and selected items
    component.selectedItems = [testItems[0]];
    component.filteredItems.set([testItems[0]]); // Simulate filtered state from search
    
    // Mock searchbar with active search
    const mockSearchbar = { value: 'Item 1' } as IonSearchbar;
    component.searchbar = mockSearchbar;
    
    // Spy on searchItems
    spyOn(component, 'searchItems').and.callThrough();
    
    // Call resetSelection
    component.resetSelection();
    
    // Verify searchbar is cleared
    expect(mockSearchbar.value).toBe('');
    
    // Verify searchItems was called to reset the search
    expect(component.searchItems).toHaveBeenCalledWith(jasmine.objectContaining({
      detail: { value: '' }
    }));
    
    // Verify selectedItems is empty
    expect(component.selectedItems).toEqual([]);
    
    // Verify all items are restored
    expect(component.filteredItems()).toEqual(testItems);
  });
});