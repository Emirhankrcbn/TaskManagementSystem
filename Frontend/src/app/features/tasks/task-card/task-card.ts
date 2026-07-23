import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MaterialModule } from '../../../shared/material.module';
import { Task } from '../../../core/models/task.model';

@Component({
  selector: 'app-task-card',
  imports: [CommonModule, MaterialModule],
  templateUrl: './task-card.html',
  styleUrl: './task-card.scss'
})
export class TaskCard {
  @Input() task!: Task;

  // Kart sağında gösterilecek opsiyonel etiket (örn: "3 gün gecikti")
  @Input() badgeText?: string;
  @Input() badgeVariant: 'default' | 'danger' = 'default';

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
