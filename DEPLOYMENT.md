# Deployment Hazırlığı

Bu doküman, staj test dosyasındaki "Deployment Hazırlığı" bölümünün durumunu özetler.


## 1. Production build yapılandırması ✅

**Frontend:** `ng build` (varsayılan config production) daha önce bundle boyutu limitini (1MB) aşarak
**başarısız** oluyordu. Sebep: hiçbir route lazy-load edilmiyordu, tüm sayfalar tek bir `main.js`
içine gömülüyordu. `app.routes.ts`'teki tüm rotalar `loadComponent()` ile lazy-load edilecek şekilde
güncellendi; ilk paket 1.13MB'tan 931KB'a düştü, build artık başarıyla tamamlanıyor.

```bash
cd Frontend
npm run build          # production (varsayılan)
```

**Backend:**

```bash
cd Backend/TaskManagement.API
dotnet publish -c Release -o ./publish
```

## 2. Environment variable'ları ayarla ✅

**Frontend** — Angular derleme zamanında statik dosyalar ürettiği için "runtime environment variable"
kavramı yok; bunun yerine derleme zamanı yapılandırması (`src/environments/`) kullanılıyor:
- `environment.ts` → production build'in kullandığı dosya. Artık `apiUrl: '/api'`, `baseUrl: ''`
  (aynı origin üzerinden reverse-proxy ile deploy edileceği varsayılıyor — nginx gibi bir proxy
  `/api/*` isteklerini backend'e yönlendirmeli). Daha önce bu dosya da `http://localhost:5182` gibi
  hardcoded bir adrese işaret ediyordu ve `TaskService`/`CategoryService`/`AuthService` bu dosyayı
  hiç kullanmadan kendi içlerinde ayrı ayrı `localhost:5182`'yi hardcoded tutuyordu — üçü de artık
  `environment.ts`'ten okuyor.
- `environment.development.ts` → sadece `ng serve`/`--configuration development` build'inde devreye
  girer, `http://localhost:5182` değerini korur.
- Gerçek bir alan adına (subdomain'e) deploy edilecekse `environment.ts`'teki `apiUrl`/`baseUrl`
  güncellenmeli.

**Backend** — ASP.NET Core, `appsettings.json` → `appsettings.{Environment}.json` →
**environment variable'lar** sırasıyla config okur, sonraki her zaman öncekini ezer. Yani production'da
gerçek sırlar hiçbir dosyaya yazılmadan, sadece environment variable olarak set edilmeli:

| Environment Variable | appsettings.json'daki karşılığı |
|---|---|
| `ConnectionStrings__PostgreSQLConnection` | `ConnectionStrings:PostgreSQLConnection` |
| `Jwt__Key` | `Jwt:Key` (en az 32 karakter, rastgele üretilmiş bir değer olmalı) |
| `Jwt__Issuer` | `Jwt:Issuer` |
| `Jwt__Audience` | `Jwt:Audience` |
| `ASPNETCORE_ENVIRONMENT` | `Production` olarak set edilmeli ki `appsettings.Production.json` devreye girsin |

(Çift alt çizgi `__`, ASP.NET Core'un iç içe config anahtarları için environment variable'larda
kullandığı standart ayraçtır.)

## 3. Database connection string'lerini güvenli hale getir ✅

- `appsettings.json`'daki değerler zaten placeholder (`CHANGE_ME`) — repoya gerçek sır commit'lenmiyor.
- `appsettings.Development.json` (gerçek yerel şifreyi içerir) zaten `.gitignore`'da; ayrıca
  **`dotnet publish` çıktısına da artık kopyalanmıyor** (`.csproj`'a `CopyToPublishDirectory: Never`
  eklendi) — daha önce bu dosya publish klasörüne kopyalanıyordu, yani biri publish çıktısını
  sunucuya taşısaydı gerçek DB şifresi diskte düz metin olarak dolaşırdı. Bu artık mümkün değil.
- Production'da gerçek sır **sadece** yukarıdaki environment variable'lardan gelir.
- **Öneri (hosting sağlayıcısına bağlı):** Production bağlantı dizesine `SSL Mode=Require` eklenmesi
  önerilir (örn. Azure Database for PostgreSQL bunu zorunlu kılar). Kesin değer, gerçek hosting
  sağlayıcısı netleşince belirlenmeli.

## 4. SSL sertifika yapılandırması ✅

Mentordan onay geldi: hedef platform Docker. `frontend` container'ı (nginx) şu an sadece HTTP (80)
üzerinden yayın yapıyor; gerçek bir sunucuya deploy edilirken nginx'in önüne bir reverse-proxy/ingress
(örn. Caddy, Traefik, ya da bulut sağlayıcısının kendi load balancer'ı) konup Let's Encrypt ile TLS
sonlandırması oradan yapılması öneriliyor — sertifika yönetimini uygulama katmanından ayırmak,
container image'larını sadeleştiriyor. Backend zaten HTTPS'i `UseHttpsRedirection()` ile teşvik ediyor
ama container içinde sertifika bağlamıyor; TLS terminasyonu proxy katmanında yapılacaksa bu ayar
kod tarafında değiştirilmesine gerek bırakmıyor.

## 5. Deployment scriptleri ✅

Docker Compose ile tek komutla ayağa kalkacak şekilde kuruldu:

```bash
cp .env.example .env   # gerçek DB şifresi / JWT anahtarı ile doldur
docker compose up -d --build
```

- `docker-compose.yml` → `postgres` + `backend` + `frontend` (nginx) servisleri, DB ve upload
  verisi için kalıcı volume'lar, `postgres` sağlıklı olana kadar `backend`'in beklemesi.
- `backend`'de `RunMigrationsOnStartup=true` set edildiği için container ayağa kalkarken migration'lar
  otomatik uygulanıyor (yerel `dotnet run` akışını etkilemiyor, sadece Docker Compose ortamında aktif).
- `.github/workflows/ci-cd.yml` → her push/PR'da backend build, frontend build+test; `main`'e push'ta
  ayrıca backend/frontend Docker image'ları GitHub Container Registry'ye (`ghcr.io`) otomatik push
  ediliyor (ekstra registry secret'ı gerekmiyor, GitHub'ın kendi `GITHUB_TOKEN`'ı yeterli).
