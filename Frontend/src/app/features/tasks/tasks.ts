import { Component, OnInit, TemplateRef, ViewChild, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule, MatTable } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatDialogModule, MatDialog } from '@angular/material/dialog'; // Dialog modülü
import { FormsModule } from '@angular/forms';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { SelectionModel } from '@angular/cdk/collections';


export interface Task {
  id: number;
  title: string;
  status: string;
}

@Component({
  selector: 'app-tasks',
  imports: [
    CommonModule,
    MatTableModule, 
    MatButtonModule, 
    MatFormFieldModule, 
    MatInputModule, 
    MatIconModule, 
    MatSelectModule,
    MatDialogModule, // Modül sisteme
    FormsModule,
    MatCheckboxModule
  ],
  templateUrl: './tasks.html',
  styleUrl: './tasks.scss'
})
export class Tasks implements OnInit {
  displayedColumns: string[] = ['select', 'id', 'title', 'status', 'actions'];
  selection = new SelectionModel<Task>(true, []);
  @ViewChild(MatTable) table!: MatTable<Task>;
  @ViewChild('bulkDeleteDialog') bulkDeleteDialog!: TemplateRef<any>;

  dataSource: Task[] = [];
  newTaskTitle: string = '';
  newTaskStatus: string = 'Devam Ediyor';
  editingTaskId: number | null = null; 

  // Dialog servisini ve Angular'ın değişiklik algılayıcısını hafızada tutacak değişkenler
  readonly dialog = inject(MatDialog);
  private cdr = inject(ChangeDetectorRef); // Sistemi manuel tetikleyecek servisi
  @ViewChild('deleteDialog') deleteDialog!: TemplateRef<any>;

  ngOnInit() {
    this.loadTasks();
  }

  loadTasks() {
    const savedTasks = localStorage.getItem('my_tasks');
    if (savedTasks) {
      this.dataSource = JSON.parse(savedTasks);
    } else {
      this.dataSource = [
        { id: 1, title: 'Angular Environment Konfigürasyonu', status: 'Tamamlandı' },
        { id: 2, title: 'Navbar Tasarımı ve SCSS Ayarları', status: 'Tamamlandı' },
        { id: 3, title: 'Görevler Tablosunun Çizilmesi', status: 'Devam Ediyor' }
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
        status: this.newTaskStatus
      };
      this.dataSource = [...this.dataSource, newTask];
    }

    this.saveDataToStorage();
    this.newTaskTitle = ''; 
    this.newTaskStatus = 'Devam Ediyor'; 
  }

  editTask(task: Task) {
    this.newTaskTitle = task.title; 
    this.newTaskStatus = task.status; 
    this.editingTaskId = task.id;   
  }

  openDeleteConfirm(id: number) {
    const dialogRef = this.dialog.open(this.deleteDialog, {
      width: '350px'
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result === 'confirm') {
        this.dataSource = this.dataSource.filter(task => task.id !== id);
        this.saveDataToStorage();
        
        // EKRANI ZORLA YENİLEMEK İÇİN BUNU KULLANIYORUZ
        this.table.renderRows(); 
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

  // --- TOPLU SİLME FONKSİYONU ---
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
        
        // EKRANI ZORLA YENİLEMEK İÇİN BUNU KULLANIYORUZ
        this.table.renderRows(); 
      }
    });
  }
}