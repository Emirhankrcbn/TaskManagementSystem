// Görev listesi sayfasındaki filtre/sıralama/görünüm tercihlerini localStorage'da saklayan servis
import { Injectable } from '@angular/core';

export interface TaskViewPreferences {
  selectedPriority: number | null;
  selectedStatus: number | null;
  selectedCategoryId: string | null;
  searchTerm: string;
  sortBy: string | null;
  isDesc: boolean;
  viewMode: 'table' | 'board';
}

@Injectable({
  providedIn: 'root'
})
export class TaskPreferencesService {
  private readonly STORAGE_KEY = 'task_view_preferences';

  // Tercihleri kaydeder
  save(prefs: TaskViewPreferences): void {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(prefs));
  }

  // Daha önce kaydedilmiş tercihleri okur; hiç kaydedilmemişse veya bozuksa null döner
  load(): Partial<TaskViewPreferences> | null {
    const raw = localStorage.getItem(this.STORAGE_KEY);
    if (!raw) return null;

    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  }

  clear(): void {
    localStorage.removeItem(this.STORAGE_KEY);
  }
}
