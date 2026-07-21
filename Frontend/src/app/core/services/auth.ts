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
  private tokenService = inject(TokenService);
  
  // Backend API adresimiz
  private apiUrl = 'http://localhost:5182/api/auth';
  
  // Zamanlayıcıyı hafızada tutacağımız değişken
  private logoutTimer: any;

  constructor() { }

  register(userData: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/register`, userData);
  }

  login(credentials: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/login`, credentials).pipe(
      tap(response => {
        if(response.token) {
           this.tokenService.saveToken(response.token);
           // Token kaydedildikten sonra otomatik çıkış sayacını başlat
           this.startAutoLogout();
        }
      })
    );
  }

  // --- YENİ EKLENEN METOTLAR BAŞLANGICI ---

  // Kullanıcı profil bilgilerini getirme
  getProfile(): Observable<any> {
    return this.http.get(`${this.apiUrl}/profile`);
  }

  // Kullanıcı profil bilgilerini güncelleme
  updateProfile(profileData: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/profile`, profileData);
  }

  // --- YENİ EKLENEN METOTLAR BİTİŞİ ---

  // Otomatik çıkışı başlatan fonksiyon
  startAutoLogout(): void {
    const remainingTime = this.tokenService.getTokenRemainingTime();
    
    if (remainingTime > 0) {
      // Süre dolduğunda logout fonksiyonunu otomatik tetikle
      this.logoutTimer = setTimeout(() => {
        console.warn('Oturum süresi doldu, otomatik çıkış yapılıyor.');
        this.logout();
      }, remainingTime);
    }
  }

  logout(): void {
    // Çıkış yapıldığında arka planda çalışan sayacı durdur
    if (this.logoutTimer) {
      clearTimeout(this.logoutTimer);
    }

    // Token'ı akıllı servisimizi kullanarak sil
    this.tokenService.removeToken();
    this.router.navigate(['/login']);
  }

  isLoggedIn(): boolean {
    // token var mı, token GEÇERLİ Mİ diye bakıyoruz
    return this.tokenService.isValid();
  }
}