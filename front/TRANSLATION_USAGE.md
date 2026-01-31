# Translation System Usage Guide

This project uses `@ngx-translate/core` for multi-language support with English (en) and German (de).

## Setup

The translation system is already configured in `app.config.ts` and will automatically:
- Detect browser language on first load
- Persist language preference in localStorage
- Initialize before app bootstrap

## Required NPM Packages

The following packages are already installed:
- `@ngx-translate/core` (v17.0.0)
- `@ngx-translate/http-loader` (v17.0.0)

## Folder Structure

```
front/src/
├── assets/
│   └── i18n/
│       ├── en.json          # English translations
│       └── de.json          # German translations
└── app/
    └── shared/
        ├── components/
        │   └── language-switcher/
        │       └── language-switcher.component.ts
        └── services/
            └── language.service.ts
```

## Using Translations in HTML Templates

### Basic Usage with Translate Pipe

```html
<!-- Simple translation -->
<h1>{{ 'app.title' | translate }}</h1>

<!-- Translation with parameters -->
<p>{{ 'errors.minLength' | translate: {min: 5} }}</p>

<!-- In attributes -->
<button [title]="'common.save' | translate">
    {{ 'common.save' | translate }}
</button>

<!-- With PrimeNG components -->
<p-button [label]="'common.save' | translate"></p-button>
```

### Example Component Template

```typescript
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';

@Component({
    selector: 'app-example',
    standalone: true,
    imports: [CommonModule, TranslateModule],
    template: `
        <div>
            <h1>{{ 'navigation.dashboard' | translate }}</h1>
            <p>{{ 'dashboard.overview' | translate }}</p>
            <button (click)="save()">
                {{ 'common.save' | translate }}
            </button>
        </div>
    `
})
export class ExampleComponent {
    save() {
        // Implementation
    }
}
```

## Using Translations in TypeScript Files

### Using TranslateService.get() (Async)

```typescript
import { Component, OnInit } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';

@Component({
    selector: 'app-example',
    standalone: true,
    template: `<div>{{ message }}</div>`
})
export class ExampleComponent implements OnInit {
    message: string = '';

    constructor(private translateService: TranslateService) {}

    ngOnInit(): void {
        // Async translation - use when you need to wait for translation to load
        this.translateService.get('common.welcome').subscribe((translation: string) => {
            this.message = translation;
        });

        // With parameters
        this.translateService.get('errors.minLength', { min: 5 }).subscribe((translation: string) => {
            console.log(translation);
        });

        // Multiple keys
        this.translateService.get(['common.save', 'common.cancel']).subscribe((translations: any) => {
            console.log(translations['common.save']);
            console.log(translations['common.cancel']);
        });
    }
}
```

### Using TranslateService.instant() (Synchronous)

```typescript
import { Component } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';

@Component({
    selector: 'app-example',
    standalone: true,
    template: `<div>{{ message }}</div>`
})
export class ExampleComponent {
    message: string = '';

    constructor(private translateService: TranslateService) {
        // Synchronous translation - use only after translations are loaded
        // Warning: Returns key if translation not loaded yet
        this.message = this.translateService.instant('common.welcome');

        // With parameters
        const errorMsg = this.translateService.instant('errors.minLength', { min: 5 });
    }

    showError(): void {
        const error = this.translateService.instant('errors.generic');
        alert(error);
    }
}
```

### Complete Example Component

```typescript
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { ButtonModule } from 'primeng/button';

@Component({
    selector: 'app-product-form',
    standalone: true,
    imports: [CommonModule, TranslateModule, ButtonModule],
    template: `
        <form>
            <h2>{{ 'inventory.addProduct' | translate }}</h2>
            <p-button 
                [label]="'common.save' | translate"
                (onClick)="onSave()">
            </p-button>
            <p-button 
                [label]="'common.cancel' | translate"
                (onClick)="onCancel()">
            </p-button>
        </form>
    `
})
export class ProductFormComponent implements OnInit {
    saveButtonLabel: string = '';
    cancelButtonLabel: string = '';

    constructor(private translateService: TranslateService) {}

    ngOnInit(): void {
        // Load translations for TypeScript usage
        this.translateService.get(['common.save', 'common.cancel']).subscribe((translations: any) => {
            this.saveButtonLabel = translations['common.save'];
            this.cancelButtonLabel = translations['common.cancel'];
        });
    }

    onSave(): void {
        const successMsg = this.translateService.instant('messages.saveSuccess');
        // Show success message
        console.log(successMsg);
    }

    onCancel(): void {
        const confirmMsg = this.translateService.instant('messages.unsavedChanges');
        if (confirm(confirmMsg)) {
            // Cancel action
        }
    }
}
```

## Language Service Usage

### Getting Current Language

```typescript
import { LanguageService } from '@app/shared/services/language.service';

constructor(private languageService: LanguageService) {
    const currentLang = this.languageService.getCurrentLanguage(); // 'en' | 'de'
    
    // Subscribe to language changes
    this.languageService.currentLanguage$.subscribe(lang => {
        console.log('Language changed to:', lang);
    });
}
```

### Changing Language Programmatically

```typescript
import { LanguageService } from '@app/shared/services/language.service';

constructor(private languageService: LanguageService) {}

switchToGerman(): void {
    this.languageService.setLanguage('de');
}

switchToEnglish(): void {
    this.languageService.setLanguage('en');
}
```

### Getting Supported Languages

```typescript
import { LanguageService } from '@app/shared/services/language.service';

constructor(private languageService: LanguageService) {
    const supported = this.languageService.getSupportedLanguages(); // ['en', 'de']
    const displayName = this.languageService.getLanguageDisplayName('de'); // 'Deutsch'
}
```

## Adding New Translations

### 1. Add to JSON Files

**en.json:**
```json
{
  "myFeature": {
    "title": "My Feature",
    "description": "Feature description"
  }
}
```

**de.json:**
```json
{
  "myFeature": {
    "title": "Meine Funktion",
    "description": "Funktionsbeschreibung"
  }
}
```

### 2. Use in Templates

```html
<h1>{{ 'myFeature.title' | translate }}</h1>
<p>{{ 'myFeature.description' | translate }}</p>
```

### 3. Use in TypeScript

```typescript
this.translateService.get('myFeature.title').subscribe(title => {
    console.log(title);
});
```

## Adding a New Language

### 1. Create Translation File

Create `/assets/i18n/fr.json` (for French example):

```json
{
  "app": {
    "title": "Orchestrateur d'Inventaire Intelligent"
  }
}
```

### 2. Update LanguageService

```typescript
// In language.service.ts
export type SupportedLanguage = 'en' | 'de' | 'fr';
private readonly SUPPORTED_LANGUAGES: SupportedLanguage[] = ['en', 'de', 'fr'];

getLanguageDisplayName(language: SupportedLanguage): string {
    const names: Record<SupportedLanguage, string> = {
        en: 'English',
        de: 'Deutsch',
        fr: 'Français'
    };
    return names[language] || language;
}
```

### 3. Update Language Switcher

The language switcher will automatically pick up the new language from the service.

## Best Practices

1. **Always use translation keys** - Never hard-code strings in templates or TypeScript
2. **Use nested keys** - Organize translations by feature/module (e.g., `inventory.addProduct`)
3. **Use parameters** - For dynamic content, use parameters: `{{ 'errors.minLength' | translate: {min: 5} }}`
4. **Prefer async get()** - Use `translateService.get()` when translations might not be loaded yet
5. **Use instant() carefully** - Only use `instant()` after translations are guaranteed to be loaded
6. **Keep keys consistent** - Use consistent naming conventions across all translation files
7. **Test all languages** - Always test your app in all supported languages

## Language Switcher Component

The language switcher is already integrated into the topbar. It provides:
- Dropdown with language options
- Flag icons for visual identification
- Automatic persistence of language choice
- Reactive updates across the app

## Troubleshooting

### Translations not showing
- Ensure `TranslateModule` is imported in your component
- Check that translation keys exist in both JSON files
- Verify JSON files are in `/assets/i18n/` directory

### Language not persisting
- Check browser localStorage is enabled
- Verify `LanguageService` is properly injected

### Translation keys missing
- Ensure keys are identical in all language files
- Check for typos in key names
- Verify JSON syntax is valid
