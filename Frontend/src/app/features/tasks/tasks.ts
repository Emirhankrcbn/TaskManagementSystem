import { Component, OnInit, TemplateRef, ViewChild, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MaterialModule } from '../../shared/material.module';
import { CategoryService } from '../../core/services/category'; // Kategori Servisi Eklendi
import { Category } from '../../core/models/category.model'; // Kategori Modeli Eklendi
import { MatDialog } from '@angular/material/dialog';
import { FormsModule } from '@angular/forms';
import { SelectionModel } from '@angular/cdk/collections';
import { Task, SubTask, TaskAttachment } from '../../core/models/task.model';
import { TaskService } from '../../core/services/task'; // Kendi dosya yoluna göre ayarla
import { TaskList } from './task-list/task-list';
import { TaskForm, TaskFormValue } from './task-form/task-form';

@Component({
  selector: 'app-tasks',
  imports: [
    CommonModule,
    FormsModule,
    MaterialModule,
    TaskList,
    TaskForm
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

  // Düzenleme diyaloğundaki TaskForm'un güncel değeri (kaydet anında okunur)
  editFormValue: TaskFormValue | null = null;

  categories: Category[] = [];

  readonly dialog = inject(MatDialog);
  private cdr = inject(ChangeDetectorRef);
  private categoryService = inject(CategoryService); // Kategori Servisi enjekte edildi
  private taskService = inject(TaskService); // Görev Servisi enjekte edildi

  @ViewChild('deleteDialog') deleteDialog!: TemplateRef<any>;
  @ViewChild('editTaskDialog') editTaskDialog!: TemplateRef<any>;
  
  currentEditTask: Task | null = null;
  newSubTaskTitle: string = '';

  attachments: TaskAttachment[] = [];
  isUploadingAttachment: boolean = false;

  ngOnInit() {
    this.loadTasks();
    this.loadCategories(); // Sayfa açılırken kategorileri çekiyoruz
  }

  // --- KATEGORİ FONKSİYONLARI ---
  loadCategories() {
    this.categoryService.getCategories().subscribe({
      next: (data) => this.categories = data,
      error: (err) => console.error('Kategoriler yüklenirken hata oluştu:', err)
    });
  }

  // --- GÖREV FONKSİYONLARI ---
  loadTasks() {
    this.taskService.getTasks({
      priority: this.selectedPriority,
      status: this.selectedStatus,
      categoryId: this.selectedCategoryId,
      searchTerm: this.searchTerm.trim() || null,
      sortBy: this.sortBy,
      isDescending: this.isDesc
    }).subscribe({
      next: (data: any) => {
        console.log("Backend'den gelen ham veri:", data); 

        // 1. İhtimal: Backend Pagination (Sayfalama) yapısı kullanıyor, veriler 'items' içinde!
        if (data && data.items && Array.isArray(data.items)) {
          this.dataSource = data.items;
        }
        // 2. İhtimal: C# ReferenceHandler.Preserve kullanıyorsa veriler $values içindedir
        else if (data && data.$values) {
          this.dataSource = data.$values;
        } 
        // 3. İhtimal: Özel bir API kılıfı
        else if (data && data.data) {
          this.dataSource = data.data;
        } 
        // 4. İhtimal: Gelen veri zaten tertemiz bir diziyse
        else if (Array.isArray(data)) {
          this.dataSource = data;
        } 
        // Bulamazsa boş dizi ata
        else {
          this.dataSource = [];
        }

        // Tabloyu güvenle güncelle
        this.taskListComponent?.refreshTable();
        this.cdr.detectChanges();
      },
      error: (err) => console.error('Görevler çekilirken hata oluştu:', err)
    });
  }

  onPriorityFilterChange() {
    this.loadTasks();
  }

  clearPriorityFilter() {
    this.selectedPriority = null;
    this.loadTasks();
  }

  onStatusFilterChange() {
    this.loadTasks();
  }

  onCategoryFilterChange() {
    this.loadTasks();
  }

  // Kullanıcı yazarken her tuş vuruşunda istek atmamak için 400ms bekletiyoruz
  onSearchChange() {
    if (this.searchDebounceTimer) {
      clearTimeout(this.searchDebounceTimer);
    }
    this.searchDebounceTimer = setTimeout(() => {
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
    this.loadTasks();
  }

  togglePrioritySort() {
    if (this.sortBy === 'Priority') {
      this.isDesc = !this.isDesc;
    } else {
      this.sortBy = 'Priority';
      this.isDesc = false; // default ascending
    }
    this.loadTasks();
  }

  // Yeni görev oluşturma (TaskForm bileşeninden gelen değerle)
  onCreateTask(value: TaskFormValue) {
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
        this.loadTasks(); // Listeyi yenile
        this.createFormComponent.resetForm(); // Formu temizle
      },
      error: (err) => console.error('Görev eklenirken hata:', err)
    });
  }

  editTask(task: any) {
    // 1. Tablodaki verinin anında (biz kaydet demeden) değişmesini engellemek için objenin kopyasını alıyoruz
    this.currentEditTask = { ...task };
    this.editFormValue = null;
    this.attachments = [];
    if (this.currentEditTask?.id) {
      this.loadAttachments(this.currentEditTask.id);
    }

    // 2. Düzenleme penceresini açıyoruz
    const dialogRef = this.dialog.open(this.editTaskDialog, {
      width: '600px' // Pencere genişliğini buradan ayarlayabilirsin
    });

    // 3. Pencere kapandığında ne olacağını dinliyoruz
    dialogRef.afterClosed().subscribe(result => {
      if (result === 'save') {
        // GÜVENLİK KONTROLÜ: Eğer ID gerçekten varsa güncelleme isteği at
        if (this.currentEditTask?.id && this.editFormValue) {
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
              this.loadTasks();
              this.currentEditTask = null;
            },
            error: (err) => console.error('Görev güncellenirken backend tarafında hata oluştu:', err)
          });
        }
      } else {
        this.currentEditTask = null;
      }
      this.editFormValue = null;
      this.attachments = [];
    });
  }

  // --- DOSYA EKİ (ATTACHMENT) FONKSİYONLARI ---
  loadAttachments(taskId: string) {
    this.taskService.getAttachments(taskId).subscribe({
      next: (data) => this.attachments = data,
      error: (err) => console.error('Dosyalar yüklenirken hata oluştu:', err)
    });
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0 || !this.currentEditTask?.id) return;

    const file = input.files[0];
    const taskId = this.currentEditTask.id;
    this.isUploadingAttachment = true;

    this.taskService.uploadAttachment(taskId, file).subscribe({
      next: (attachment) => {
        this.attachments = [attachment, ...this.attachments];
        this.isUploadingAttachment = false;
        input.value = ''; // aynı dosyayı tekrar seçebilmek için input'u temizle
      },
      error: (err) => {
        console.error('Dosya yüklenirken hata oluştu:', err);
        this.isUploadingAttachment = false;
        input.value = '';
      }
    });
  }

  deleteAttachment(attachment: TaskAttachment) {
    if (!this.currentEditTask?.id) return;
    const taskId = this.currentEditTask.id;

    this.taskService.deleteAttachment(taskId, attachment.id).subscribe({
      next: () => {
        this.attachments = this.attachments.filter(a => a.id !== attachment.id);
      },
      error: (err) => console.error('Dosya silinirken hata oluştu:', err)
    });
  }

  getAttachmentUrl(filePath: string): string {
    return this.taskService.getAttachmentUrl(filePath);
  }

  formatFileSize(bytes: number): string {
    if (!bytes) return '0 B';
    const units = ['B', 'KB', 'MB', 'GB'];
    let size = bytes;
    let unitIndex = 0;
    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }
    return `${size.toFixed(unitIndex === 0 ? 0 : 1)} ${units[unitIndex]}`;
  }

  // --- ALT GÖREV (SUBTASK) FONKSİYONLARI ---
  addSubTask() {
    if (this.newSubTaskTitle.trim() === '' || !this.currentEditTask) return;
    
    const newSubTask: SubTask = {
      id: Date.now().toString(), // Alt görev ID'sini de string yaptık
      title: this.newSubTaskTitle,
      completed: false
    };
    
    this.currentEditTask.subTasks!.push(newSubTask);
    this.newSubTaskTitle = ''; 
  }

  removeSubTask(subTaskId: string) { // subTaskId tipi string oldu
    if (!this.currentEditTask || !this.currentEditTask.subTasks) return;
    this.currentEditTask.subTasks = this.currentEditTask.subTasks.filter(st => st.id !== subTaskId);
  }

  openDeleteConfirm(id: string, event: Event) {
    event.stopPropagation(); 

    const dialogRef = this.dialog.open(this.deleteDialog, {
      width: '350px'
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result === 'confirm') {
        // BACKEND'DEN SİLME İŞLEMİ
        this.taskService.deleteTask(id).subscribe({
          next: () => {
            this.loadTasks(); // Silindikten sonra güncel listeyi çek
          },
          error: (err) => console.error('Silme işlemi başarısız:', err)
        });
      }
    });
  }

  // --- ÇOKLU SEÇİM FONKSİYONLARI ---
  openBulkDeleteConfirm() {
    if (this.selection.selected.length === 0) return;

    const dialogRef = this.dialog.open(this.bulkDeleteDialog, {
      width: '400px'
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result === 'confirm') {
        const selectedIds = this.selection.selected.map(task => task.id).filter(id => id != null) as string[];
        
        // Seçilen ID'leri backend'e silinmek üzere gönderiyoruz
        // Eğer backend'de tekli silme kullanıyorsan her biri için delete isteği atabiliriz:
        const deleteRequests = selectedIds.map(id => this.taskService.deleteTask(id));

        // Tüm silme isteklerinin tamamlanmasını bekliyoruz
        import('rxjs').then(({ forkJoin }) => {
          forkJoin(deleteRequests).subscribe({
            next: () => {
              // Backend'den onay gelince arayüzü güncelliyoruz
              this.loadTasks(); // Listeyi veritabanından yeniden taze çekmek en güvenlisidir
              this.selection.clear();
              this.cdr.detectChanges();
            },
            error: (err) => {
              console.error('Toplu silme sırasında bir hata oluştu:', err);
            }
          });
        });
      }
    });
  }

}