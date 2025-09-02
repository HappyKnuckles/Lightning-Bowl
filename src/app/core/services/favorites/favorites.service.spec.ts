import { TestBed } from '@angular/core/testing';
import { FavoritesService } from './favorites.service';

describe('FavoritesService', () => {
  let service: FavoritesService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(FavoritesService);
    // Clear localStorage before each test
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should toggle favorite status', () => {
    const patternUrl = 'test-pattern-url';
    
    // Initially should not be favorite
    expect(service.isFavorite(patternUrl)).toBe(false);
    
    // Toggle to favorite
    const firstToggle = service.toggleFavorite(patternUrl);
    expect(firstToggle).toBe(true);
    expect(service.isFavorite(patternUrl)).toBe(true);
    
    // Toggle back to not favorite
    const secondToggle = service.toggleFavorite(patternUrl);
    expect(secondToggle).toBe(false);
    expect(service.isFavorite(patternUrl)).toBe(false);
  });

  it('should persist favorites in localStorage', () => {
    const patternUrl1 = 'pattern-1';
    const patternUrl2 = 'pattern-2';
    
    service.addFavorite(patternUrl1);
    service.addFavorite(patternUrl2);
    
    // Create new instance to test persistence
    const newService = new FavoritesService();
    
    expect(newService.isFavorite(patternUrl1)).toBe(true);
    expect(newService.isFavorite(patternUrl2)).toBe(true);
  });

  it('should handle invalid localStorage data gracefully', () => {
    localStorage.setItem('favoritePatterns', 'invalid-json');
    
    const newService = new FavoritesService();
    expect(newService.getFavoritePatternUrls()).toEqual([]);
  });
});