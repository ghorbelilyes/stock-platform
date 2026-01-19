import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { FileUploadModule } from 'primeng/fileupload';
import { TagModule } from 'primeng/tag';
import { InventoryDataService } from '../../../shared/services/inventory-data.service';

@Component({
    selector: 'app-upload',
    standalone: true,
    imports: [CommonModule, ButtonModule, FileUploadModule, TagModule],
    styles: [`
        // ::ng-deep .p-fileupload-basic-content {
        //     background-color: var(--p-content-background) !important;
        // }
    `],
    template: `
        <div class="grid grid-cols-12 gap-8">
            <div class="col-span-12">
                <div class="card">
                    <h1 class="text-surface-900 dark:text-surface-0 text-3xl font-semibold mb-2">Upload Data</h1>
                    <p class="text-muted-color">Upload your inventory data files to get started with AI-powered transfer suggestions.</p>
                </div>
            </div>

            <div class="col-span-12 md:col-span-4">
                <div class="card h-full">
                    <h2 class="text-surface-900 dark:text-surface-0 text-xl font-semibold mb-4">Stores File</h2>
                    <div class="mb-4">
                        <p-fileupload 
                            mode="basic" 
                            name="stores[]" 
                            accept=".csv" 
                            (onSelect)="onFileSelect($any($event), 'stores')"
                            chooseLabel="Upload CSV"
                            chooseIcon="pi pi-plus"
                            [auto]="true"
                            [showUploadButton]="false"
                            [showCancelButton]="false"
                            styleClass="">
                        </p-fileupload>
                    </div>
                    <div *ngIf="uploadedFiles.stores && (!uploadedFiles.stores.errors || uploadedFiles.stores.errors.length == 0)" class="mt-4">
                        <div class="flex items-center gap-2 mb-2">
                            <span class="font-medium">{{ uploadedFiles.stores.name }}</span>
                            <p-tag [value]="uploadedFiles.stores.valid ? 'Valid' : 'Invalid'" 
                                   [severity]="uploadedFiles.stores.valid ? 'success' : 'danger'">
                            </p-tag>
                        </div>
                        <div class="text-sm text-muted-color">
                            Uploaded: {{ uploadedFiles.stores.uploadedAt | date:'short' }}
                        </div>
                        <!-- <div *ngIf="uploadedFiles.stores.errors && uploadedFiles.stores.errors.length > 0" class="mt-2">
                            <div class="text-sm text-red-500" *ngFor="let error of uploadedFiles.stores.errors">
                                • {{ error }}
                            </div>
                        </div> -->
                    </div>
                    <div class="mt-4 p-3 rounded dark:bg-surface-800">
                        <p class="text-sm font-medium mb-2 text-surface-900 dark:text-surface-100">Expected columns:</p>
                        <code class="text-xs text-surface-700 dark:text-surface-100">store_id, store_name, city, type(store|warehouse), lead_time_days</code>
                    </div>
                </div>
            </div>

            <div class="col-span-12 md:col-span-4">
                <div class="card h-full">
                    <h2 class="text-surface-900 dark:text-surface-0 text-xl font-semibold mb-4">Stocks File</h2>
                    <div class="mb-4">
                        <p-fileupload 
                            mode="basic" 
                            name="stocks[]" 
                            accept=".csv" 
                            (onSelect)="onFileSelect($any($event), 'stocks')"
                            chooseLabel="Upload CSV"
                            chooseIcon="pi pi-plus"
                            [auto]="true"
                            [showUploadButton]="false"
                            [showCancelButton]="false"
                            styleClass="">
                        </p-fileupload>
                    </div>
                    <div *ngIf="uploadedFiles.stocks && (!uploadedFiles.stocks.errors || uploadedFiles.stocks.errors.length == 0)" class="mt-4">
                        <div class="flex items-center gap-2 mb-2">
                            <span class="font-medium">{{ uploadedFiles.stocks.name }}</span>
                            <p-tag [value]="uploadedFiles.stocks.valid ? 'Valid' : 'Invalid'" 
                                   [severity]="uploadedFiles.stocks.valid ? 'success' : 'danger'">
                            </p-tag>
                        </div>
                        <div class="text-sm text-muted-color">
                            Uploaded: {{ uploadedFiles.stocks.uploadedAt | date:'short' }}
                        </div>
                        <!-- <div *ngIf="uploadedFiles.stocks.errors && uploadedFiles.stocks.errors.length > 0" class="mt-2">
                            <div class="text-sm text-red-500" *ngFor="let error of uploadedFiles.stocks.errors">
                                • {{ error }}
                            </div>
                        </div> -->
                    </div>
                    <div class="mt-4 p-3 rounded dark:bg-surface-800">
                        <p class="text-sm font-medium mb-2 text-surface-900 dark:text-surface-100">Expected columns:</p>
                        <code class="text-xs text-surface-700 dark:text-surface-100">store_id, sku, on_hand, reserved, reorder_point, safety_stock</code>
                    </div>
                </div>
            </div>

            <div class="col-span-12 md:col-span-4">
                <div class="card h-full">
                    <h2 class="text-surface-900 dark:text-surface-0 text-xl font-semibold mb-4">Sales File</h2>
                    <div class="mb-4">
                        <p-fileupload 
                            mode="basic" 
                            name="sales[]" 
                            accept=".csv" 
                            (onSelect)="onFileSelect($any($event), 'sales')"
                            chooseLabel="Upload CSV"
                            chooseIcon="pi pi-plus"
                            [auto]="true"
                            [showUploadButton]="false"
                            [showCancelButton]="false"
                            styleClass="">
                        </p-fileupload>
                    </div>
                    <div *ngIf="uploadedFiles.sales && (!uploadedFiles.sales.errors || uploadedFiles.sales.errors.length == 0)" class="mt-4">
                        <div class="flex items-center gap-2 mb-2">
                            <span class="font-medium">{{ uploadedFiles.sales.name }}</span>
                            <p-tag [value]="uploadedFiles.sales.valid ? 'Valid' : 'Invalid'" 
                                   [severity]="uploadedFiles.sales.valid ? 'success' : 'danger'">
                            </p-tag>
                        </div>
                        <div class="text-sm text-muted-color">
                            Uploaded: {{ uploadedFiles.sales.uploadedAt | date:'short' }}
                        </div>
                        <!-- <div *ngIf="uploadedFiles.sales.errors && uploadedFiles.sales.errors.length > 0" class="mt-2">
                            <div class="text-sm text-red-500" *ngFor="let error of uploadedFiles.sales.errors">
                                • {{ error }}
                            </div>
                        </div> -->
                    </div>
                    <div class="mt-4 p-3 rounded dark:bg-surface-800">
                        <p class="text-sm font-medium mb-2 text-surface-900 dark:text-surface-100">Expected columns:</p>
                        <code class="text-xs text-surface-700 dark:text-surface-100">store_id, sku, date, qty_sold, price</code>
                    </div>
                </div>
            </div>
        </div>
    `
})
export class UploadComponent implements OnInit {
    private inventoryService = inject(InventoryDataService);
    uploadedFiles: {
        stores?: { name: string; uploadedAt: string; valid: boolean; errors?: string[] };
        stocks?: { name: string; uploadedAt: string; valid: boolean; errors?: string[] };
        sales?: { name: string; uploadedAt: string; valid: boolean; errors?: string[] };
    } = {};

    ngOnInit() {
        this.uploadedFiles = this.inventoryService.getUploadedFilesState();
    }

    async onFileSelect(event: any, fileType: 'stores' | 'stocks' | 'sales') {
        const file = event.files[0];
        if (!file) return;

        // Validate file
        const validation = await this.inventoryService.validateFilesMock(fileType, file);
        
        // Update state
        const updatedFiles = {
            ...this.uploadedFiles,
            [fileType]: {
                name: file.name,
                uploadedAt: new Date().toISOString(),
                valid: validation.valid,
                errors: validation.errors
            }
        };

        this.inventoryService.setUploadedFilesState(updatedFiles);
        this.uploadedFiles = updatedFiles;
    }
}
