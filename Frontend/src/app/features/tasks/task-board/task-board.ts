import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DragDropModule, CdkDragDrop, moveItemInArray, transferArrayItem } from '@angular/cdk/drag-drop';
import { MaterialModule } from '../../../shared/material.module';
import { Task, getSubtaskProgress } from '../../../core/models/task.model';

export interface TaskStatusChange {
  task: Task;
  newStatus: number;
}

interface BoardColumn {
  status: number;
  title: string;
  tasks: Task[];
}

@Component({
  selector: 'app-task-board',
  imports: [CommonModule, DragDropModule, MaterialModule],
  templateUrl: './task-board.html',
  styleUrl: './task-board.scss'
})
export class TaskBoard implements OnChanges {
  @Input() tasks: Task[] = [];
  @Output() statusChange = new EventEmitter<TaskStatusChange>();

  columns: BoardColumn[] = [
    { status: 0, title: 'Bekliyor', tasks: [] },
    { status: 1, title: 'Devam Ediyor', tasks: [] },
    { status: 2, title: 'Tamamlandı', tasks: [] },
    { status: 3, title: 'İptal Edildi', tasks: [] }
  ];

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['tasks']) {
      this.regroupColumns();
    }
  }

  private regroupColumns(): void {
    for (const column of this.columns) {
      column.tasks = this.tasks.filter(t => t.status === column.status);
    }
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

  drop(event: CdkDragDrop<Task[]>, targetStatus: number): void {
    if (event.previousContainer === event.container) {
      // Aynı sütun içinde sıra değişimi - sadece görsel, backend'de kalıcı bir sıra alanı yok
      moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);
      return;
    }

    const task = event.previousContainer.data[event.previousIndex];
    transferArrayItem(event.previousContainer.data, event.container.data, event.previousIndex, event.currentIndex);
    this.statusChange.emit({ task, newStatus: targetStatus });
  }
}
