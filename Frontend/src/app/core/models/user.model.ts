export interface User {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  role: 'Admin' | 'User'; 
  avatarUrl?: string; // "?" işareti bu alanın boş olabileceğini belirtir
  createdAt: string | Date;
}