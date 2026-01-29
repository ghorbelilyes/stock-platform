import { Injectable } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { BehaviorSubject, Observable } from 'rxjs';

export type SupportedLanguage = 'en' | 'de';

@Injectable({
    providedIn: 'root'
})
export class LanguageService {
    private readonly STORAGE_KEY = 'app_language';
    private readonly DEFAULT_LANGUAGE: SupportedLanguage = 'en';
    private readonly SUPPORTED_LANGUAGES: SupportedLanguage[] = ['en', 'de'];

    private currentLanguageSubject = new BehaviorSubject<SupportedLanguage>(this.DEFAULT_LANGUAGE);
    public currentLanguage$: Observable<SupportedLanguage> = this.currentLanguageSubject.asObservable();

    constructor(private translateService: TranslateService) {
        this.initializeLanguage();
    }

    /**
     * Initialize language on app startup
     * Priority: localStorage > browser language > default
     */
    private initializeLanguage(): void {
        const savedLanguage = this.getStoredLanguage();
        const browserLanguage = this.detectBrowserLanguage();
        const languageToUse = savedLanguage || browserLanguage || this.DEFAULT_LANGUAGE;

        this.setLanguage(languageToUse, false);
    }

    /**
     * Get language from localStorage
     */
    private getStoredLanguage(): SupportedLanguage | null {
        if (typeof window === 'undefined' || !window.localStorage) {
            return null;
        }

        try {
            const stored = localStorage.getItem(this.STORAGE_KEY);
            if (stored && this.isSupportedLanguage(stored)) {
                return stored as SupportedLanguage;
            }
        } catch (error) {
            console.warn('Failed to read language from localStorage:', error);
        }

        return null;
    }

    /**
     * Detect browser language and return supported language if available
     */
    private detectBrowserLanguage(): SupportedLanguage | null {
        if (typeof window === 'undefined' || !window.navigator) {
            return null;
        }

        const browserLang = (navigator.language || navigator.languages?.[0] || '').toLowerCase();
        
        // Check full language code (e.g., 'en-US', 'de-DE')
        const fullMatch = this.SUPPORTED_LANGUAGES.find(lang => browserLang.startsWith(lang));
        if (fullMatch) {
            return fullMatch;
        }

        // Check language code only (e.g., 'en', 'de')
        const langCode = browserLang.split('-')[0];
        if (this.isSupportedLanguage(langCode)) {
            return langCode as SupportedLanguage;
        }

        return null;
    }

    /**
     * Check if language is supported
     */
    private isSupportedLanguage(lang: string): boolean {
        return this.SUPPORTED_LANGUAGES.includes(lang as SupportedLanguage);
    }

    /**
     * Set application language
     * @param language - Language code to set
     * @param saveToStorage - Whether to persist to localStorage (default: true)
     */
    setLanguage(language: SupportedLanguage, saveToStorage: boolean = true): void {
        if (!this.isSupportedLanguage(language)) {
            console.warn(`Language "${language}" is not supported. Falling back to default.`);
            language = this.DEFAULT_LANGUAGE;
        }

        this.translateService.use(language);
        this.currentLanguageSubject.next(language);

        if (saveToStorage) {
            this.saveLanguageToStorage(language);
        }
    }

    /**
     * Save language to localStorage
     */
    private saveLanguageToStorage(language: SupportedLanguage): void {
        if (typeof window === 'undefined' || !window.localStorage) {
            return;
        }

        try {
            localStorage.setItem(this.STORAGE_KEY, language);
        } catch (error) {
            console.warn('Failed to save language to localStorage:', error);
        }
    }

    /**
     * Get current language
     */
    getCurrentLanguage(): SupportedLanguage {
        return this.currentLanguageSubject.value;
    }

    /**
     * Get all supported languages
     */
    getSupportedLanguages(): SupportedLanguage[] {
        return [...this.SUPPORTED_LANGUAGES];
    }

    /**
     * Get language display name
     */
    getLanguageDisplayName(language: SupportedLanguage): string {
        const names: Record<SupportedLanguage, string> = {
            en: 'English',
            de: 'Deutsch'
        };
        return names[language] || language;
    }
}
