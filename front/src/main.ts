import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app.config';
import { AppComponent } from './app.component';

// Initialize language before app bootstrap
// The LanguageService will be initialized when first injected,
// which ensures language is set before components render
bootstrapApplication(AppComponent, appConfig).catch((err) => console.error(err));
