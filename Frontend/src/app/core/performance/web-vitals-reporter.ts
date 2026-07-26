import { onCLS, onFCP, onINP, onLCP, onTTFB, Metric } from 'web-vitals';

// Temel Web Vitals metriklerini (CLS, FCP, INP, LCP, TTFB) tarayıcı konsoluna raporlar.
// Yalnızca teşhis amaçlıdır; bir sunucuya/analitik servisine gönderim yapılmaz.
function logMetric(metric: Metric): void {
  console.log(`[Web Vitals] ${metric.name}: ${Math.round(metric.value)} (${metric.rating})`);
}

export function reportWebVitals(): void {
  onCLS(logMetric);
  onFCP(logMetric);
  onINP(logMetric);
  onLCP(logMetric);
  onTTFB(logMetric);
}
