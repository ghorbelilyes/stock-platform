import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { ToggleSwitchModule } from 'primeng/toggleswitch';
import { TabsModule } from 'primeng/tabs';
import { SelectModule } from 'primeng/select';
import { TableModule } from 'primeng/table';
import { SliderModule } from 'primeng/slider';
import { MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';
import { PanelModule } from 'primeng/panel';
import { SettingsService, CategorySettings } from '../../../shared/services/settings.service';
import { InventoryDataService } from '../../../shared/services/inventory-data.service';
import { forkJoin } from 'rxjs';

@Component({
    selector: 'app-settings',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        TranslateModule,
        ButtonModule,
        InputTextModule,
        InputNumberModule,
        ToggleSwitchModule,
        TabsModule,
        SelectModule,
        TableModule,
        SliderModule,
        ToastModule,
        PanelModule
    ],
    providers: [MessageService],
    templateUrl: './settings.component.html',
    styleUrls: ['./settings.component.scss']
})
export class SettingsComponent implements OnInit {
    settingsService = inject(SettingsService);
    messageService = inject(MessageService);
    inventoryService = inject(InventoryDataService); // To fetch categories if needed
    translateService = inject(TranslateService);

    // Flat maps for different types to bind 
    boolSettings: { [key: string]: boolean } = {};
    intSettings: { [key: string]: number } = {};
    strSettings: { [key: string]: string } = {};

    // Virtual object for sliders (mapped to intSettings on save/load)
    transferSettings = {
        minAccept: 50,
        minApprove: 70,
        minAutoApprove: 90
    };

    agentModes = [
        { label: 'Conservative (Minimize Risk)', value: 'CONSERVATIVE' },
        { label: 'Balanced', value: 'BALANCED' },
        { label: 'Aggressive (Maximize Sales)', value: 'AGGRESSIVE' }
    ];

    categorySettings: CategorySettings[] = [];
    loadingCategories = false;
    saving = false;

    ngOnInit() {
        this.loadSettings();
        this.loadCategories();
    }

    loadSettings() {
        this.settingsService.getAllSettings().subscribe(res => {
            if (res.success && res.data) {
                const data = res.data;
                // Parse into typed maps
                for (const key in data) {
                    const val = data[key];
                    if (val === 'true' || val === 'false') {
                        this.boolSettings[key] = (val === 'true');
                    } else if (!isNaN(Number(val)) && !key.includes('mode')) { // heuristic
                        // Check if it's int or float? using int for now
                        this.intSettings[key] = parseInt(val, 10);
                    } else {
                        this.strSettings[key] = val;
                    }
                }

                // Map specific slider values
                this.transferSettings.minAccept = this.intSettings['confidence.minAccept'] || 50;
                this.transferSettings.minApprove = this.intSettings['confidence.minApprove'] || 70;
                this.transferSettings.minAutoApprove = this.intSettings['confidence.minAutoApprove'] || 90;
            }
        });
    }

    loadCategories() {
        this.loadingCategories = true;
        // Ideally fetch categories AND their settings.
        // Currently getCategorySettings returns only existing settings.
        // We might want to list ALL categories and show default if no setting exists.

        // Parallel fetch
        forkJoin({
            cats: this.inventoryService.getCategories(),
            settings: this.settingsService.getCategorySettings()
        }).subscribe({
            next: (res) => {
                this.loadingCategories = false;
                // Merge
                const categories = res.cats.data || [];
                const settings = res.settings.data || [];

                this.categorySettings = categories.map((cat: any) => {
                    const existing = settings.find((s: CategorySettings) => s.category?.id === cat.id);
                    if (existing) return existing;
                    // Default
                    return {
                        id: cat.id,
                        category: cat,
                        minQty: 0,
                        maxQty: 0,
                        minConfidence: 0,
                        autoApprove: false
                    };
                });
            },
            error: (err) => {
                this.loadingCategories = false;
            }
        });
    }

    saveAll() {
        this.saving = true;

        // 1. Prepare global settings map
        const payload: { [key: string]: string } = {};

        // Merge from specific objects
        this.intSettings['confidence.minAccept'] = this.transferSettings.minAccept;
        this.intSettings['confidence.minApprove'] = this.transferSettings.minApprove;
        this.intSettings['confidence.minAutoApprove'] = this.transferSettings.minAutoApprove;

        for (const k in this.boolSettings) payload[k] = String(this.boolSettings[k]);
        for (const k in this.intSettings) payload[k] = String(this.intSettings[k]);
        for (const k in this.strSettings) payload[k] = this.strSettings[k];

        // 2. Save global
        this.settingsService.updateSettings(payload).subscribe({
            next: () => {
                // 3. Save categories
                // We should probably have a bulk update for categories, but let's loop for now 
                // or just save changed ones. For simplicity, assume updateCategorySettings takes single.
                // Or I can add a bulk update endpoint.
                // Let's just save for now one-by-one or skip if logic too complex for this turn.
                // Ideally backend supports list.

                // Wait... I implemented SettingsController with updateCategorySettings taking single object.
                // I should have made it a list. But let's act with what we have.
                // I will update the controller to accept list if possible, or just loop.
                // Looping 100 requests is bad.

                // Let's blindly notify success for now and implement category save loop.
                let savedCount = 0;
                const toSave = this.categorySettings.filter(c => c.category); // valid only
                if (toSave.length === 0) {
                    this.saving = false;
                    this.messageService.add({ severity: 'success', summary: 'Success', detail: 'Settings saved' });
                    return;
                }

                // Hack: sequential save or just save first few? 
                // I'll update the backend to support bulk.
                // Bulk update logic
                this.performCategoryUpdates(toSave);
            },
            error: () => {
                this.saving = false;
                this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to save settings' });
            }
        });
    }

    performCategoryUpdates(list: CategorySettings[]) {
        this.settingsService.updateCategorySettingsBulk(list).subscribe({
            next: () => {
                this.saving = false;
                this.messageService.add({ severity: 'success', summary: 'Success', detail: 'Settings saved' });
            },
            error: () => {
                this.saving = false;
                this.messageService.add({ severity: 'warn', summary: 'Partial Success', detail: 'Some category settings might not have saved' });
            }
        });
    }
}
