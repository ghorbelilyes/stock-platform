import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { SelectModule } from 'primeng/select';
import { LanguageService, SupportedLanguage } from '../../services/language.service';

interface LanguageOption {
    label: string;
    value: SupportedLanguage;
    flag: string;
}

@Component({
    selector: 'app-language-switcher',
    standalone: true,
    imports: [CommonModule, FormsModule, TranslateModule, SelectModule],
    template: `
        <div class="language-switcher">
            <p-select
                [options]="languageOptions"
                [(ngModel)]="selectedLanguage"
                (onChange)="onLanguageChange($event)"
                optionLabel="label"
                [style]="{ width: '140px' }"
                [appendTo]="'body'"
            >
                <ng-template let-option pTemplate="selectedItem">
                    <div class="flex align-items-center gap-2">
                        <span class="text-lg">{{ option.flag }}</span>
                        <span class="text-sm">{{ option.label }}</span>
                    </div>
                </ng-template>
                <ng-template let-option pTemplate="item">
                    <div class="flex align-items-center gap-2">
                        <span class="text-lg">{{ option.flag }}</span>
                        <span>{{ option.label }}</span>
                    </div>
                </ng-template>
            </p-select>
        </div>
    `,
    styles: [
        `
            .language-switcher {
                display: flex;
                align-items: center;
            }

            :host ::ng-deep .p-select {
                border: none;
                background: transparent;
            }

            :host ::ng-deep .p-select-trigger {
                color: var(--text-color);
            }

            :host ::ng-deep .p-select:not(.p-disabled):hover {
                background: var(--surface-hover);
            }
        `
    ]
})
export class LanguageSwitcherComponent implements OnInit {
    languageOptions: LanguageOption[] = [];
    selectedLanguage: LanguageOption | null = null;

    constructor(private languageService: LanguageService) {}

    ngOnInit(): void {
        const supportedLanguages = this.languageService.getSupportedLanguages();
        
        this.languageOptions = supportedLanguages.map(lang => ({
            label: this.languageService.getLanguageDisplayName(lang),
            value: lang,
            flag: this.getLanguageFlag(lang)
        }));

        const currentLang = this.languageService.getCurrentLanguage();
        this.selectedLanguage = this.languageOptions.find(opt => opt.value === currentLang) || this.languageOptions[0];

        // Subscribe to language changes to update dropdown
        this.languageService.currentLanguage$.subscribe(lang => {
            const option = this.languageOptions.find(opt => opt.value === lang);
            if (option) {
                this.selectedLanguage = option;
            }
        });
    }

    onLanguageChange(event: any): void {
        if (event && event.value) {
            this.languageService.setLanguage(event.value.value);
        }
    }

    private getLanguageFlag(language: SupportedLanguage): string {
        const flags: Record<SupportedLanguage, string> = {
            en: '🇬🇧',
            de: '🇩🇪'
        };
        return flags[language] || '🌐';
    }
}
