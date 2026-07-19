import { Component, OnInit, TemplateRef, ViewChild, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule, MatTable } from '@angular/material/table';
import { MaterialModule } from '../../shared/material.module';
import { AuthService } from '../../core/services/auth';

 // Dialog modülü
import { MatDialog } from '@angular/material/dialog';
import { FormsModule } from '@angular/forms';
import { SelectionModel } from '@angular/cdk/collections';
import { Task, SubTask } from '../../core/models/task.model';

@Component({
  selector: 'app-tasks',
  imports: [
    CommonModule,
    FormsModule,
    MaterialModule
  ],
  templateUrl: './tasks.html',
  styleUrl: './tasks.scss'
})

// değişkenler
export class Tasks implements OnInit {
  isDarkMode = false;

  displayedColumns: string[] = ['select', 'id', 'title', 'status', 'actions'];
  selection = new SelectionModel<Task>(true, []);
  @ViewChild(MatTable) table!: MatTable<Task>;
  @ViewChild('bulkDeleteDialog') bulkDeleteDialog!: TemplateRef<any>;

  dataSource: Task[] = [];
  newTaskTitle: string = '';
  newTaskStatus: 'Bekliyor' | 'Devam Ediyor' | 'Tamamlandı' | 'İptal Edildi' = 'Devam Ediyor';
  editingTaskId: number | null = null; 

  // Dialog servisini ve Angular'ın değişiklik algılayıcısını hafızada tutacak değişkenler
  readonly dialog = inject(MatDialog);
  private cdr = inject(ChangeDetectorRef); // Sistemi manuel tetikleyecek servisi
  @ViewChild('deleteDialog') deleteDialog!: TemplateRef<any>;

  @ViewChild('editTaskDialog') editTaskDialog!: TemplateRef<any>;
  
  currentEditTask: Task | null = null; // Ekranda düzenlenen görevin kopyasını tutar
  newSubTaskTitle: string = '';        // alt görev inputu

  ngOnInit() {
    this.loadTasks();
  }

  loadTasks() {
    const savedTasks = localStorage.getItem('my_tasks');
    if (savedTasks) {
      this.dataSource = JSON.parse(savedTasks);
    } else {
      this.dataSource = [
        { id: 1, title: 'Angular Environment Konfigürasyonu', status: 'Tamamlandı', priority: 'Yüksek' },
        { id: 2, title: 'Navbar Tasarımı ve SCSS Ayarları', status: 'Tamamlandı', priority: 'Orta' },
        { id: 3, title: 'Görevler Tablosunun Çizilmesi', status: 'Devam Ediyor', priority: 'Yüksek' }
      ];
    }
  }

  saveDataToStorage() {
    localStorage.setItem('my_tasks', JSON.stringify(this.dataSource));
  }

  saveTask() {
    if (this.newTaskTitle.trim() === '') return;

    if (this.editingTaskId) {
      this.dataSource = this.dataSource.map(task => {
        if (task.id === this.editingTaskId) {
          return { ...task, title: this.newTaskTitle, status: this.newTaskStatus };
        }
        return task;
      });
      this.editingTaskId = null;
    } else {
      const newTask: Task = {
        id: this.dataSource.length > 0 ? Math.max(...this.dataSource.map(t => t.id)) + 1 : 1,
        title: this.newTaskTitle,
        status: this.newTaskStatus,
        priority: 'Orta'
      };
      this.dataSource = [...this.dataSource, newTask];
    }

    this.saveDataToStorage();
    this.newTaskTitle = ''; 
    this.newTaskStatus = 'Devam Ediyor'; 
  }

  editTask(task: Task) {
    // Referans kopmasın diye nesnenin güvenli bir kopyasını alıyoruz
    this.currentEditTask = { ...task, subTasks: task.subTasks ? [...task.subTasks] : [] };

    const dialogRef = this.dialog.open(this.editTaskDialog, {
      width: '600px', // Detaylı form olduğu için geniş tutuyoruz
      disableClose: true // Dışarı tıklayınca kapanmasın, illa butona basılsın
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result === 'save' && this.currentEditTask) {
        // Değişiklikleri ana listeye yansıt
        this.dataSource = this.dataSource.map(t => 
          t.id === this.currentEditTask!.id ? this.currentEditTask! : t
        );
        this.saveDataToStorage();
        this.table.renderRows();
        this.cdr.detectChanges();
      }
      this.currentEditTask = null; // İşlem bitince hafızayı temizle
    });
  }

  // --- ALT GÖREV (SUBTASK) FONKSİYONLARI ---
  addSubTask() {
    if (this.newSubTaskTitle.trim() === '' || !this.currentEditTask) return;
    
    const newSubTask: SubTask = {
      id: Date.now(), // Basit bir benzersiz ID
      title: this.newSubTaskTitle,
      completed: false
    };
    
    this.currentEditTask.subTasks!.push(newSubTask);
    this.newSubTaskTitle = ''; // Input'u temizle
  }

  removeSubTask(subTaskId: number) {
    if (!this.currentEditTask || !this.currentEditTask.subTasks) return;
    this.currentEditTask.subTasks = this.currentEditTask.subTasks.filter(st => st.id !== subTaskId);
  }

  openDeleteConfirm(id: number, event: Event) {
    event.stopPropagation(); 

    const dialogRef = this.dialog.open(this.deleteDialog, {
      width: '350px'
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result === 'confirm') {
        this.dataSource = this.dataSource.filter(task => task.id !== id);
        this.saveDataToStorage();
        
        // Tabloyu ve ekranı zorla güncelle
        this.table.renderRows(); 
        this.cdr.detectChanges(); // ANGULAR'I UYANDIRAN KOD
      }
    });
  }

  // --- ÇOKLU SEÇİM FONKSİYONLARI ---

  // Tüm satırlar seçili mi diye kontrol eder (En üstteki master checkbox için)
  isAllSelected() {
    const numSelected = this.selection.selected.length;
    const numRows = this.dataSource.length;
    return numSelected === numRows;
  }

  // Tüm satırları seçer veya bırakır
  toggleAllRows() {
    if (this.isAllSelected()) {
      this.selection.clear();
      return;
    }
    this.selection.select(...this.dataSource);
  }

  openBulkDeleteConfirm() {
    if (this.selection.selected.length === 0) return;

    const dialogRef = this.dialog.open(this.bulkDeleteDialog, {
      width: '400px'
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result === 'confirm') {
        const selectedIds = this.selection.selected.map(task => task.id);
        this.dataSource = this.dataSource.filter(task => !selectedIds.includes(task.id));
        this.selection.clear(); 
        this.saveDataToStorage();
        
        // Tabloyu ve ekranı zorla güncelle
        this.table.renderRows(); 
        this.cdr.detectChanges(); // ANGULAR'I UYANDIRAN KOD
      }
    });
  }

    // dark mode toggle fonksiyonu
  toggleTheme() {
    this.isDarkMode = !this.isDarkMode;
    if (this.isDarkMode) {
      document.body.classList.add('dark-theme');
    } else {
      document.body.classList.remove('dark-theme');
    }
  }

  // AuthService'i içeri alıyoruz
  private authService = inject(AuthService);

  // Çıkış butonuna basıldığında çalışacak fonksiyon
  onLogout(): void {
    this.authService.logout();
  }
}