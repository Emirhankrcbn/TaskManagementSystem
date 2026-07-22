import { Injectable, signal } from '@angular/core';

const THEME_STORAGE_KEY = 'theme_preference';

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  isDarkMode = signal<boolean>(localStorage.getItem(THEME_STORAGE_KEY) === 'dark');

  constructor() {
    this.applyTheme(this.isDarkMode());
  }

  toggleTheme(): void {
    const next = !this.isDarkMode();
    this.isDarkMode.set(next);
    localStorage.setItem(THEME_STORAGE_KEY, next ? 'dark' : 'light');
    this.applyTheme(next);
  }

  private applyTheme(isDark: boolean): void {
    document.body.classList.toggle('dark-theme', isDark);
  }
}
