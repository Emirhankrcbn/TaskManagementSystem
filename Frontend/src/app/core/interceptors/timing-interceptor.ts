import { HttpInterceptorFn } from '@angular/common/http';
import { finalize } from 'rxjs';

const SLOW_REQUEST_THRESHOLD_MS = 500;

// Her HTTP isteğinin süresini ölçer; eşiği (500ms) aşan istekleri konsola uyarı olarak yazar
export const timingInterceptor: HttpInterceptorFn = (req, next) => {
  const startTime = performance.now();

  return next(req).pipe(
    finalize(() => {
      const durationMs = Math.round(performance.now() - startTime);
      if (durationMs > SLOW_REQUEST_THRESHOLD_MS) {
        console.warn(`[Yavaş istek] ${req.method} ${req.url} - ${durationMs}ms`);
      }
    })
  );
};
