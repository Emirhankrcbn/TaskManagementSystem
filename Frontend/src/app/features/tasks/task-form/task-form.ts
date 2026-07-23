import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MaterialModule } from '../../../shared/material.module';
import { Category } from '../../../core/models/category.model';
import { Task } from '../../../core/models/task.model';

export interface TaskFormValue {
  title: string;
  description: string;
  status: number;
  priority: number;
  categoryId: string | null;
  dueDate: Date | string | null;
}

@Component({
  selector: 'app-task-form',
  imports: [CommonModule, FormsModule, MaterialModule],
  templateUrl: './task-form.html',
  styleUrl: './task-form.scss'
})
export class TaskForm implements OnInit {
  @Input() categories: Category[] = [];
  @Input() task: Task | null = null; // dolu gelirse form düzenleme modunda açılır
  @Input() showSubmitButton: boolean = true;
  @Input() submitLabel: string = 'Ekle';

  // Standalone (oluşturma) modunda kullanılır: butona basınca tetiklenir
  @Output() save = new EventEmitter<TaskFormValue>();
  // Gömülü (düzenleme diyaloğu) modunda kullanılır: her alan değişiminde güncel değeri dışarı bildirir
  @Output() valueChange = new EventEmitter<TaskFormValue>();

  title: string = '';
  description: string = '';
  status: number = 1;
  priority: number = 2;
  categoryId: string | null = null;
  dueDate: Date | string | null = null;

  ngOnInit(): void {
    if (this.task) {
      this.title = this.task.title;
      this.description = this.task.description || '';
      this.status = this.task.status;
      this.priority = this.task.priority ?? 2;
      this.categoryId = this.task.categoryId ?? null;
      this.dueDate = this.task.dueDate ?? null;
    }
    this.emitValue();
  }

  onFieldChange(): void {
    this.emitValue();
  }

  private emitValue(): void {
    this.valueChange.emit(this.getValue());
  }

  getValue(): TaskFormValue {
    return {
      title: this.title,
      description: this.description,
      status: this.status,
      priority: this.priority,
      categoryId: this.categoryId,
      dueDate: this.dueDate
    };
  }

  onSubmit(): void {
    if (this.title.trim() === '') return;
    this.save.emit(this.getValue());
  }

  resetForm(): void {
    this.title = '';
    this.description = '';
    this.status = 1;
    this.priority = 2;
    this.categoryId = null;
    this.dueDate = null;
    this.emitValue();
  }
}
