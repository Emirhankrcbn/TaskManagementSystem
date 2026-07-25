import { Component, Input, Output, EventEmitter, OnInit, TemplateRef, ViewChild, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { MaterialModule } from '../../../shared/material.module';
import { TaskForm, TaskFormValue } from '../task-form/task-form';
import { TaskService } from '../../../core/services/task';
import { Category } from '../../../core/models/category.model';
import { Task, SubTask, TaskAttachment } from '../../../core/models/task.model';
import { NotificationService } from '../../../core/services/notification';

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
  private notification = inject(NotificationService);
  private dialog = inject(MatDialog);

  @ViewChild('deleteAttachmentDialog') deleteAttachmentDialog!: TemplateRef<any>;

  subTasks: SubTask[] = [];
  newSubTaskTitle: string = '';
  isAddingSubTask: boolean = false;
  subTaskDeletingId: string | null = null;

  attachments: TaskAttachment[] = [];
  isUploadingAttachment: boolean = false;
  isDeletingAttachment: boolean = false;
  attachmentToDelete: TaskAttachment | null = null;
  private activeDialogRef: MatDialogRef<any> | null = null;

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
    const title = this.newSubTaskTitle.trim();
    if (title === '' || !this.task?.id || this.isAddingSubTask) return;

    const taskId = this.task.id;
    this.isAddingSubTask = true;
    this.taskService.addSubTask(taskId, title).subscribe({
      next: (subTask) => {
        this.subTasks = [...this.subTasks, subTask];
        this.newSubTaskTitle = '';
        this.isAddingSubTask = false;
        this.notification.showSuccess('Alt görev eklendi.');
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Alt görev eklenirken hata oluştu:', err);
        this.isAddingSubTask = false;
        this.notification.showError(err.error?.error || 'Alt görev eklenirken bir hata oluştu.');
        this.cdr.detectChanges();
      }
    });
  }

  toggleSubTask(subTask: SubTask): void {
    if (!this.task?.id || !subTask.id) return;
    const taskId = this.task.id;
    const previousCompleted = subTask.completed;
    subTask.completed = !subTask.completed;

    this.taskService.updateSubTask(taskId, subTask.id, { title: subTask.title, completed: subTask.completed }).subscribe({
      next: (updated) => {
        subTask.completed = updated.completed;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Alt görev güncellenirken hata oluştu:', err);
        subTask.completed = previousCompleted;
        this.notification.showError(err.error?.error || 'Alt görev güncellenirken bir hata oluştu.');
        this.cdr.detectChanges();
      }
    });
  }

  removeSubTask(subTask: SubTask): void {
    if (!this.task?.id || !subTask.id || this.subTaskDeletingId) return;
    const taskId = this.task.id;
    const subTaskId = subTask.id;

    this.subTaskDeletingId = subTaskId;
    this.taskService.deleteSubTask(taskId, subTaskId).subscribe({
      next: () => {
        this.subTasks = this.subTasks.filter(st => st.id !== subTaskId);
        this.subTaskDeletingId = null;
        this.notification.showSuccess('Alt görev silindi.');
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Alt görev silinirken hata oluştu:', err);
        this.subTaskDeletingId = null;
        this.notification.showError(err.error?.error || 'Alt görev silinirken bir hata oluştu.');
        this.cdr.detectChanges();
      }
    });
  }

  // --- DOSYA EKİ (ATTACHMENT) FONKSİYONLARI ---
  loadAttachments(taskId: string): void {
    this.taskService.getAttachments(taskId).subscribe({
      next: (data) => {
        this.attachments = data;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Dosyalar yüklenirken hata oluştu:', err);
        this.notification.showError('Dosyalar yüklenirken bir hata oluştu.');
      }
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
        this.notification.showSuccess('Dosya yüklendi.');
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Dosya yüklenirken hata oluştu:', err);
        this.isUploadingAttachment = false;
        input.value = '';
        this.notification.showError(err.error?.error || 'Dosya yüklenirken bir hata oluştu.');
        this.cdr.detectChanges();
      }
    });
  }

  openDeleteAttachmentConfirm(attachment: TaskAttachment): void {
    this.attachmentToDelete = attachment;
    this.isDeletingAttachment = false;
    this.activeDialogRef = this.dialog.open(this.deleteAttachmentDialog, {
      width: '350px',
      maxWidth: '95vw'
    });

    this.activeDialogRef.afterClosed().subscribe(() => {
      this.attachmentToDelete = null;
    });
  }

  // "Evet, Sil" butonundan tetiklenir; silme bitmeden diyalog kapanmaz
  confirmDeleteAttachment(): void {
    if (!this.task?.id || !this.attachmentToDelete || this.isDeletingAttachment) return;
    const taskId = this.task.id;
    const attachment = this.attachmentToDelete;

    this.isDeletingAttachment = true;
    this.taskService.deleteAttachment(taskId, attachment.id).subscribe({
      next: () => {
        this.attachments = this.attachments.filter(a => a.id !== attachment.id);
        this.isDeletingAttachment = false;
        this.notification.showSuccess('Dosya silindi.');
        this.activeDialogRef?.close();
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Dosya silinirken hata oluştu:', err);
        this.isDeletingAttachment = false;
        this.notification.showError(err.error?.error || 'Dosya silinirken bir hata oluştu.');
        this.cdr.detectChanges();
      }
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
