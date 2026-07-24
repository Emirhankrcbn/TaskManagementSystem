import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DragDropModule, CdkDragDrop, moveItemInArray, transferArrayItem } from '@angular/cdk/drag-drop';
import { MaterialModule } from '../../../shared/material.module';
import { Task } from '../../../core/models/task.model';

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
