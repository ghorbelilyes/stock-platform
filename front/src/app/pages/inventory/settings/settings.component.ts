import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { FormsModule } from '@angular/forms';

@Component({
    selector: 'app-settings',
    standalone: true,
    imports: [CommonModule, TranslateModule, InputTextModule, ButtonModule, FormsModule],
    template: `
        <div class="grid grid-cols-12 gap-8">
            <div class="col-span-12">
                <div class="card">
                    <h1 class="text-surface-900 dark:text-surface-0 text-3xl font-semibold mb-6">{{ 'navigation.settings' | translate }}</h1>
                    <p class="text-muted-color mb-6">{{ 'settings.description' | translate }}</p>
                    
                    <div class="grid grid-cols-12 gap-4">
                        <div class="col-span-12 md:col-span-6">
                            <div class="card">
                                <h2 class="text-surface-900 dark:text-surface-0 text-xl font-semibold mb-4">{{ 'settings.general' | translate }}</h2>
                                <div class="field mb-4">
                                    <label class="block mb-2 font-medium">{{ 'settings.defaultReorderPoint' | translate }}</label>
                                    <input pInputText type="number" [(ngModel)]="settings.defaultReorderPoint" class="w-full" />
                                </div>
                                <div class="field mb-4">
                                    <label class="block mb-2 font-medium">{{ 'settings.defaultSafetyStock' | translate }}</label>
                                    <input pInputText type="number" [(ngModel)]="settings.defaultSafetyStock" class="w-full" />
                                </div>
                                <p-button [label]="'settings.saveSettings' | translate" icon="pi pi-check"></p-button>
                            </div>
                        </div>
                        <div class="col-span-12 md:col-span-6">
                            <div class="card">
                                <h2 class="text-surface-900 dark:text-surface-0 text-xl font-semibold mb-4">{{ 'settings.aiAgent' | translate }}</h2>
                                <div class="field mb-4">
                                    <label class="block mb-2 font-medium">{{ 'settings.confidenceThreshold' | translate }}</label>
                                    <input pInputText type="number" [(ngModel)]="settings.confidenceThreshold" class="w-full" />
                                </div>
                                <div class="field mb-4">
                                    <label class="block mb-2 font-medium">{{ 'settings.autoApproveThreshold' | translate }}</label>
                                    <input pInputText type="number" [(ngModel)]="settings.autoApproveThreshold" class="w-full" />
                                </div>
                                <p-button [label]="'settings.saveSettings' | translate" icon="pi pi-check"></p-button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `
})
export class SettingsComponent {
    settings = {
        defaultReorderPoint: 50,
        defaultSafetyStock: 20,
        confidenceThreshold: 80,
        autoApproveThreshold: 90
    };
}
