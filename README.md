# Kişisel Görev Yönetim Sistemi (Task Management System)

Kullanıcıların günlük işlerini, projelerini ve hedeflerini organize etmelerine yardımcı olan tam
kapsamlı bir görev yönetim web uygulaması. .NET 9 Web API backend ve Angular 22 (zoneless) frontend
ile geliştirildi.

## Kimler İçin?

- **Bireysel kullanıcılar** — kişisel görevlerini takip etmek isteyenler
- **Öğrenciler** — ödevler, projeler, ders programı
- **Freelancer'lar** — proje ve müşteri işleri
- **Küçük işletmeler** — ekip içi görev dağılımı
- **Profesyoneller** — iş ve kariyer hedefleri

## Özellikler

- **Kullanıcı Yönetimi** — JWT tabanlı kayıt, giriş, profil görüntüleme/güncelleme
- **Görev Yönetimi** — oluşturma, düzenleme, silme, durum güncelleme, filtreleme, arama, sayfalama
- **Alt Görevler (Subtasks)** — bir görevin altına checklist maddeleri ekleme
- **Kategori Sistemi** — görevleri renkli etiketlerle gruplama
- **Öncelik Seviyeleri** — Düşük, Normal, Yüksek, Acil, Kritik
- **Durum Takibi** — Bekliyor, Devam Ediyor, Tamamlandı, İptal Edildi
- **Dosya Ekleme** — görevlere dosya yükleme/indirme/silme (max 10MB)
- **Yorum Sistemi** — görevlere not/yorum ekleme, düzenleme, silme
- **İstatistikler** — toplam/bekleyen/devam eden/tamamlanan görev sayıları, tamamlanma oranı, süresi geçmiş görevler
- **Soft Delete** — silinen görevler süresi geçmiş/istatistik hesaplarına dahil edilmiyor

## Kullanılan Teknolojiler

**Backend**
- .NET 9 Web API
- Entity Framework Core 9
- PostgreSQL (ana veritabanı) — Oracle desteği de mevcut (provider seçimi config'ten yapılır)
- JWT (Microsoft.AspNetCore.Authentication.JwtBearer) — kimlik doğrulama
- AutoMapper — entity/DTO dönüşümleri
- BCrypt.Net-Next — şifre hash'leme
- Serilog — konsol + dosya loglama
- Swashbuckle (Swagger) — API dokümantasyonu (sadece Development ortamında aktif)

**Frontend**
- Angular 22 (zoneless, standalone component'ler)
- Angular Material
- RxJS

**Altyapı**
- Docker + Docker Compose (postgres + backend + frontend/nginx)
- GitHub Actions — build, test, Docker Compose smoke test, ghcr.io'ya otomatik image push

## Proje Yapısı

