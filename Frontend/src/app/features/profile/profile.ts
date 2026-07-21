import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AuthService } from '../../core/services/auth';

@Component({
  selector: 'app-profile',
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './profile.html',
  styleUrl: './profile.scss',
})
export class Profile implements OnInit {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private cdr = inject(ChangeDetectorRef); // YENİ: Ekranı zorla güncellemek için dedektifimiz

  profileForm!: FormGroup;
  isLoading = false;
  successMessage = '';
  errorMessage = '';

  ngOnInit(): void {
    this.profileForm = this.fb.group({
      username: ['', Validators.required],
      firstName: [''],
      lastName: [''],
      email: ['', [Validators.required, Validators.email]],
      currentPassword: [''], 
      newPassword: ['']
    });

    this.loadUserProfile();
  }

  loadUserProfile(): void {
    console.log("1. İstek Backend'e doğru yola çıkıyor...");
    this.isLoading = true;
    
    this.authService.getProfile().subscribe({
      next: (data) => {
        console.log("2. Backend'den veri BAŞARIYLA geldi:", data);
        
        this.profileForm.patchValue({
          username: data.username,
          firstName: data.firstName,
          lastName: data.lastName,
          email: data.email
        });
        
        this.isLoading = false;
        
        // ANGULAR'A EKRANI ZORLA GÜNCELLEMESİNİ SÖYLÜYORUZ
        this.cdr.detectChanges(); 
      },
      error: (err) => {
        console.error("2. İstek sırasında HATA yaşandı:", err);
        this.errorMessage = 'Profil bilgileri yüklenemedi.';
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  onSubmit(): void {
    if (this.profileForm.invalid) {
      return;
    }

    this.isLoading = true;
    this.successMessage = '';
    this.errorMessage = '';

    const formData = this.profileForm.value;

    this.authService.updateProfile(formData).subscribe({
      next: (res) => {
        this.successMessage = 'Profilin başarıyla güncellendi!';
        this.isLoading = false;
        
        this.profileForm.patchValue({
          currentPassword: '',
          newPassword: ''
        });
        this.cdr.detectChanges(); // Ekranda başarı mesajını hemen göster
      },
      error: (err) => {
        this.errorMessage = err.error?.error || 'Güncelleme sırasında bir hata oluştu.';
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }
}