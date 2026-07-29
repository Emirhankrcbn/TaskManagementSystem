// Production build bu dosyayı kullanır (development derlemesinde angular.json'daki
// fileReplacements ile environment.development.ts devreye girer).
// Aynı origin üzerinden reverse-proxy (örn. nginx /api -> backend) ile deploy edildiği
// varsayılıyor; gerçek bir alan adına özel ayrı bir origin gerekirse burası güncellenmeli.
export const environment = {
  production: true,
  apiUrl: '/api',
  baseUrl: ''
};
