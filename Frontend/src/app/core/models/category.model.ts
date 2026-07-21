export interface Category {
  id?: string; // Backend Guid gönderdiği için string olmalı. (Yeni eklemede boş olacağı için '?' koyduk)
  name: string;
  color: string;
  description?: string;
  userId?: string; 
  createdAt?: string; 
}