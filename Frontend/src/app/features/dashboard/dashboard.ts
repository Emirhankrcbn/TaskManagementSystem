import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MaterialModule } from '../../shared/material.module';
import { TaskService } from '../../core/services/task';
import { AuthService } from '../../core/services/auth';
import { Task, TaskStatistics } from '../../core/models/task.model';

@Component({
  selector: 'app-dashboard',
  imports: [CommonModule, RouterLink, MaterialModule],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss',
})
export class Dashboard implements OnInit {
  private taskService = inject(TaskService);
  private authService = inject(AuthService);
  private cdr = inject(ChangeDetectorRef);

  isLoading = true;
  displayName: string = '';

  statistics: TaskStatistics = {
    totalTasks: 0,
    completedTasks: 0,
    inProgressTasks: 0,
    pendingTasks: 0
  };

  overdueTasks: Task[] = [];

  ngOnInit(): void {
    this.loadStatistics();
    this.loadOverdueTasks();
    this.loadUserName();
  }

  private loadUserName(): void {
    this.authService.getProfile().subscribe({
      next: (data) => {
        this.displayName = data.firstName || data.username;
        this.cdr.detectChanges();
      },
      error: () => {}
    });
  }

  private loadStatistics(): void {
    this.taskService.getStatistics().subscribe({
      next: (data) => {
        this.statistics = data;
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('İstatistikler yüklenirken hata oluştu:', err);
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  private loadOverdueTasks(): void {
    this.taskService.getOverdueTasks().subscribe({
      next: (data) => {
        this.overdueTasks = data;
        this.cdr.detectChanges();
      },
      error: (err) => console.error('Süresi geçmiş görevler yüklenirken hata oluştu:', err)
    });
  }

  get completionPercent(): number {
    if (this.statistics.totalTasks === 0) return 0;
    return Math.round((this.statistics.completedTasks / this.statistics.totalTasks) * 100);
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

  getDaysOverdue(dueDate?: string | null): number {
    if (!dueDate) return 0;
    const diffMs = new Date().getTime() - new Date(dueDate).getTime();
    return Math.max(1, Math.floor(diffMs / (1000 * 60 * 60 * 24)));
  }
}
