import { Injectable, signal, Signal } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class FavoritesService {
  private _favoritePatterns = signal<Set<string>>(new Set());
  readonly favoritePatterns: Signal<Set<string>> = this._favoritePatterns;

  constructor() {
    this.loadFavoritesFromStorage();
  }

  private loadFavoritesFromStorage(): void {
    if (typeof localStorage !== 'undefined') {
      const savedFavorites = localStorage.getItem('favoritePatterns');
      if (savedFavorites) {
        try {
          const favoritesArray: string[] = JSON.parse(savedFavorites);
          this._favoritePatterns.set(new Set(favoritesArray));
        } catch (error) {
          console.warn('Failed to parse saved favorite patterns:', error);
          this._favoritePatterns.set(new Set());
        }
      }
    }
  }

  private saveFavoritesToStorage(): void {
    if (typeof localStorage !== 'undefined') {
      const favoritesArray = Array.from(this._favoritePatterns());
      localStorage.setItem('favoritePatterns', JSON.stringify(favoritesArray));
    }
  }

  isFavorite(patternUrl: string): boolean {
    return this._favoritePatterns().has(patternUrl);
  }

  toggleFavorite(patternUrl: string): boolean {
    const currentFavorites = new Set(this._favoritePatterns());
    let isFavorited: boolean;

    if (currentFavorites.has(patternUrl)) {
      currentFavorites.delete(patternUrl);
      isFavorited = false;
    } else {
      currentFavorites.add(patternUrl);
      isFavorited = true;
    }

    this._favoritePatterns.set(currentFavorites);
    this.saveFavoritesToStorage();
    
    return isFavorited;
  }

  addFavorite(patternUrl: string): void {
    const currentFavorites = new Set(this._favoritePatterns());
    currentFavorites.add(patternUrl);
    this._favoritePatterns.set(currentFavorites);
    this.saveFavoritesToStorage();
  }

  removeFavorite(patternUrl: string): void {
    const currentFavorites = new Set(this._favoritePatterns());
    currentFavorites.delete(patternUrl);
    this._favoritePatterns.set(currentFavorites);
    this.saveFavoritesToStorage();
  }

  getFavoritePatternUrls(): string[] {
    return Array.from(this._favoritePatterns());
  }
}