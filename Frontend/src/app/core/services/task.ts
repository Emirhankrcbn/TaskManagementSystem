import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Task, TaskAttachment, TaskStatistics } from '../models/task.model'; // Daha önce oluşturduğumuz model
import { HttpParams } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class TaskService {
  private http = inject(HttpClient);

  // Backend API adresi
  private baseUrl = 'http://localhost:5182';
  private apiUrl = `${this.baseUrl}/api/tasks`;

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

  // 5. DOSYA EKLEME (Attachment Yükleme)
  uploadAttachment(taskId: string, file: File): Observable<TaskAttachment> {
    const formData = new FormData();
    formData.append('File', file);
    return this.http.post<TaskAttachment>(`${this.apiUrl}/${taskId}/attachments`, formData);
  }

  // 5.1 Göreve ait dosyaları listeleme
  getAttachments(taskId: string): Observable<TaskAttachment[]> {
    return this.http.get<TaskAttachment[]>(`${this.apiUrl}/${taskId}/attachments`);
  }

  // 5.2 Dosya silme
  deleteAttachment(taskId: string, attachmentId: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${taskId}/attachments/${attachmentId}`);
  }

  // 5.3 Dosyanın indirilebileceği tam adresi üretir (backend statik dosya sunucusu üzerinden)
  getAttachmentUrl(filePath: string): string {
    return `${this.baseUrl}${filePath}`;
  }

  // 6. Görev istatistikleri (Dashboard için)
  getStatistics(): Observable<TaskStatistics> {
    return this.http.get<TaskStatistics>(`${this.apiUrl}/statistics`);
  }

  // 7. Süresi geçmiş görevler (Dashboard için)
  getOverdueTasks(): Observable<Task[]> {
    return this.http.get<Task[]>(`${this.apiUrl}/overdue`);
  }
}