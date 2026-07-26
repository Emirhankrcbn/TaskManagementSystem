import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpEvent, HttpParams, HttpRequest } from '@angular/common/http';
import { Observable, shareReplay, tap } from 'rxjs';
import { Task, TaskAttachment, TaskStatistics, PagedResult, SubTask, TaskComment } from '../models/task.model'; // Daha önce oluşturduğumuz model

@Injectable({
  providedIn: 'root'
})
export class TaskService {
  private http = inject(HttpClient);

  // Backend API adresi
  private baseUrl = 'http://localhost:5182';
  private apiUrl = `${this.baseUrl}/api/tasks`;

  // Dashboard istatistikleri/gecikme listesi, bir görev oluşturulup/güncellenip/silinene kadar değişmez;
  // bu yüzden önbelleğe alınır ve sadece bu üç işlemden sonra geçersiz kılınır
  private statisticsCache$: Observable<TaskStatistics> | null = null;
  private overdueCache$: Observable<Task[]> | null = null;

  constructor() { }

  // 1. CREATE (Yeni Görev Ekleme)
  createTask(task: Task): Observable<Task> {
    return this.http.post<Task>(this.apiUrl, task).pipe(
      tap(() => this.invalidateStatsCache())
    );
  }

  // 2. READ (Tüm Görevleri Getirme) - opsiyonel filtre + sayfalama desteği
  getTasks(filter?: {
    priority?: number | null, categoryId?: string | null, searchTerm?: string | null, status?: number | null,
    sortBy?: string | null, isDescending?: boolean | null, pageNumber?: number | null, pageSize?: number | null
  }): Observable<PagedResult<Task>> {
    let params = new HttpParams();
    if (filter) {
      if (filter.priority != null) params = params.set('priority', filter.priority.toString());
      if (filter.categoryId) params = params.set('categoryId', filter.categoryId);
      if (filter.searchTerm) params = params.set('searchTerm', filter.searchTerm);
      if (filter.status != null) params = params.set('status', filter.status.toString());
      if (filter.sortBy) params = params.set('sortBy', filter.sortBy);
      if (filter.isDescending != null) params = params.set('isDescending', filter.isDescending ? 'true' : 'false');
      if (filter.pageNumber != null) params = params.set('pageNumber', filter.pageNumber.toString());
      if (filter.pageSize != null) params = params.set('pageSize', filter.pageSize.toString());
    }
    return this.http.get<PagedResult<Task>>(this.apiUrl, { params });
  }

  // 2.1 READ SİNGLE (Tek Bir Görevin Detayını Getirme)
  // Parametre string olarak güncellendi
  getTaskById(id: string): Observable<Task> {
    return this.http.get<Task>(`${this.apiUrl}/${id}`);
  }

  // 3. UPDATE (Görevi Güncelleme)
  // Parametre string olarak güncellendi
  updateTask(id: string, task: Task): Observable<Task> {
    return this.http.put<Task>(`${this.apiUrl}/${id}`, task).pipe(
      tap(() => this.invalidateStatsCache())
    );
  }

  // 4. DELETE (Görevi Silme)
  // Parametre string olarak güncellendi
  deleteTask(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`).pipe(
      tap(() => this.invalidateStatsCache())
    );
  }

  // 5. DOSYA EKLEME (Attachment Yükleme) - gerçek yükleme ilerlemesini (%) izleyebilmek için HttpEvent akışı döner
  uploadAttachment(taskId: string, file: File): Observable<HttpEvent<TaskAttachment>> {
    const formData = new FormData();
    formData.append('File', file);
    const req = new HttpRequest('POST', `${this.apiUrl}/${taskId}/attachments`, formData, {
      reportProgress: true
    });
    return this.http.request<TaskAttachment>(req);
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

  // 6. Görev istatistikleri (Dashboard için) - önbellekten, yoksa sunucudan çekip önbelleğe alarak
  getStatistics(): Observable<TaskStatistics> {
    if (!this.statisticsCache$) {
      this.statisticsCache$ = this.http.get<TaskStatistics>(`${this.apiUrl}/statistics`).pipe(
        shareReplay(1)
      );
    }
    return this.statisticsCache$;
  }

  // 7. Süresi geçmiş görevler (Dashboard için) - önbellekten, yoksa sunucudan çekip önbelleğe alarak
  getOverdueTasks(): Observable<Task[]> {
    if (!this.overdueCache$) {
      this.overdueCache$ = this.http.get<Task[]>(`${this.apiUrl}/overdue`).pipe(
        shareReplay(1)
      );
    }
    return this.overdueCache$;
  }

  // Görev sayısını/durumunu etkileyen bir işlem (create/update/delete) sonrası çağrılır;
  // bir sonraki getStatistics()/getOverdueTasks() çağrısı sunucudan taze veri çeker
  private invalidateStatsCache(): void {
    this.statisticsCache$ = null;
    this.overdueCache$ = null;
  }

  // 8. ALT GÖREV (SUBTASK) İŞLEMLERİ
  addSubTask(taskId: string, title: string): Observable<SubTask> {
    return this.http.post<SubTask>(`${this.apiUrl}/${taskId}/subtasks`, { title });
  }

  updateSubTask(taskId: string, subTaskId: string, data: { title: string; completed: boolean }): Observable<SubTask> {
    return this.http.put<SubTask>(`${this.apiUrl}/${taskId}/subtasks/${subTaskId}`, data);
  }

  deleteSubTask(taskId: string, subTaskId: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${taskId}/subtasks/${subTaskId}`);
  }

  // 9. YORUM (COMMENT) İŞLEMLERİ
  getComments(taskId: string): Observable<TaskComment[]> {
    return this.http.get<TaskComment[]>(`${this.apiUrl}/${taskId}/comments`);
  }

  addComment(taskId: string, content: string): Observable<TaskComment> {
    return this.http.post<TaskComment>(`${this.apiUrl}/${taskId}/comments`, { content });
  }

  updateComment(taskId: string, commentId: string, content: string): Observable<TaskComment> {
    return this.http.put<TaskComment>(`${this.apiUrl}/${taskId}/comments/${commentId}`, { content });
  }

  deleteComment(taskId: string, commentId: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${taskId}/comments/${commentId}`);
  }
}