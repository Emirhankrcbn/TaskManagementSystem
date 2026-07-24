import { Component, OnInit, TemplateRef, ViewChild, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MaterialModule } from '../../shared/material.module';
import { CategoryService } from '../../core/services/category'; // Kategori Servisi Eklendi
import { Category } from '../../core/models/category.model'; // Kategori Modeli Eklendi
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { FormsModule } from '@angular/forms';
import { SelectionModel } from '@angular/cdk/collections';
import { Task } from '../../core/models/task.model';
import { TaskService } from '../../core/services/task'; // Kendi dosya yoluna göre ayarla
import { TaskList } from './task-list/task-list';
import { TaskForm, TaskFormValue } from './task-form/task-form';
import { TaskDetail } from './task-detail/task-detail';
import { NotificationService } from '../../core/services/notification';
import { Pagination } from '../../shared/pagination/pagination';

@Component({
  selector: 'app-tasks',
  imports: [
    CommonModule,
    FormsModule,
    MaterialModule,
    TaskList,
    TaskForm,
    TaskDetail,
    Pagination
  ],
  templateUrl: './tasks.html',
  styleUrl: './tasks.scss'
})
export class Tasks implements OnInit {
  selection = new SelectionModel<Task>(true, []);
  @ViewChild(TaskList) taskListComponent!: TaskList;
  @ViewChild('createForm') createFormComponent!: TaskForm;
  @ViewChild('bulkDeleteDialog') bulkDeleteDialog!: TemplateRef<any>;

  dataSource: Task[] = [];
  selectedPriority: number | null = null; // filtre için seçilen öncelik
  selectedStatus: number | null = null; // filtre için seçilen durum
  selectedCategoryId: string | null = null; // filtre için seçilen kategori
  searchTerm: string = ''; // başlık/açıklama içinde arama
  private searchDebounceTimer: any = null;
  sortBy: string | null = null;
  isDesc: boolean = false;

  // --- SAYFALAMA ---
  currentPage: number = 1;
  pageSize: number = 10;
  totalCount: number = 0;
  totalPages: number = 1;

  // Düzenleme diyaloğundaki TaskForm'un güncel değeri (kaydet anında okunur)
  editFormValue: TaskFormValue | null = null;

  categories: Category[] = [];

  // --- LOADING STATE'LERİ ---
  isLoadingTasks = true;
  isCreating = false;
  isSaving = false;
  isDeleting = false;
  isBulkDeleting = false;

  readonly dialog = inject(MatDialog);
  private cdr = inject(ChangeDetectorRef);
  private categoryService = inject(CategoryService); // Kategori Servisi enjekte edildi
  private taskService = inject(TaskService); // Görev Servisi enjekte edildi
  private notification = inject(NotificationService);

  @ViewChild('deleteDialog') deleteDialog!: TemplateRef<any>;
  @ViewChild('editTaskDialog') editTaskDialog!: TemplateRef<any>;

  currentEditTask: Task | null = null;
  saveError: string = '';
  private activeDialogRef: MatDialogRef<any> | null = null;
  private pendingDeleteId: string | null = null;

  ngOnInit() {
    this.loadTasks();
    this.loadCategories(); // Sayfa açılırken kategorileri çekiyoruz
  }

  // --- KATEGORİ FONKSİYONLARI ---
  loadCategories() {
    this.categoryService.getCategories().subscribe({
      next: (data) => this.categories = data,
      error: (err) => {
        console.error('Kategoriler yüklenirken hata oluştu:', err);
        this.notification.showError('Kategoriler yüklenirken bir hata oluştu.');
      }
    });
  }

  // --- GÖREV FONKSİYONLARI ---
  loadTasks() {
    this.isLoadingTasks = true;
    this.taskService.getTasks({
      priority: this.selectedPriority,
      status: this.selectedStatus,
      categoryId: this.selectedCategoryId,
      searchTerm: this.searchTerm.trim() || null,
      sortBy: this.sortBy,
      isDescending: this.isDesc,
      pageNumber: this.currentPage,
      pageSize: this.pageSize
    }).subscribe({
      next: (data) => {
        this.dataSource = data.items;
        this.totalCount = data.totalCount;
        this.totalPages = data.totalPages || 1;
        this.isLoadingTasks = false;

        // Mevcut sayfa artık aralık dışında kaldıysa (örn. son öğe silindi), son geçerli sayfaya dön
        if (this.currentPage > this.totalPages && this.totalPages > 0) {
          this.currentPage = this.totalPages;
          this.loadTasks();
          return;
        }

        this.taskListComponent?.refreshTable();
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Görevler çekilirken hata oluştu:', err);
        this.isLoadingTasks = false;
        this.notification.showError('Görevler yüklenirken bir hata oluştu.');
        this.cdr.detectChanges();
      }
    });
  }

  onPageChange(page: number) {
    this.currentPage = page;
    this.loadTasks();
  }

  onPriorityFilterChange() {
    this.currentPage = 1;
    this.loadTasks();
  }

  clearPriorityFilter() {
    this.selectedPriority = null;
    this.currentPage = 1;
    this.loadTasks();
  }

  onStatusFilterChange() {
    this.currentPage = 1;
    this.loadTasks();
  }

  onCategoryFilterChange() {
    this.currentPage = 1;
    this.loadTasks();
  }

  // Kullanıcı yazarken her tuş vuruşunda istek atmamak için 400ms bekletiyoruz
  onSearchChange() {
    if (this.searchDebounceTimer) {
      clearTimeout(this.searchDebounceTimer);
    }
    this.searchDebounceTimer = setTimeout(() => {
      this.currentPage = 1;
      this.loadTasks();
    }, 400);
  }

  hasActiveFilters(): boolean {
    return this.selectedPriority != null || this.selectedStatus != null
      || this.selectedCategoryId != null || this.searchTerm.trim() !== '';
  }

  clearAllFilters() {
    this.selectedPriority = null;
    this.selectedStatus = null;
    this.selectedCategoryId = null;
    this.searchTerm = '';
    this.currentPage = 1;
    this.loadTasks();
  }

  // TaskList'teki herhangi bir sütun başlığına tıklanınca tetiklenir
  onSortChange(field: string) {
    if (this.sortBy === field) {
      this.isDesc = !this.isDesc;
    } else {
      this.sortBy = field;
      this.isDesc = false; // yeni sütun seçilince artan sıralamayla başla
    }
    this.currentPage = 1;
    this.loadTasks();
  }

  // Yeni görev oluşturma (TaskForm bileşeninden gelen değerle)
  onCreateTask(value: TaskFormValue) {
    if (this.isCreating) return;
    this.isCreating = true;

    const newTask: any = {
      title: value.title,
      description: value.description || undefined,
      status: value.status,
      priority: value.priority || 2, // Backend enum: 1=Low,2=Normal,...
      categoryId: value.categoryId || undefined,
      dueDate: value.dueDate || undefined
    };

    this.taskService.createTask(newTask).subscribe({
      next: () => {
        this.isCreating = false;
        this.loadTasks(); // Listeyi yenile
        this.createFormComponent.resetForm(); // Formu temizle
        this.notification.showSuccess('Görev eklendi.');
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Görev eklenirken hata:', err);
        this.isCreating = false;
        this.notification.showError(err.error?.error || 'Görev eklenirken bir hata oluştu.');
        this.cdr.detectChanges();
      }
    });
  }

  editTask(task: any) {
    // 1. Tablodaki verinin anında (biz kaydet demeden) değişmesini engellemek için objenin kopyasını alıyoruz
    this.currentEditTask = { ...task };
    this.editFormValue = null;
    this.saveError = '';
    this.isSaving = false;

    // 2. Düzenleme penceresini açıyoruz
    this.activeDialogRef = this.dialog.open(this.editTaskDialog, {
      width: '600px', // Pencere genişliğini buradan ayarlayabilirsin
      maxWidth: '95vw' // Dar ekranlarda taşmasın
    });

    // 3. Pencere kapandığında (İptal veya X ile) temizlik yapıyoruz
    this.activeDialogRef.afterClosed().subscribe((result: string) => {
      if (result !== 'save') {
        this.currentEditTask = null;
      }
      this.editFormValue = null;
      this.saveError = '';
    });
  }

  // Diyaloğun kendi "Değişiklikleri Kaydet" butonundan tetiklenir.
  // Kayıt bitmeden diyaloğu kapatmıyoruz ki hata durumunda kullanıcı fark etsin.
  saveEditedTask() {
    if (!this.currentEditTask?.id || !this.editFormValue || this.isSaving) return;

    if (!this.editFormValue.title?.trim()) {
      this.saveError = 'Görev adı zorunludur.';
      return;
    }

    this.isSaving = true;
    this.saveError = '';

    const updatedTask: any = {
      title: this.editFormValue.title,
      description: this.editFormValue.description || undefined,
      status: this.editFormValue.status,
      priority: this.editFormValue.priority,
      categoryId: this.editFormValue.categoryId || undefined,
      dueDate: this.editFormValue.dueDate || undefined
    };

    this.taskService.updateTask(this.currentEditTask.id, updatedTask).subscribe({
      next: () => {
        this.isSaving = false;
        this.loadTasks();
        this.currentEditTask = null;
        this.activeDialogRef?.close('save');
        this.notification.showSuccess('Görev güncellendi.');
      },
      error: (err) => {
        console.error('Görev güncellenirken backend tarafında hata oluştu:', err);
        this.saveError = err.error?.error || 'Görev güncellenirken bir hata oluştu.';
        this.isSaving = false;
        this.cdr.detectChanges();
      }
    });
  }

  openDeleteConfirm(id: string, event: Event) {
    event.stopPropagation();
    this.isDeleting = false;
    this.pendingDeleteId = id;

    this.activeDialogRef = this.dialog.open(this.deleteDialog, {
      width: '350px',
      maxWidth: '95vw'
    });

    this.activeDialogRef.afterClosed().subscribe(() => {
      this.isDeleting = false;
      this.pendingDeleteId = null;
    });
  }

  // "Evet, Sil" butonundan tetiklenir; silme bitmeden diyalog kapanmaz
  confirmDelete() {
    if (!this.pendingDeleteId || this.isDeleting) return;

    this.isDeleting = true;
    this.taskService.deleteTask(this.pendingDeleteId).subscribe({
      next: () => {
        this.isDeleting = false;
        this.loadTasks(); // Silindikten sonra güncel listeyi çek
        this.activeDialogRef?.close('confirm');
        this.notification.showSuccess('Görev silindi.');
      },
      error: (err) => {
        console.error('Silme işlemi başarısız:', err);
        this.isDeleting = false;
        this.notification.showError(err.error?.error || 'Görev silinirken bir hata oluştu.');
        this.cdr.detectChanges();
      }
    });
  }

  // --- ÇOKLU SEÇİM FONKSİYONLARI ---
  openBulkDeleteConfirm() {
    if (this.selection.selected.length === 0) return;
    this.isBulkDeleting = false;

    this.activeDialogRef = this.dialog.open(this.bulkDeleteDialog, {
      width: '400px',
      maxWidth: '95vw'
    });

    this.activeDialogRef.afterClosed().subscribe(() => {
      this.isBulkDeleting = false;
    });
  }

  // "Evet, Hepsini Sil" butonundan tetiklenir; silme bitmeden diyalog kapanmaz
  confirmBulkDelete() {
    if (this.isBulkDeleting) return;
    this.isBulkDeleting = true;

    const selectedIds = this.selection.selected.map(task => task.id).filter(id => id != null) as string[];
    const deleteRequests = selectedIds.map(id => this.taskService.deleteTask(id));
    const deletedCount = selectedIds.length;

    // Tüm silme isteklerinin tamamlanmasını bekliyoruz
    import('rxjs').then(({ forkJoin }) => {
      forkJoin(deleteRequests).subscribe({
        next: () => {
          this.isBulkDeleting = false;
          this.loadTasks(); // Listeyi veritabanından yeniden taze çekmek en güvenlisidir
          this.selection.clear();
          this.activeDialogRef?.close('confirm');
          this.notification.showSuccess(`${deletedCount} görev silindi.`);
        },
        error: (err) => {
          console.error('Toplu silme sırasında bir hata oluştu:', err);
          this.isBulkDeleting = false;
          this.notification.showError('Görevler silinirken bir hata oluştu.');
          this.cdr.detectChanges();
        }
      });
    });
  }

}