import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core'; // ChangeDetectorRef eklendi
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { CategoryService } from '../../core/services/category';
import { Category } from '../../core/models/category.model';

@Component({
  selector: 'app-categories',
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './categories.html',
  styleUrl: './categories.scss',
})
export class CategoriesComponent implements OnInit {
  private fb = inject(FormBuilder);
  private categoryService = inject(CategoryService);
  private cdr = inject(ChangeDetectorRef); // Dedektifimiz eklendi

  categoryForm!: FormGroup;
  categories: Category[] = [];
  isLoading = false;
  isLoadingList = true;
  deletingId: string | null = null;

  ngOnInit(): void {
    this.categoryForm = this.fb.group({
      name: ['', Validators.required],
      description: [''],
      color: ['#007bff', Validators.required]
    });

    this.loadCategories();
  }

  loadCategories(): void {
    this.isLoadingList = true;
    this.categoryService.getCategories().subscribe({
      next: (data) => {
        this.categories = data;
        this.isLoadingList = false;
        this.cdr.detectChanges(); // Veri gelince ekranı yenile
      },
      error: (err) => {
        console.error('Kategoriler yüklenirken hata oluştu:', err);
        this.isLoadingList = false;
        this.cdr.detectChanges();
      }
    });
  }

  onSubmit(): void {
    if (this.categoryForm.invalid) return;

    this.isLoading = true;
    const newCategory: Category = this.categoryForm.value;

    this.categoryService.createCategory(newCategory).subscribe({
      next: (createdCategory) => {
        this.categories.push(createdCategory); 
        this.categoryForm.reset({ color: '#007bff' }); 
        this.isLoading = false;
        this.cdr.detectChanges(); // Başarılı olunca ekranı yenile
      },
      error: (err) => {
        console.error('Kategori eklenirken hata oluştu:', err);
        this.isLoading = false;
        this.cdr.detectChanges(); // Hata olsa bile ekranı yenile (Ekleniyor yazısı gitsin)
      }
    });
  }

  deleteCategory(id: string | undefined): void {
    if (!id || this.deletingId) return;

    this.deletingId = id;
    this.categoryService.deleteCategory(id).subscribe({
      next: () => {
        this.categories = this.categories.filter(c => c.id !== id);
        this.deletingId = null;
        this.cdr.detectChanges(); // Silince ekranı yenile
      },
      error: (err) => {
        console.error('Kategori silinirken hata oluştu:', err);
        this.deletingId = null;
        this.cdr.detectChanges();
      }
    });
  }
}