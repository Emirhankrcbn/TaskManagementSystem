import { Component, Input, Output, EventEmitter, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MaterialModule } from '../../../shared/material.module';
import { TaskForm, TaskFormValue } from '../task-form/task-form';
import { TaskService } from '../../../core/services/task';
import { Category } from '../../../core/models/category.model';
import { Task, SubTask, TaskAttachment } from '../../../core/models/task.model';

@Component({
  selector: 'app-task-detail',
  imports: [CommonModule, FormsModule, MaterialModule, TaskForm],
  templateUrl: './task-detail.html',
  styleUrl: './task-detail.scss'
})
export class TaskDetail implements OnInit {
  @Input() task: Task | null = null;
  @Input() categories: Category[] = [];

  // Görev formu her değiştiğinde güncel değeri dışarı (dialog'u yöneten sayfaya) bildirir
  @Output() valueChange = new EventEmitter<TaskFormValue>();

  private taskService = inject(TaskService);
  private cdr = inject(ChangeDetectorRef);

  subTasks: SubTask[] = [];
  newSubTaskTitle: string = '';

  attachments: TaskAttachment[] = [];
  isUploadingAttachment: boolean = false;

  ngOnInit(): void {
    this.subTasks = this.task?.subTasks ? [...this.task.subTasks] : [];
    if (this.task?.id) {
      this.loadAttachments(this.task.id);
    }
  }

  onFormValueChange(value: TaskFormValue): void {
    this.valueChange.emit(value);
  }

  // --- ALT GÖREV (SUBTASK) FONKSİYONLARI ---
  addSubTask(): void {
    if (this.newSubTaskTitle.trim() === '') return;

    const newSubTask: SubTask = {
      id: Date.now().toString(),
      title: this.newSubTaskTitle,
      completed: false
    };

    this.subTasks.push(newSubTask);
    this.newSubTaskTitle = '';
  }

  removeSubTask(subTaskId: string): void {
    this.subTasks = this.subTasks.filter(st => st.id !== subTaskId);
  }

  // --- DOSYA EKİ (ATTACHMENT) FONKSİYONLARI ---
  loadAttachments(taskId: string): void {
    this.taskService.getAttachments(taskId).subscribe({
      next: (data) => {
        this.attachments = data;
        this.cdr.detectChanges();
      },
      error: (err) => console.error('Dosyalar yüklenirken hata oluştu:', err)
    });
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0 || !this.task?.id) return;

    const file = input.files[0];
    const taskId = this.task.id;
    this.isUploadingAttachment = true;

    this.taskService.uploadAttachment(taskId, file).subscribe({
      next: (attachment) => {
        this.attachments = [attachment, ...this.attachments];
        this.isUploadingAttachment = false;
        input.value = ''; // aynı dosyayı tekrar seçebilmek için input'u temizle
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Dosya yüklenirken hata oluştu:', err);
        this.isUploadingAttachment = false;
        input.value = '';
        this.cdr.detectChanges();
      }
    });
  }

  deleteAttachment(attachment: TaskAttachment): void {
    if (!this.task?.id) return;
    const taskId = this.task.id;

    this.taskService.deleteAttachment(taskId, attachment.id).subscribe({
      next: () => {
        this.attachments = this.attachments.filter(a => a.id !== attachment.id);
        this.cdr.detectChanges();
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
}
