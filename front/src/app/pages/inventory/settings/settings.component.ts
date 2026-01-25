import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { FormsModule } from '@angular/forms';

@Component({
    selector: 'app-settings',
    standalone: true,
    imports: [CommonModule, InputTextModule, ButtonModule, FormsModule],
    template: `
        <div class="grid grid-cols-12 gap-8">
            <div class="col-span-12">
                <div class="card">
                    <h1 class="text-surface-900 dark:text-surface-0 text-3xl font-semibold mb-6">Settings</h1>
                    <p class="text-muted-color mb-6">Configure your inventory management preferences.</p>
                    
                    <div class="grid grid-cols-12 gap-4">
                        <div class="col-span-12 md:col-span-6">
                            <div class="card">
                                <h2 class="text-surface-900 dark:text-surface-0 text-xl font-semibold mb-4">General Settings</h2>
                                <div class="field mb-4">
                                    <label class="block mb-2 font-medium">Default Reorder Point</label>
                                    <input pInputText type="number" [(ngModel)]="settings.defaultReorderPoint" class="w-full" />
                                </div>
                                <div class="field mb-4">
                                    <label class="block mb-2 font-medium">Default Safety Stock</label>
                                    <input pInputText type="number" [(ngModel)]="settings.defaultSafetyStock" class="w-full" />
                                </div>
                                <p-button label="Save Settings" icon="pi pi-check"></p-button>
                            </div>
                        </div>
                        <div class="col-span-12 md:col-span-6">
                            <div class="card">
                                <h2 class="text-surface-900 dark:text-surface-0 text-xl font-semibold mb-4">AI Agent Settings</h2>
                                <div class="field mb-4">
                                    <label class="block mb-2 font-medium">Confidence Threshold</label>
                                    <input pInputText type="number" [(ngModel)]="settings.confidenceThreshold" class="w-full" />
                                </div>
                                <div class="field mb-4">
                                    <label class="block mb-2 font-medium">Auto-approve transfers above</label>
                                    <input pInputText type="number" [(ngModel)]="settings.autoApproveThreshold" class="w-full" />
                                </div>
                                <p-button label="Save Settings" icon="pi pi-check"></p-button>
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
