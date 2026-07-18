import { Injectable } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { throwError, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ErrorHandlingService {

  constructor() { }

  // Hataları yakalayıp  mesaja çeviren fonksiyon
  handleError(error: HttpErrorResponse): Observable<never> {
    let errorMessage = 'Bilinmeyen bir hata oluştu!';

    if (error.error instanceof ErrorEvent) {
      // İstemci tarafı (Client-side) veya ağ hataları
      errorMessage = `Hata: ${error.error.message}`;
    } else {
      // Sunucu tarafı (Server-side) hataları
      switch (error.status) {
        case 400:
          errorMessage = 'Geçersiz istek! Lütfen girdiğiniz bilgileri kontrol edin.';
          break;
        case 401:
          errorMessage = 'Oturum süreniz dolmuş veya yetkisiz erişim denemesi!';
          break;
        case 403:
          errorMessage = 'Bu işlemi gerçekleştirmeye yetkiniz bulunmuyor.';
          break;
        case 404:
          errorMessage = 'İstenen kayıt veya sayfa bulunamadı!';
          break;
        case 500:
          errorMessage = 'Sunucuda bir hata oluştu, lütfen daha sonra tekrar deneyin.';
          break;
        default:
          errorMessage = `Sunucu Hatası Kodu: ${error.status}\nMesaj: ${error.message}`;
      }
    }

    // Konsola teknik detayı yazdır (Geliştirici için)
    console.error('Sistem Hatası Yakalandı:', error);

    // Hatayı uygulamaya fırlat
    return throwError(() => new Error(errorMessage));
  }
}