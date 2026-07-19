import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth';

// Angular Material modülleri
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatInputModule, MatButtonModule, MatCardModule],
  templateUrl: './register.html',
  styleUrl: './register.scss',
})
export class Register {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);

  // Form elemanları: İsim, E-posta ve Şifre
  registerForm: FormGroup = this.fb.group({
    name: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]]
  });

  onSubmit(): void {
    if (this.registerForm.valid) {
      const userData = this.registerForm.value;
      
      this.authService.register(userData).subscribe({
        next: (response) => {
          console.log('Kayıt başarılı!', response);
          // Kayıt başarılıysa giriş yapması için Login sayfasına yönlendiriyoruz
          this.router.navigate(['/login']);
        },
        error: (err) => {
          console.error('Kayıt başarısız:', err);
        }
      });
    }
  }
}