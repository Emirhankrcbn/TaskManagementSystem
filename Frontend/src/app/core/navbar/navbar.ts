import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive, Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs';
import { MaterialModule } from '../../shared/material.module';
import { AuthService } from '../services/auth';
import { ThemeService } from '../services/theme';

@Component({
  selector: 'app-navbar',
  imports: [CommonModule, MaterialModule, RouterLink, RouterLinkActive],
  templateUrl: './navbar.html',
  styleUrl: './navbar.scss'
})
export class Navbar implements OnInit {
  authService = inject(AuthService);
  themeService = inject(ThemeService);
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);

  displayName: string = '';
  private profileLoaded = false;

  ngOnInit() {
    this.refreshUser();
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe(() => {
      this.refreshUser();
      this.cdr.detectChanges();
    });
  }

  private refreshUser() {
    if (!this.authService.isLoggedIn()) {
      this.profileLoaded = false;
      this.displayName = '';
      return;
    }

    if (this.profileLoaded) return;

    this.authService.getProfile().subscribe({
      next: (data) => {
        this.displayName = data.firstName ? `${data.firstName} ${data.lastName}` : data.username;
        this.profileLoaded = true;
        this.cdr.detectChanges();
      },
      error: (err) => console.error('Kullanıcı bilgisi alınırken hata oluştu:', err)
    });
  }

  toggleTheme(): void {
    this.themeService.toggleTheme();
  }

  onLogout(): void {
    this.authService.logout();
  }
}
