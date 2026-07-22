export interface Category {
  id?: string; 
  name: string;
  color: string;
  description?: string;
  userId?: string; 
  createdAt?: string; 
}

export interface CategoryCreateDto {
  name: string;
  description?: string;
  color?: string;
}

export interface CategoryUpdateDto {
  name: string;
  description?: string;
  color?: string;
}