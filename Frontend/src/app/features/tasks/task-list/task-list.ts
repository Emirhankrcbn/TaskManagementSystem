import { Component, Input, Output, EventEmitter, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTable } from '@angular/material/table';
import { SelectionModel } from '@angular/cdk/collections';
import { MaterialModule } from '../../../shared/material.module';
import { Task } from '../../../core/models/task.model';

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
  @Output() togglePrioritySort = new EventEmitter<void>();

  displayedColumns: string[] = ['select', 'id', 'title', 'category', 'priority', 'status', 'actions'];

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

  onTogglePrioritySort(): void {
    this.togglePrioritySort.emit();
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
}
