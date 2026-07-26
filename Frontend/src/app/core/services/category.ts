import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, shareReplay, tap } from 'rxjs';
import { Category } from '../models/category.model'; // Modelin yolunun doğru olduğundan emin ol

@Injectable({
  providedIn: 'root'
})
export class CategoryService {
  private http = inject(HttpClient);

  // Backend API adresimiz
  private apiUrl = 'http://localhost:5182/api/categories';

  // Kategoriler nadiren değiştiği için ilk çekildiğinde bellekte tutulur;
  // her sayfa ziyaretinde (Tasks, Categories) aynı isteği tekrar atmayı önler
  private categoriesCache$: Observable<Category[]> | null = null;

  constructor() { }

  // Tüm kategorileri getirme (önbellekten, yoksa sunucudan çekip önbelleğe alarak)
  getCategories(): Observable<Category[]> {
    if (!this.categoriesCache$) {
      this.categoriesCache$ = this.http.get<Category[]>(this.apiUrl).pipe(
        shareReplay(1)
      );
    }
    return this.categoriesCache$;
  }

  // Yeni kategori ekleme
  createCategory(category: Category): Observable<Category> {
    return this.http.post<Category>(this.apiUrl, category).pipe(
      tap(() => this.invalidateCache())
    );
  }

  // Kategori silme
  deleteCategory(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`).pipe(
      tap(() => this.invalidateCache())
    );
  }

  // Liste değiştiren her işlemden sonra önbelleği temizler; bir sonraki getCategories() çağrısı sunucudan taze veri çeker
  private invalidateCache(): void {
    this.categoriesCache$ = null;
  }
}