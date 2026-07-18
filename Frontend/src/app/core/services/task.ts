import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Task } from '../models/task.model'; // Daha önce oluşturduğumuz model

@Injectable({
  providedIn: 'root'
})
export class TaskService {
  private http = inject(HttpClient);
  
  // Backend API adresimiz (İleride environment dosyasına taşıyacağız)
  private apiUrl = 'http://localhost:3000/api/tasks'; 

  constructor() { }

  // 1. CREATE (Yeni Görev Ekleme)
  createTask(task: Task): Observable<Task> {
    return this.http.post<Task>(this.apiUrl, task);
  }

  // 2. READ (Tüm Görevleri Getirme)
  getTasks(): Observable<Task[]> {
    return this.http.get<Task[]>(this.apiUrl);
  }

  // 2.1 READ SİNGLE (Tek Bir Görevin Detayını Getirme)
  getTaskById(id: number): Observable<Task> {
    return this.http.get<Task>(`${this.apiUrl}/${id}`);
  }

  // 3. UPDATE (Görevi Güncelleme)
  updateTask(id: number, task: Task): Observable<Task> {
    return this.http.put<Task>(`${this.apiUrl}/${id}`, task);
  }

  // 4. DELETE (Görevi Silme)
  deleteTask(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}