import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class ThemeChangerService {
  private readonly defaultTheme = 'Green';
  #currentColor = signal<string>(this.getCurrentTheme());
  get currentColor() {
    return this.#currentColor;
  }

  saveColorTheme(theme: string): void {
    const previousTheme = this.getCurrentTheme().toLowerCase(); // Get the current theme before saving new one
    localStorage.setItem('theme', theme);
    this.applyTheme(theme, previousTheme);
  }

  applyTheme(newTheme: string, previousTheme?: string): void {
    const currentTheme = newTheme.toLowerCase();

    if (previousTheme) {
      // Clear the previous theme class on <html> and <body>
      this.clearExistingThemes(previousTheme);
    }

    // Apply the new theme class
    document.documentElement.classList.add(currentTheme);
    this.#currentColor.set(currentTheme);
  }

  getCurrentTheme(): string {
    return localStorage.getItem('theme') || this.defaultTheme;
  }

  private clearExistingThemes(previousTheme: string): void {
    // Remove previous theme class from <html> and <body>
    document.documentElement.classList.remove(previousTheme);
  }
}
