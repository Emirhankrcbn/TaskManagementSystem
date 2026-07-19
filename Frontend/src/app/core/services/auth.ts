import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { TokenService } from './token';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private router = inject(Router);
  private http = inject(HttpClient);
  
  // Backend API adresimiz (İleride environment dosyasına taşıyacağız)
  private apiUrl = 'http://localhost:3000/api/auth'; 
  private tokenKey = 'auth_token';
  private tokenService = inject(TokenService);

  constructor() { }

  register(userData: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/register`, userData);
  }

  login(credentials: any): Observable<any> {
  return this.http.post<any>(`${this.apiUrl}/login`, credentials).pipe(
    tap(response => {
      // Artık tokenService'i kullanıyoruz
      if(response.token) {
         this.tokenService.saveToken(response.token);
      }
    })
  );
}

  logout(): void {
  // Token'ı akıllı servisimizi kullanarak siliyoruz
  this.tokenService.removeToken();
  this.router.navigate(['/login']);
}

  private setToken(token: string): void {
    localStorage.setItem(this.tokenKey, token);
  }

  getToken(): string | null {
    return localStorage.getItem(this.tokenKey);
  }

  isLoggedIn(): boolean {
  // Sadece token var mı diye değil, token GEÇERLİ Mİ diye bakıyoruz!
  return this.tokenService.isValid();
}
}