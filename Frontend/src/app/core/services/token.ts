import { Injectable } from '@angular/core';
import { jwtDecode } from 'jwt-decode';

@Injectable({
  providedIn: 'root'
})
export class TokenService {
  // LocalStorage'da kullanılacak anahtar kelime
  private readonly TOKEN_KEY = 'auth_token';

  constructor() { }

  // Token'ı kaydetme
  saveToken(token: string): void {
    localStorage.setItem(this.TOKEN_KEY, token);
  }

  // Token'ı getirme
  getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  // Token'ı silme (Logout işlemi için)
  removeToken(): void {
    localStorage.removeItem(this.TOKEN_KEY);
  }

  // Token'ın geçerli olup olmadığını (süresinin dolup dolmadığını) kontrol etme
  isValid(): boolean {
    const token = this.getToken();
    
    // Token yoksa zaten geçersizdir
    if (!token) {
      return false;
    }

    try {
      // Token'ı çöz ve içindeki exp değerini al
      const decoded: any = jwtDecode(token);
      
      if (decoded.exp === undefined) {
        return true; // Süre sınırı yoksa geçerli say
      }
      
      // decoded.exp saniye cinsindendir, milisaniyeye çevirip şu anki zamanla kıyaslıyoruz
      const expirationDate = decoded.exp * 1000;
      const now = new Date().getTime();
      
      return expirationDate > now; // Süre dolmadıysa true döner
    } catch (error) {
      // Token bozuksa/çözülemiyorsa geçersiz say
      console.error('Token çözülürken hata oluştu:', error);
      return false;
    }
  }
}