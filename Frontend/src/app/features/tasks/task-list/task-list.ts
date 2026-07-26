import { Component, Input, Output, EventEmitter, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTable } from '@angular/material/table';
import { SelectionModel } from '@angular/cdk/collections';
import { MaterialModule } from '../../../shared/material.module';
import { Task, getSubtaskProgress } from '../../../core/models/task.model';

@Component({
  selector: 'app-task-list',
  imports: [CommonModule, MaterialModule],
  templateUrl: './task-list.html',
  styleUrl: './task-list.scss'
})
export class TaskList {
  @Input() tasks: Task[] = [];
  @Input() selection!: SelectionModel<Task>;
  @Input() sortBy: string | null = null;
  @Input() isDesc: boolean = false;

  @Output() editTask = new EventEmitter<Task>();
  @Output() deleteTask = new EventEmitter<{ id: string; event: Event }>();
  @Output() sortChange = new EventEmitter<string>();

  displayedColumns: string[] = ['select', 'id', 'title', 'category', 'priority', 'progress', 'dueDate', 'status', 'actions'];

  @ViewChild(MatTable) table!: MatTable<Task>;

  // Tablo yeniden çizilmesi gerektiğinde (dataSource referansı değiştiğinde) dışarıdan çağrılabilir
  refreshTable(): void {
    if (this.table) {
      this.table.renderRows();
    }
  }

  isAllSelected(): boolean {
    return this.selection.hasValue() && this.selection.selected.length === this.tasks.length;
  }

  toggleAllRows(): void {
    if (this.isAllSelected()) {
      this.selection.clear();
      return;
    }
    this.selection.select(...this.tasks);
  }

  onEdit(task: Task): void {
    this.editTask.emit(task);
  }

  onDelete(id: string, event: Event): void {
    event.stopPropagation();
    this.deleteTask.emit({ id, event });
  }

  onSort(field: string): void {
    this.sortChange.emit(field);
  }

  getSortIcon(field: string): string {
    if (this.sortBy !== field) return 'swap_vert';
    return this.isDesc ? 'arrow_downward' : 'arrow_upward';
  }

  getPriorityLabel(priority?: number | null): string {
    switch (priority) {
      case 1: return 'Düşük';
      case 2: return 'Normal';
      case 3: return 'Yüksek';
      case 4: return 'Acil';
      case 5: return 'Kritik';
      default: return '—';
    }
  }

  formatDate(dateStr?: string | null): string {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('tr-TR');
  }

  // Tamamlanmış/iptal edilmiş görevler için bitiş tarihi uyarısı gösterilmez
  getDueDateStatus(task: Task): 'overdue' | 'soon' | 'normal' {
    if (!task.dueDate || task.status === 2 || task.status === 3) return 'normal';

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const due = new Date(task.dueDate);
    due.setHours(0, 0, 0, 0);

    const dayMs = 1000 * 60 * 60 * 24;
    const diffDays = Math.round((due.getTime() - today.getTime()) / dayMs);

    if (diffDays < 0) return 'overdue';
    if (diffDays <= 2) return 'soon';
    return 'normal';
  }

  getSubtaskProgress(task: Task) {
    return getSubtaskProgress(task);
  }

  // mat-table trackBy: sıralama/filtreleme sonrası sadece değişen satırlar yeniden oluşturulsun
  trackByTaskId(index: number, task: Task): string {
    return task.id ?? index.toString();
  }
}
