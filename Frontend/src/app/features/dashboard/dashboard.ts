import { Component, OnInit, inject, ChangeDetectorRef, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MaterialModule } from '../../shared/material.module';
import { TaskService } from '../../core/services/task';
import { AuthService } from '../../core/services/auth';
import { Task, TaskStatistics } from '../../core/models/task.model';
import { TaskCard } from '../tasks/task-card/task-card';
import { NotificationService } from '../../core/services/notification';

@Component({
  selector: 'app-dashboard',
  imports: [CommonModule, RouterLink, MaterialModule, TaskCard],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss',
})
export class Dashboard implements OnInit {
  private taskService = inject(TaskService);
  private authService = inject(AuthService);
  private cdr = inject(ChangeDetectorRef);
  private notification = inject(NotificationService);
  private destroyRef = inject(DestroyRef);

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
    this.authService.getProfile().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (data) => {
        this.displayName = data.firstName || data.username;
        this.cdr.detectChanges();
      },
      error: () => {}
    });
  }

  private loadStatistics(): void {
    this.taskService.getStatistics().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (data) => {
        this.statistics = data;
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('İstatistikler yüklenirken hata oluştu:', err);
        this.isLoading = false;
        this.notification.showError('İstatistikler yüklenirken bir hata oluştu.');
        this.cdr.detectChanges();
      }
    });
  }

  private loadOverdueTasks(): void {
    this.taskService.getOverdueTasks().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (data) => {
        this.overdueTasks = data;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Süresi geçmiş görevler yüklenirken hata oluştu:', err);
        this.notification.showError('Süresi geçmiş görevler yüklenirken bir hata oluştu.');
      }
    });
  }

  get completionPercent(): number {
    if (this.statistics.totalTasks === 0) return 0;
    return Math.round((this.statistics.completedTasks / this.statistics.totalTasks) * 100);
  }

  // *ngFor trackBy: gecikmiş görevler listesi her değişiklik algılamada yeniden oluşturulmasın
  trackByTaskId(index: number, task: Task): string {
    return task.id ?? index.toString();
  }

  getDaysOverdue(dueDate?: string | null): number {
    if (!dueDate) return 0;
    const diffMs = new Date().getTime() - new Date(dueDate).getTime();
    return Math.max(1, Math.floor(diffMs / (1000 * 60 * 60 * 24)));
  }
}
