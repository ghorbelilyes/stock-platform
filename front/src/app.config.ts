import { provideHttpClient, withFetch } from '@angular/common/http';
import { APP_INITIALIZER, ApplicationConfig } from '@angular/core';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { provideRouter, withEnabledBlockingInitialNavigation, withInMemoryScrolling } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { provideTranslateHttpLoader } from '@ngx-translate/http-loader';
import Aura from '@primeuix/themes/aura';
import { providePrimeNG } from 'primeng/config';
import { appRoutes } from './app.routes';

/**
 * Initialize translations before app starts
 * This ensures translations are loaded before any components render
 */
export function initializeTranslations(translateService: TranslateService): () => Promise<void> {
    return () => {
        // Set default language and load translations
        translateService.setDefaultLang('en');
        
        // Try to get saved language from localStorage
        let savedLang = 'en';
        if (typeof window !== 'undefined' && window.localStorage) {
            try {
                const stored = localStorage.getItem('app_language');
                if (stored && (stored === 'en' || stored === 'de')) {
                    savedLang = stored;
                }
            } catch (e) {
                // Ignore localStorage errors
            }
        }
        
        // Use saved language or detect browser language
        let langToUse = savedLang;
        if (savedLang === 'en' && typeof window !== 'undefined' && window.navigator) {
            const browserLang = (navigator.language || navigator.languages?.[0] || '').toLowerCase();
            if (browserLang.startsWith('de')) {
                langToUse = 'de';
            }
        }
        
        // Load translations for the selected language
        return new Promise<void>((resolve) => {
            translateService.use(langToUse).subscribe({
                next: () => resolve(),
                error: () => resolve() // Resolve even on error to not block app startup
            });
        });
    };
}

export const appConfig: ApplicationConfig = {
    providers: [
        provideRouter(appRoutes, withInMemoryScrolling({ anchorScrolling: 'enabled', scrollPositionRestoration: 'enabled' }), withEnabledBlockingInitialNavigation()),
        provideHttpClient(withFetch()),
        provideAnimationsAsync(),
        providePrimeNG({ theme: { preset: Aura, options: { darkModeSelector: '.app-dark' } } }),
        // Configure TranslateModule for standalone components with HTTP loader
        TranslateModule.forRoot({
            defaultLanguage: 'en'
        }).providers!,
        // Provide HTTP loader for translations
        provideTranslateHttpLoader({
            prefix: '/assets/i18n/',
            suffix: '.json'
        }),
        // Initialize translations before app starts
        {
            provide: APP_INITIALIZER,
            useFactory: initializeTranslations,
            deps: [TranslateService],
            multi: true
        }
    ]
};
