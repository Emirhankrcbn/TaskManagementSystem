import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth';
import { RouterModule } from '@angular/router';

// Arayüzde kullanılan Angular Material modülleri
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatInputModule, MatButtonModule, MatCardModule, MatProgressSpinnerModule, RouterModule],
  templateUrl: './login.html',
  styleUrl: './login.scss',
})
export class Login {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);

  // form elemanlarını ve doğrulama kuralları
  loginForm: FormGroup = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]]
  });

  isLoading = false;
  errorMessage = '';

  // Butona basıldığında çalışacak fonksiyon
  onSubmit(): void {
    if (this.loginForm.valid && !this.isLoading) {
      this.isLoading = true;
      this.errorMessage = '';
      const credentials = this.loginForm.value;

      this.authService.login(credentials).subscribe({
        next: (response) => {
          console.log('Giriş başarılı!', response);
          // Giriş başarılıysa kullanıcıyı doğrudan görevler sayfasına yönlendir
          this.router.navigate(['/tasks']);
        },
        error: (err) => {
          console.error('Giriş başarısız:', err);
          this.errorMessage = err.error?.error || 'E-posta veya şifre hatalı.';
          this.isLoading = false;
        }
      });
    }
  }
}