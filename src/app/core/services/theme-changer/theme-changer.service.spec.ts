import { TestBed } from '@angular/core/testing';

import { ThemeChangerService } from './theme-changer.service';

describe('ThemeChangerService', () => {
  let service: ThemeChangerService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ThemeChangerService);
    
    // Clear localStorage and reset document classes before each test
    localStorage.clear();
    document.documentElement.className = '';
  });

  afterEach(() => {
    // Clean up after each test
    localStorage.clear();
    document.documentElement.className = '';
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('getCurrentTheme', () => {
    it('should return default theme when no theme is saved', () => {
      expect(service.getCurrentTheme()).toBe('Green');
    });

    it('should return saved theme from localStorage', () => {
      localStorage.setItem('theme', 'Blue');
      expect(service.getCurrentTheme()).toBe('Blue');
    });

    it('should return default theme for null localStorage value', () => {
      localStorage.setItem('theme', '');
      expect(service.getCurrentTheme()).toBe('Green');
    });
  });

  describe('saveColorTheme', () => {
    it('should save theme to localStorage', () => {
      service.saveColorTheme('Purple');
      expect(localStorage.getItem('theme')).toBe('Purple');
    });

    it('should apply the new theme class to document', () => {
      service.saveColorTheme('Purple');
      expect(document.documentElement.classList.contains('purple')).toBe(true);
    });

    it('should remove previous theme class when saving new theme', () => {
      // Set initial theme
      service.saveColorTheme('Blue');
      expect(document.documentElement.classList.contains('blue')).toBe(true);

      // Change to new theme
      service.saveColorTheme('Red');
      expect(document.documentElement.classList.contains('blue')).toBe(false);
      expect(document.documentElement.classList.contains('red')).toBe(true);
    });

    it('should handle theme names with different cases', () => {
      service.saveColorTheme('PURPLE');
      expect(document.documentElement.classList.contains('purple')).toBe(true);
      expect(localStorage.getItem('theme')).toBe('PURPLE');
    });
  });

  describe('applyTheme', () => {
    it('should apply theme class to document', () => {
      service.applyTheme('Orange');
      expect(document.documentElement.classList.contains('orange')).toBe(true);
    });

    it('should remove previous theme when provided', () => {
      document.documentElement.classList.add('blue');
      service.applyTheme('Red', 'blue');
      
      expect(document.documentElement.classList.contains('blue')).toBe(false);
      expect(document.documentElement.classList.contains('red')).toBe(true);
    });

    it('should not remove classes when no previous theme provided', () => {
      document.documentElement.classList.add('existing-class');
      service.applyTheme('Green');
      
      expect(document.documentElement.classList.contains('existing-class')).toBe(true);
      expect(document.documentElement.classList.contains('green')).toBe(true);
    });

    it('should handle uppercase theme names', () => {
      service.applyTheme('YELLOW');
      expect(document.documentElement.classList.contains('yellow')).toBe(true);
    });

    it('should handle mixed case previous theme names', () => {
      document.documentElement.classList.add('BlUe');
      service.applyTheme('Red', 'BlUe');
      
      expect(document.documentElement.classList.contains('BlUe')).toBe(false);
      expect(document.documentElement.classList.contains('red')).toBe(true);
    });
  });

  describe('integration tests', () => {
    it('should work with multiple theme changes', () => {
      service.saveColorTheme('Theme1');
      expect(service.getCurrentTheme()).toBe('Theme1');
      expect(document.documentElement.classList.contains('theme1')).toBe(true);

      service.saveColorTheme('Theme2');
      expect(service.getCurrentTheme()).toBe('Theme2');
      expect(document.documentElement.classList.contains('theme1')).toBe(false);
      expect(document.documentElement.classList.contains('theme2')).toBe(true);

      service.saveColorTheme('Theme3');
      expect(service.getCurrentTheme()).toBe('Theme3');
      expect(document.documentElement.classList.contains('theme2')).toBe(false);
      expect(document.documentElement.classList.contains('theme3')).toBe(true);
    });
  });
});
