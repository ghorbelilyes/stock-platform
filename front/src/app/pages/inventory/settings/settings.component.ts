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
import { SettingsService } from '../../../shared/services/settings.service';

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
        ToastModule
    ],
    providers: [MessageService],
    templateUrl: './settings.component.html',
    styleUrls: ['./settings.component.scss']
})
export class SettingsComponent implements OnInit {
    settingsService = inject(SettingsService);
    messageService = inject(MessageService);
    translateService = inject(TranslateService);

    // Flat maps for different types to bind 
    boolSettings: { [key: string]: boolean } = {};
    intSettings: { [key: string]: number } = {};
    strSettings: { [key: string]: string } = {};

    // Virtual object for sliders (mapped to intSettings on save/load)
    transferSettings = {
        minAccept: 50
    };

    agentModes = [
        { label: 'Conservative (Minimize Risk)', value: 'CONSERVATIVE' },
        { label: 'Balanced', value: 'BALANCED' },
        { label: 'Aggressive (Maximize Sales)', value: 'AGGRESSIVE' }
    ];

    constraintBehaviors = [
        { label: 'Clamp (Adjust Quantity)', value: 'CLAMP' },
        { label: 'Block (Reject Transfer)', value: 'BLOCK' }
    ];

    saving = false;

    ngOnInit() {
        this.loadSettings();
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
                    } else if (!isNaN(Number(val)) && !key.includes('mode') && !key.includes('Behavior')) { // heuristic
                        this.intSettings[key] = parseInt(val, 10);
                    } else {
                        this.strSettings[key] = val;
                    }
                }

                // Map specific slider values
                this.transferSettings.minAccept = this.intSettings['confidence.minAccept'] || 50;
            }
        });
    }

    saveAll() {
        this.saving = true;

        // 1. Prepare global settings map
        const payload: { [key: string]: string } = {};

        // Merge from specific objects
        this.intSettings['confidence.minAccept'] = this.transferSettings.minAccept;

        for (const k in this.boolSettings) payload[k] = String(this.boolSettings[k]);
        for (const k in this.intSettings) payload[k] = String(this.intSettings[k]);
        for (const k in this.strSettings) payload[k] = this.strSettings[k];

        // 2. Save global
        this.settingsService.updateSettings(payload).subscribe({
            next: () => {
                this.saving = false;
                this.messageService.add({ severity: 'success', summary: 'Success', detail: 'Settings saved' });
            },
            error: () => {
                this.saving = false;
                this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to save settings' });
            }
        });
    }
}
