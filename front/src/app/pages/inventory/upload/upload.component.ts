import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { FileUploadModule } from 'primeng/fileupload';
import { TagModule } from 'primeng/tag';
import { DialogModule } from 'primeng/dialog';
import { SelectModule } from 'primeng/select';
import { FormsModule } from '@angular/forms';
import { MessageModule } from 'primeng/message';
import { InventoryDataService } from '../../../shared/services/inventory-data.service';
import { ColumnMapping, FileMappingConfig, BACKEND_COLUMNS } from '../../../shared/models/inventory.models';

@Component({
    selector: 'app-upload',
    standalone: true,
    imports: [CommonModule, ButtonModule, FileUploadModule, TagModule, DialogModule, SelectModule, FormsModule, MessageModule],
    styles: [`
        ::ng-deep .p-select {
            width: 100% !important;
            min-width: 250px !important;
        }
        ::ng-deep .p-select .p-select-trigger {
            width: 100% !important;
            min-height: 2.5rem !important;
            height: 2.5rem !important;
        }
        ::ng-deep .p-select .p-select-label {
            min-height: 2.5rem !important;
            height: 2.5rem !important;
            display: flex !important;
            align-items: center !important;
            padding: 0.5rem 0.75rem !important;
        }
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
                    @if (uploadedFiles.stores && (!uploadedFiles.stores.errors || uploadedFiles.stores.errors.length == 0)) {
                        <div class="mt-4">
                            <div class="flex items-center gap-2 mb-2">
                                <span class="font-medium">{{ uploadedFiles.stores.name }}</span>
                                <p-tag [value]="uploadedFiles.stores.valid ? 'Valid' : 'Invalid'" 
                                       [severity]="uploadedFiles.stores.valid ? 'success' : 'danger'">
                                </p-tag>
                            </div>
                            <div class="text-sm text-muted-color">
                                Uploaded: {{ formatDate(uploadedFiles.stores.uploadedAt) | date:'short' }}
                            </div>
                        </div>
                    }
                    @if (uploadedFiles.stores?.errors && (uploadedFiles.stores?.errors?.length ?? 0) > 0) {
                        <div class="mt-2">
                            @for (error of uploadedFiles.stores?.errors || []; track error) {
                                <p-message severity="error" [text]="error"></p-message>
                            }
                        </div>
                    }
                    <div class="mt-4 p-3 rounded dark:bg-surface-800">
                        <p class="text-sm font-medium mb-2 text-surface-900 dark:text-surface-100">Expected columns:</p>
                        <code class="text-xs text-surface-700 dark:text-surface-100">serial_number, name, city, type(store|warehouse)</code>
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
                    @if (uploadedFiles.stocks && (!uploadedFiles.stocks.errors || uploadedFiles.stocks.errors.length == 0)) {
                        <div class="mt-4">
                            <div class="flex items-center gap-2 mb-2">
                                <span class="font-medium">{{ uploadedFiles.stocks.name }}</span>
                                <p-tag [value]="uploadedFiles.stocks.valid ? 'Valid' : 'Invalid'" 
                                       [severity]="uploadedFiles.stocks.valid ? 'success' : 'danger'">
                                </p-tag>
                            </div>
                            <div class="text-sm text-muted-color">
                                Uploaded: {{ formatDate(uploadedFiles.stocks.uploadedAt) | date:'short' }}
                            </div>
                            @if (uploadedFiles.stocks.rowsProcessed !== undefined) {
                                <div class="text-sm text-muted-color mt-1">
                                    Rows: {{ uploadedFiles.stocks.rowsInserted || 0 }} / {{ uploadedFiles.stocks.rowsProcessed || 0 }} imported
                                </div>
                            }
                        </div>
                    }
                    @if (uploadedFiles.stocks?.errors && (uploadedFiles.stocks?.errors?.length ?? 0) > 0) {
                        <div class="mt-2">
                            @for (error of uploadedFiles.stocks?.errors || []; track error) {
                                <p-message severity="error" [text]="error"></p-message>
                            }
                        </div>
                    }
                    <div class="mt-4 p-3 rounded dark:bg-surface-800">
                        <p class="text-sm font-medium mb-2 text-surface-900 dark:text-surface-100">Expected columns:</p>
                        <code class="text-xs text-surface-700 dark:text-surface-100">id_store, id_product, quantity</code>
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
                    @if (uploadedFiles.sales && (!uploadedFiles.sales.errors || uploadedFiles.sales.errors.length == 0)) {
                        <div class="mt-4">
                            <div class="flex items-center gap-2 mb-2">
                                <span class="font-medium">{{ uploadedFiles.sales.name }}</span>
                                <p-tag [value]="uploadedFiles.sales.valid ? 'Valid' : 'Invalid'" 
                                       [severity]="uploadedFiles.sales.valid ? 'success' : 'danger'">
                                </p-tag>
                            </div>
                            <div class="text-sm text-muted-color">
                                Uploaded: {{ formatDate(uploadedFiles.sales.uploadedAt) | date:'short' }}
                            </div>
                            @if (uploadedFiles.sales.rowsProcessed !== undefined) {
                                <div class="text-sm text-muted-color mt-1">
                                    Rows: {{ uploadedFiles.sales.rowsInserted || 0 }} / {{ uploadedFiles.sales.rowsProcessed || 0 }} imported
                                </div>
                            }
                        </div>
                    }
                    @if (uploadedFiles.sales?.errors && (uploadedFiles.sales?.errors?.length ?? 0) > 0) {
                        <div class="mt-2">
                            @for (error of uploadedFiles.sales?.errors || []; track error) {
                                <p-message severity="error" [text]="error"></p-message>
                            }
                        </div>
                    }
                    <div class="mt-4 p-3 rounded dark:bg-surface-800">
                        <p class="text-sm font-medium mb-2 text-surface-900 dark:text-surface-100">Expected columns:</p>
                        <code class="text-xs text-surface-700 dark:text-surface-100">id_store, id_product, quantity, range_date</code>
                    </div>
                </div>
            </div>

            <!-- Transfer File Card -->
            <div class="col-span-12 md:col-span-4">
                <div class="card h-full">
                    <h2 class="text-surface-900 dark:text-surface-0 text-xl font-semibold mb-4">Transfer File</h2>
                    <div class="mb-4">
                        <p-fileupload 
                            mode="basic" 
                            name="transfers[]" 
                            accept=".csv" 
                            (onSelect)="onFileSelect($any($event), 'transfers')"
                            chooseLabel="Upload CSV"
                            chooseIcon="pi pi-plus"
                            [auto]="true"
                            [showUploadButton]="false"
                            [showCancelButton]="false"
                            styleClass="">
                        </p-fileupload>
                    </div>
                    @if (uploadedFiles.transfers && (!uploadedFiles.transfers.errors || uploadedFiles.transfers.errors.length == 0)) {
                        <div class="mt-4">
                            <div class="flex items-center gap-2 mb-2">
                                <span class="font-medium">{{ uploadedFiles.transfers.name }}</span>
                                <p-tag [value]="uploadedFiles.transfers.valid ? 'Valid' : 'Invalid'" 
                                       [severity]="uploadedFiles.transfers.valid ? 'success' : 'danger'">
                                </p-tag>
                            </div>
                            <div class="text-sm text-muted-color">
                                Uploaded: {{ formatDate(uploadedFiles.transfers.uploadedAt) | date:'short' }}
                            </div>
                            @if (uploadedFiles.transfers.rowsProcessed !== undefined) {
                                <div class="text-sm text-muted-color mt-1">
                                    Rows: {{ uploadedFiles.transfers.rowsInserted || 0 }} / {{ uploadedFiles.transfers.rowsProcessed || 0 }} imported
                                </div>
                            }
                        </div>
                    }
                    @if (uploadedFiles.transfers?.errors && (uploadedFiles.transfers?.errors?.length ?? 0) > 0) {
                        <div class="mt-2">
                            @for (error of uploadedFiles.transfers?.errors || []; track error) {
                                <p-message severity="error" [text]="error"></p-message>
                            }
                        </div>
                    }
                    <div class="mt-4 p-3 rounded dark:bg-surface-800">
                        <p class="text-sm font-medium mb-2 text-surface-900 dark:text-surface-100">Expected columns:</p>
                        <code class="text-xs text-surface-700 dark:text-surface-100">date, id_store_sent, id_store_receive, id_product, reason, quantity</code>
                    </div>
                </div>
            </div>

            <div class="col-span-12 md:col-span-4">
                <div class="card h-full">
                    <h2 class="text-surface-900 dark:text-surface-0 text-xl font-semibold mb-4">Products File</h2>
                    <div class="mb-4">
                        <p-fileupload 
                            mode="basic" 
                            name="products[]" 
                            accept=".csv" 
                            (onSelect)="onFileSelect($any($event), 'products')"
                            chooseLabel="Upload CSV"
                            chooseIcon="pi pi-plus"
                            [auto]="true"
                            [showUploadButton]="false"
                            [showCancelButton]="false"
                            styleClass="">
                        </p-fileupload>
                    </div>
                    @if (uploadedFiles.products && (!uploadedFiles.products.errors || uploadedFiles.products.errors.length == 0)) {
                        <div class="mt-4">
                            <div class="flex items-center gap-2 mb-2">
                                <span class="font-medium">{{ uploadedFiles.products.name }}</span>
                                <p-tag [value]="uploadedFiles.products.valid ? 'Valid' : 'Invalid'" 
                                       [severity]="uploadedFiles.products.valid ? 'success' : 'danger'">
                                </p-tag>
                            </div>
                            <div class="text-sm text-muted-color">
                                Uploaded: {{ formatDate(uploadedFiles.products.uploadedAt) | date:'short' }}
                            </div>
                            @if (uploadedFiles.products.rowsProcessed !== undefined) {
                                <div class="text-sm text-muted-color mt-1">
                                    Rows: {{ uploadedFiles.products.rowsInserted || 0 }} / {{ uploadedFiles.products.rowsProcessed || 0 }} imported
                                </div>
                            }
                        </div>
                    }
                    @if (uploadedFiles.products?.errors && (uploadedFiles.products?.errors?.length ?? 0) > 0) {
                        <div class="mt-2">
                            @for (error of uploadedFiles.products?.errors || []; track error) {
                                <p-message severity="error" [text]="error"></p-message>
                            }
                        </div>
                    }
                    <div class="mt-4 p-3 rounded dark:bg-surface-800">
                        <p class="text-sm font-medium mb-2 text-surface-900 dark:text-surface-100">Expected columns:</p>
                        <code class="text-xs text-surface-700 dark:text-surface-100">code_barre, name, description</code>
                    </div>
                </div>
            </div>
        </div>

        <!-- Column Mapping Dialog -->
        <p-dialog 
            [(visible)]="showMappingDialog" 
            [modal]="true" 
            [style]="{ width: '700px', maxHeight: '80vh' }"
            [contentStyle]="{ 'max-height': '60vh', 'overflow-y': 'auto' }"
            header="Map Columns"
            [closable]="true">
            <ng-template #content>
                @if (currentMapping && fileHeaders.length > 0) {
                    <div class="flex flex-col gap-4">
                        <p class="text-muted-color mb-2">Map your file columns to backend columns. Required columns are marked with <span class="text-red-500">*</span></p>
                        <div class="grid grid-cols-12 gap-4 mb-2 pb-2 border-b border-surface-border">
                            <div class="col-span-6">
                                <label class="block text-sm font-semibold text-surface-900 dark:text-surface-0">File Column</label>
                            </div>
                            <div class="col-span-6">
                                <label class="block text-sm font-semibold text-surface-900 dark:text-surface-0">Backend Column</label>
                            </div>
                        </div>
                        @for (mapping of currentMapping.mappings; track mapping.backendColumn) {
                            <div class="grid grid-cols-12 gap-4 items-center py-2">
                                <div class="col-span-6 w-full">
                                    <p-select 
                                        [(ngModel)]="mapping.fileColumn"
                                        [options]="getFileColumnOptions()"
                                        placeholder="Select file column"
                                        appendTo="body"
                                        [style]="{ 'width': '100%', 'min-width': '250px' }">
                                    </p-select>
                                </div>
                                <div class="col-span-6">
                                    <div class="flex items-center gap-2">
                                        <span class="text-sm text-surface-700 dark:text-surface-300 flex-1 p-2 bg-surface-50 dark:bg-surface-800 rounded">
                                            {{ mapping.backendColumn }}
                                        </span>
                                        @if (mapping.required) {
                                            <span class="text-red-500 text-sm font-semibold">*</span>
                                        }
                                    </div>
                                </div>
                            </div>
                        }
                    </div>
                }
            </ng-template>
            <ng-template #footer>
                <p-button label="Cancel" icon="pi pi-times" text (click)="cancelMapping()" />
                <p-button label="Save & Upload" icon="pi pi-check" (click)="saveMapping()" [loading]="uploading" />
            </ng-template>
        </p-dialog>
    `
})
export class UploadComponent implements OnInit {
    private inventoryService = inject(InventoryDataService);
    uploadedFiles: {
        stores?: { 
            name: string; 
            uploadedAt: string; 
            valid: boolean; 
            errors?: string[]; 
            columnMapping?: FileMappingConfig;
            rowsProcessed?: number;
            rowsInserted?: number;
            rowsFailed?: number;
        };
        stocks?: { 
            name: string; 
            uploadedAt: string; 
            valid: boolean; 
            errors?: string[]; 
            columnMapping?: FileMappingConfig;
            rowsProcessed?: number;
            rowsInserted?: number;
            rowsFailed?: number;
        };
        sales?: { 
            name: string; 
            uploadedAt: string; 
            valid: boolean; 
            errors?: string[]; 
            columnMapping?: FileMappingConfig;
            rowsProcessed?: number;
            rowsInserted?: number;
            rowsFailed?: number;
        };
        transfers?: { 
            name: string; 
            uploadedAt: string; 
            valid: boolean; 
            errors?: string[]; 
            columnMapping?: FileMappingConfig;
            rowsProcessed?: number;
            rowsInserted?: number;
            rowsFailed?: number;
        };
        products?: { 
            name: string; 
            uploadedAt: string; 
            valid: boolean; 
            errors?: string[]; 
            columnMapping?: FileMappingConfig;
            rowsProcessed?: number;
            rowsInserted?: number;
            rowsFailed?: number;
        };
    } = {};

    showMappingDialog = false;
    currentMapping: FileMappingConfig | null = null;
    currentFileType: 'stock' | 'sales' | 'transfer' | 'store' | 'product' | null = null;
    currentFile: File | null = null;
    pendingFileType: 'stores' | 'stocks' | 'sales' | 'transfers' | 'products' | null = null;
    fileHeaders: string[] = [];
    uploading = false;

    ngOnInit() {
        this.uploadedFiles = this.inventoryService.getUploadedFilesState();
    }

    async onFileSelect(event: any, fileType: 'stores' | 'stocks' | 'sales' | 'transfers' | 'products') {
        const file = event.files[0];
        if (!file) return;

        // Validate file extension first
        const fileName = file.name.toLowerCase();
        if (!fileName.endsWith('.csv')) {
            const updatedFiles = {
                ...this.uploadedFiles,
                [fileType]: {
                    name: file.name,
                    uploadedAt: new Date().toISOString(),
                    valid: false,
                    errors: ['Invalid file type, allowed file types: .CSV']
                }
            };
            this.inventoryService.setUploadedFilesState(updatedFiles);
            this.uploadedFiles = updatedFiles;
            return;
        }

        try {
            // Parse CSV headers using backend API
            this.fileHeaders = await this.inventoryService.parseCSVHeaders(file);
            
            // Map file type to backend type
            const backendType: 'stock' | 'sales' | 'transfer' | 'store' | 'product' = 
                fileType === 'stocks' ? 'stock' : 
                fileType === 'sales' ? 'sales' : 
                fileType === 'transfers' ? 'transfer' : 
                fileType === 'products' ? 'product' :
                'store';
            
            // Get required backend columns from API
            this.inventoryService.getRequiredColumns(backendType).subscribe({
                next: (backendColumns) => {
                    // Create initial mapping (try to auto-match by name)
                    const mappings: ColumnMapping[] = backendColumns.map(backendCol => {
                        // Try to find matching file column (case-insensitive, with variations)
                        const matchedFileCol = this.fileHeaders.find(fh => 
                            fh.toLowerCase() === backendCol.toLowerCase() ||
                            fh.toLowerCase().replace(/[_\s]/g, '') === backendCol.toLowerCase().replace(/[_\s]/g, '')
                        ) || '';
                        
                        return {
                            fileColumn: matchedFileCol || '',
                            backendColumn: backendCol,
                            required: true
                        };
                    });

                    // Store current file and type for mapping dialog
                    this.currentFile = file;
                    this.currentFileType = backendType;
                    this.pendingFileType = fileType;
                    this.currentMapping = {
                        fileType: backendType,
                        mappings
                    };

                    // Show mapping dialog
                    this.showMappingDialog = true;
                },
                error: (error) => {
                    console.error('Error fetching required columns:', error);
                    // Fallback to local constant
                    const backendColumns = [...BACKEND_COLUMNS[backendType]];
                    const mappings: ColumnMapping[] = backendColumns.map(backendCol => {
                        const matchedFileCol = this.fileHeaders.find(fh => 
                            fh.toLowerCase() === backendCol.toLowerCase() ||
                            fh.toLowerCase().replace(/[_\s]/g, '') === backendCol.toLowerCase().replace(/[_\s]/g, '')
                        ) || '';
                        
                        return {
                            fileColumn: matchedFileCol || '',
                            backendColumn: backendCol,
                            required: true
                        };
                    });

                    this.currentFile = file;
                    this.currentFileType = backendType;
                    this.pendingFileType = fileType;
                    this.currentMapping = {
                        fileType: backendType,
                        mappings
                    };
                    this.showMappingDialog = true;
                }
            });
        } catch (error) {
            const updatedFiles = {
                ...this.uploadedFiles,
                [fileType]: {
                    name: file.name,
                    uploadedAt: new Date().toISOString(),
                    valid: false,
                    errors: ['Failed to parse CSV file: ' + (error as Error).message]
                }
            };
            this.inventoryService.setUploadedFilesState(updatedFiles);
            this.uploadedFiles = updatedFiles;
        }
    }

    getFileColumnOptions(): string[] {
        // Return file headers from CSV file (parsed from the uploaded file)
        // These are the actual column names from the uploaded CSV file
        // Empty string option allows unmapping a column
        const validHeaders = this.fileHeaders.filter(h => h && h.trim() !== '');
        return ['', ...validHeaders];
    }

    saveMapping() {
        if (!this.currentMapping || !this.pendingFileType || !this.currentFile) return;

        // Validate that all required columns are mapped
        const unmappedRequired = this.currentMapping.mappings.filter(
            m => m.required && !m.fileColumn
        );

        if (unmappedRequired.length > 0) {
            alert('Please map all required columns');
            return;
        }

        this.uploading = true;

        // Upload file with mapping
        this.inventoryService.uploadFile(this.currentFile, this.currentFileType!, this.currentMapping).subscribe({
            next: (result) => {
                // Close modal immediately on successful upload (200 response)
                this.showMappingDialog = false;
                this.uploading = false;
                
                const updatedFiles = {
                    ...this.uploadedFiles,
                    [this.pendingFileType!]: {
                        name: this.currentFile!.name,
                        uploadedAt: this.formatDate(result.uploadedAt),
                        valid: result.valid,
                        errors: result.errors || [],
                        columnMapping: this.currentMapping!,
                        rowsProcessed: result.rowsProcessed,
                        rowsInserted: result.rowsInserted,
                        rowsFailed: result.rowsFailed
                    }
                };

                this.inventoryService.setUploadedFilesState(updatedFiles);
                this.uploadedFiles = updatedFiles;
                this.resetMappingState();
            },
            error: (error) => {
                console.error('Error uploading file:', error);
                const errorMessage = error.error?.error?.message || error.message || 'Upload failed';
                const errorDetails = error.error?.error?.details || [];
                
                const updatedFiles = {
                    ...this.uploadedFiles,
                    [this.pendingFileType!]: {
                        name: this.currentFile!.name,
                        uploadedAt: new Date().toISOString(),
                        valid: false,
                        errors: [errorMessage, ...errorDetails],
                        columnMapping: this.currentMapping!
                    }
                };

                this.inventoryService.setUploadedFilesState(updatedFiles);
                this.uploadedFiles = updatedFiles;
                this.uploading = false;
            }
        });
    }

    cancelMapping() {
        this.showMappingDialog = false;
        this.resetMappingState();
    }

    private resetMappingState() {
        this.currentMapping = null;
        this.currentFileType = null;
        this.currentFile = null;
        this.pendingFileType = null;
        this.fileHeaders = [];
    }

    /**
     * Safely converts a date value to a Date object or ISO string
     * Handles various date formats from backend (array, ISO string, etc.)
     */
    formatDate(dateValue: any): string {
        if (!dateValue) {
            return new Date().toISOString();
        }
        
        // If it's already a string (ISO format), return it
        if (typeof dateValue === 'string') {
            // Check if it's a valid ISO date string
            const date = new Date(dateValue);
            if (!isNaN(date.getTime())) {
                return dateValue;
            }
        }
        
        // If it's an array format [year, month, day, hour, minute, second, nanosecond]
        if (Array.isArray(dateValue) && dateValue.length >= 3) {
            try {
                // Array format: [year, month, day, hour, minute, second, nanosecond]
                const year = dateValue[0];
                const month = dateValue[1] - 1; // JavaScript months are 0-indexed
                const day = dateValue[2];
                const hour = dateValue[3] || 0;
                const minute = dateValue[4] || 0;
                const second = dateValue[5] || 0;
                
                const date = new Date(year, month, day, hour, minute, second);
                return date.toISOString();
            } catch (e) {
                console.warn('Error parsing date array:', e);
            }
        }
        
        // Try to parse as Date
        try {
            const date = new Date(dateValue);
            if (!isNaN(date.getTime())) {
                return date.toISOString();
            }
        } catch (e) {
            console.warn('Error parsing date:', e);
        }
        
        // Fallback to current date
        return new Date().toISOString();
    }
}
