import { Component, Input, Output, EventEmitter, OnInit, TemplateRef, ViewChild, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpEventType } from '@angular/common/http';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { MaterialModule } from '../../../shared/material.module';
import { TaskForm, TaskFormValue } from '../task-form/task-form';
import { TaskService } from '../../../core/services/task';
import { Category } from '../../../core/models/category.model';
import { Task, SubTask, TaskAttachment, TaskComment } from '../../../core/models/task.model';
import { NotificationService } from '../../../core/services/notification';
import { TokenService } from '../../../core/services/token';

// Yüklenmekte olan bir dosyanın anlık ilerleme durumunu tutar (henüz sunucudan attachment dönmedi)
interface UploadingFile {
  id: string;
  name: string;
  progress: number;
  error?: string;
}

// Backend'deki AllowedAttachmentExtensions ile birebir aynı liste (client tarafında erken uyarı için)
const ALLOWED_ATTACHMENT_EXTENSIONS = [
  '.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp',
  '.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx',
  '.txt', '.csv', '.zip', '.rar'
];
const MAX_ATTACHMENT_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB

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
  private tokenService = inject(TokenService);

  @ViewChild('deleteAttachmentDialog') deleteAttachmentDialog!: TemplateRef<any>;
  @ViewChild('deleteCommentDialog') deleteCommentDialog!: TemplateRef<any>;

  subTasks: SubTask[] = [];
  newSubTaskTitle: string = '';
  isAddingSubTask: boolean = false;
  subTaskDeletingId: string | null = null;

  attachments: TaskAttachment[] = [];
  uploadingFiles: UploadingFile[] = [];
  isDraggingOverAttachments: boolean = false;
  isDeletingAttachment: boolean = false;
  attachmentToDelete: TaskAttachment | null = null;
  private activeDialogRef: MatDialogRef<any> | null = null;
  private uploadIdCounter = 0;

  comments: TaskComment[] = [];
  newCommentContent: string = '';
  isAddingComment: boolean = false;
  editingCommentId: string | null = null;
  editingCommentContent: string = '';
  isSavingCommentEdit: boolean = false;
  isDeletingComment: boolean = false;
  commentToDelete: TaskComment | null = null;
  currentUserId: string | null = null;

  ngOnInit(): void {
    this.subTasks = this.task?.subTasks ? [...this.task.subTasks] : [];
    this.currentUserId = this.tokenService.getUserId();
    if (this.task?.id) {
      this.loadAttachments(this.task.id);
      this.loadComments(this.task.id);
    }
  }

  onFormValueChange(value: TaskFormValue): void {
    this.valueChange.emit(value);
  }

  // *ngFor trackBy: liste öğeleri değiştiğinde tüm DOM'un değil sadece gerçekten değişen satırların yeniden oluşturulmasını sağlar
  trackById(index: number, item: { id?: string }): string {
    return item.id ?? index.toString();
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
    if (!input.files || input.files.length === 0) return;

    this.uploadFiles(input.files);
    input.value = ''; // aynı dosyaları tekrar seçebilmek için input'u temizle
  }

  onAttachmentDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDraggingOverAttachments = true;
  }

  onAttachmentDragLeave(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDraggingOverAttachments = false;
  }

  onAttachmentDrop(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDraggingOverAttachments = false;
    if (event.dataTransfer?.files?.length) {
      this.uploadFiles(event.dataTransfer.files);
    }
  }

  // Dosya uzantısına göre küçük harf bir uzantı döner (nokta dahil), örn: ".pdf"
  private getExtension(fileName: string): string {
    const dotIndex = fileName.lastIndexOf('.');
    return dotIndex >= 0 ? fileName.substring(dotIndex).toLowerCase() : '';
  }

  // Backend ile aynı kurallara göre erken (sunucuya gitmeden) doğrulama yapar
  private validateFile(file: File): string | null {
    if (file.size > MAX_ATTACHMENT_SIZE_BYTES) {
      return `"${file.name}" 10 MB sınırını aşıyor.`;
    }
    const extension = this.getExtension(file.name);
    if (!extension || !ALLOWED_ATTACHMENT_EXTENSIONS.includes(extension)) {
      return `"${file.name}" desteklenmeyen bir dosya türü (${extension || 'uzantısız'}).`;
    }
    return null;
  }

  private uploadFiles(fileList: FileList): void {
    if (!this.task?.id) return;
    const taskId = this.task.id;

    Array.from(fileList).forEach(file => {
      const validationError = this.validateFile(file);
      if (validationError) {
        this.notification.showError(validationError);
        return;
      }
      this.uploadOneFile(taskId, file);
    });
  }

  private uploadOneFile(taskId: string, file: File): void {
    const uploadEntry: UploadingFile = {
      id: `upload-${++this.uploadIdCounter}`,
      name: file.name,
      progress: 0
    };
    this.uploadingFiles = [...this.uploadingFiles, uploadEntry];

    this.taskService.uploadAttachment(taskId, file).subscribe({
      next: (event) => {
        if (event.type === HttpEventType.UploadProgress && event.total) {
          uploadEntry.progress = Math.round((100 * event.loaded) / event.total);
          this.cdr.detectChanges();
        } else if (event.type === HttpEventType.Response && event.body) {
          this.attachments = [event.body, ...this.attachments];
          this.uploadingFiles = this.uploadingFiles.filter(u => u.id !== uploadEntry.id);
          this.notification.showSuccess(`"${file.name}" yüklendi.`);
          this.cdr.detectChanges();
        }
      },
      error: (err) => {
        console.error('Dosya yüklenirken hata oluştu:', err);
        this.uploadingFiles = this.uploadingFiles.filter(u => u.id !== uploadEntry.id);
        this.notification.showError(err.error?.error || `"${file.name}" yüklenirken bir hata oluştu.`);
        this.cdr.detectChanges();
      }
    });
  }

  // Uzantıya göre Material ikon adı döner
  getFileIcon(fileName: string): string {
    const extension = this.getExtension(fileName);
    if (['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp'].includes(extension)) return 'image';
    if (extension === '.pdf') return 'picture_as_pdf';
    if (['.doc', '.docx'].includes(extension)) return 'description';
    if (['.xls', '.xlsx', '.csv'].includes(extension)) return 'grid_on';
    if (['.ppt', '.pptx'].includes(extension)) return 'slideshow';
    if (['.zip', '.rar'].includes(extension)) return 'folder_zip';
    if (extension === '.txt') return 'article';
    return 'insert_drive_file';
  }

  isImageAttachment(attachment: TaskAttachment): boolean {
    if (attachment.contentType?.startsWith('image/')) return true;
    return ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp'].includes(this.getExtension(attachment.fileName));
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

  // --- YORUM (COMMENT) FONKSİYONLARI ---
  loadComments(taskId: string): void {
    this.taskService.getComments(taskId).subscribe({
      next: (data) => {
        this.comments = data;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Yorumlar yüklenirken hata oluştu:', err);
        this.notification.showError('Yorumlar yüklenirken bir hata oluştu.');
      }
    });
  }

  addComment(): void {
    const content = this.newCommentContent.trim();
    if (content === '' || !this.task?.id || this.isAddingComment) return;

    const taskId = this.task.id;
    this.isAddingComment = true;
    this.taskService.addComment(taskId, content).subscribe({
      next: (comment) => {
        this.comments = [comment, ...this.comments];
        this.newCommentContent = '';
        this.isAddingComment = false;
        this.notification.showSuccess('Yorum eklendi.');
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Yorum eklenirken hata oluştu:', err);
        this.isAddingComment = false;
        this.notification.showError(err.error?.error || 'Yorum eklenirken bir hata oluştu.');
        this.cdr.detectChanges();
      }
    });
  }

  isOwnComment(comment: TaskComment): boolean {
    return !!this.currentUserId && comment.userId === this.currentUserId;
  }

  startEditComment(comment: TaskComment): void {
    this.editingCommentId = comment.id;
    this.editingCommentContent = comment.content;
  }

  cancelEditComment(): void {
    this.editingCommentId = null;
    this.editingCommentContent = '';
  }

  saveEditComment(comment: TaskComment): void {
    const content = this.editingCommentContent.trim();
    if (content === '' || !this.task?.id || this.isSavingCommentEdit) return;

    const taskId = this.task.id;
    this.isSavingCommentEdit = true;
    this.taskService.updateComment(taskId, comment.id, content).subscribe({
      next: (updated) => {
        const index = this.comments.findIndex(c => c.id === comment.id);
        if (index !== -1) this.comments[index] = updated;
        this.isSavingCommentEdit = false;
        this.editingCommentId = null;
        this.editingCommentContent = '';
        this.notification.showSuccess('Yorum güncellendi.');
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Yorum güncellenirken hata oluştu:', err);
        this.isSavingCommentEdit = false;
        this.notification.showError(err.error?.error || 'Yorum güncellenirken bir hata oluştu.');
        this.cdr.detectChanges();
      }
    });
  }

  openDeleteCommentConfirm(comment: TaskComment): void {
    this.commentToDelete = comment;
    this.isDeletingComment = false;
    this.activeDialogRef = this.dialog.open(this.deleteCommentDialog, {
      width: '350px',
      maxWidth: '95vw'
    });

    this.activeDialogRef.afterClosed().subscribe(() => {
      this.commentToDelete = null;
    });
  }

  confirmDeleteComment(): void {
    if (!this.task?.id || !this.commentToDelete || this.isDeletingComment) return;
    const taskId = this.task.id;
    const comment = this.commentToDelete;

    this.isDeletingComment = true;
    this.taskService.deleteComment(taskId, comment.id).subscribe({
      next: () => {
        this.comments = this.comments.filter(c => c.id !== comment.id);
        this.isDeletingComment = false;
        this.notification.showSuccess('Yorum silindi.');
        this.activeDialogRef?.close();
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Yorum silinirken hata oluştu:', err);
        this.isDeletingComment = false;
        this.notification.showError(err.error?.error || 'Yorum silinirken bir hata oluştu.');
        this.cdr.detectChanges();
      }
    });
  }

  // Yorum zamanını "3 dakika önce" gibi göreceli bir metne çevirir
  formatRelativeTime(dateStr: string): string {
    const date = new Date(dateStr);
    const diffMs = Date.now() - date.getTime();
    const diffSec = Math.round(diffMs / 1000);

    if (diffSec < 60) return 'az önce';
    const diffMin = Math.round(diffSec / 60);
    if (diffMin < 60) return `${diffMin} dakika önce`;
    const diffHour = Math.round(diffMin / 60);
    if (diffHour < 24) return `${diffHour} saat önce`;
    const diffDay = Math.round(diffHour / 24);
    if (diffDay < 30) return `${diffDay} gün önce`;
    return date.toLocaleDateString('tr-TR');
  }
}
