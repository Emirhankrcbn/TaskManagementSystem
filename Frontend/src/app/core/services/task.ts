import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Task } from '../models/task.model'; // Daha önce oluşturduğumuz model
import { HttpParams } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class TaskService {
  private http = inject(HttpClient);
  
  // Backend API adresi
  private apiUrl = 'http://localhost:5182/api/tasks';

  constructor() { }

  // 1. CREATE (Yeni Görev Ekleme)
  createTask(task: Task): Observable<Task> {
    return this.http.post<Task>(this.apiUrl, task);
  }

  // 2. READ (Tüm Görevleri Getirme) - opsiyonel filtre desteği
  getTasks(filter?: { priority?: number | null, categoryId?: string | null, searchTerm?: string | null, status?: number | null, sortBy?: string | null, isDescending?: boolean | null }): Observable<Task[]> {
    let params = new HttpParams();
    if (filter) {
      if (filter.priority != null) params = params.set('priority', filter.priority.toString());
      if (filter.categoryId) params = params.set('categoryId', filter.categoryId);
      if (filter.searchTerm) params = params.set('searchTerm', filter.searchTerm);
      if (filter.status != null) params = params.set('status', filter.status.toString());
      if (filter.sortBy) params = params.set('sortBy', filter.sortBy);
      if (filter.isDescending != null) params = params.set('isDescending', filter.isDescending ? 'true' : 'false');
    }
    return this.http.get<Task[]>(this.apiUrl, { params });
  }

  // 2.1 READ SİNGLE (Tek Bir Görevin Detayını Getirme)
  // Parametre string olarak güncellendi
  getTaskById(id: string): Observable<Task> {
    return this.http.get<Task>(`${this.apiUrl}/${id}`);
  }

  // 3. UPDATE (Görevi Güncelleme)
  // Parametre string olarak güncellendi
  updateTask(id: string, task: Task): Observable<Task> {
    return this.http.put<Task>(`${this.apiUrl}/${id}`, task);
  }

  // 4. DELETE (Görevi Silme)
  // Parametre string olarak güncellendi
  deleteTask(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}