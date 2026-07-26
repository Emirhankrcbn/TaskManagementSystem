import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http'; // withInterceptors EKLENDİ

import { routes } from './app.routes';
import { authInterceptor } from './core/interceptors/auth-interceptor';
import { timingInterceptor } from './core/interceptors/timing-interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    // HTTP istemcisine yazdığımız interceptor'ları tanıtıyoruz
    provideHttpClient(withInterceptors([authInterceptor, timingInterceptor]))
  ],
};