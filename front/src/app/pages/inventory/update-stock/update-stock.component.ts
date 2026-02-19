import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { ButtonModule } from 'primeng/button';
import { FileUploadModule } from 'primeng/fileupload';
import { TagModule } from 'primeng/tag';
import { DialogModule } from 'primeng/dialog';
import { SelectModule } from 'primeng/select';
import { FormsModule } from '@angular/forms';
import { MessageModule } from 'primeng/message';
import { CardModule } from 'primeng/card';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { firstValueFrom } from 'rxjs';
import { InventoryDataService } from '../../../shared/services/inventory-data.service';
import { ColumnMapping, FileMappingConfig, BACKEND_COLUMNS } from '../../../shared/models/inventory.models';

interface StockConsistencyValidationResult {
    valid: boolean;
    errors: string[];
    message?: string;
    newSalesRecords?: number;
    updateSalesRecords?: number;
    newTransferRecords?: number;
    updateTransferRecords?: number;
    updateStockRecords?: number;
    newSalesDetails?: string[];
    updateSalesDetails?: string[];
    newTransferDetails?: string[];
    updateTransferDetails?: string[];
}

@Component({
    selector: 'app-update-stock',
    standalone: true,
    imports: [
        CommonModule,
        TranslateModule,
        ButtonModule,
        FileUploadModule,
        TagModule,
        DialogModule,
        SelectModule,
        FormsModule,
        MessageModule,
        CardModule,
        ProgressSpinnerModule
    ],
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
        .validation-errors {
            max-height: 400px;
            overflow-y: auto;
        }
    `],
    template: `
        <div class="grid grid-cols-12 gap-8">
            <div class="col-span-12">
                <div class="card">
                    <h1 class="text-surface-900 dark:text-surface-0 text-3xl font-semibold mb-2">
                        {{ 'updateStock.title' | translate }}
                    </h1>
                    <p class="text-muted-color">{{ 'updateStock.description' | translate }}</p>
                </div>
            </div>

            <!-- Stock File -->
            <div class="col-span-12 md:col-span-4">
                <div class="card h-full">
                    <h2 class="text-surface-900 dark:text-surface-0 text-xl font-semibold mb-4">
                        {{ 'updateStock.stockFile' | translate }}
                    </h2>
                    <div class="mb-4">
                        <p-fileupload 
                            mode="basic" 
                            name="stock[]" 
                            accept=".csv" 
                            (onSelect)="onFileSelect($any($event), 'stock')"
                            [chooseLabel]="'upload.uploadCsv' | translate"
                            chooseIcon="pi pi-plus"
                            [auto]="true"
                            [showUploadButton]="false"
                            [showCancelButton]="false">
                        </p-fileupload>
                    </div>
                    @if (files.stock) {
                        <div class="mt-4">
                            <div class="flex items-center gap-2 mb-2">
                                <span class="font-medium">{{ files.stock.name }}</span>
                                <p-tag 
                                    [value]="files.stock.mapped ? ('updateStock.mapped' | translate) : ('updateStock.notMapped' | translate)" 
                                    [severity]="files.stock.mapped ? 'success' : 'warning'">
                                </p-tag>
                            </div>
                        </div>
                    }
                    <div class="mt-4 p-3 rounded dark:bg-surface-800">
                        <p class="text-sm font-medium mb-2 text-surface-900 dark:text-surface-100">
                            {{ 'updateStock.expectedColumns' | translate }}:
                        </p>
                        <code class="text-xs text-surface-700 dark:text-surface-100">id_store, id_product, quantity</code>
                    </div>
                </div>
            </div>

            <!-- Sales File -->
            <div class="col-span-12 md:col-span-4">
                <div class="card h-full">
                    <h2 class="text-surface-900 dark:text-surface-0 text-xl font-semibold mb-4">
                        {{ 'updateStock.salesFile' | translate }}
                    </h2>
                    <div class="mb-4">
                        <p-fileupload 
                            mode="basic" 
                            name="sales[]" 
                            accept=".csv" 
                            (onSelect)="onFileSelect($any($event), 'sales')"
                            [chooseLabel]="'upload.uploadCsv' | translate"
                            chooseIcon="pi pi-plus"
                            [auto]="true"
                            [showUploadButton]="false"
                            [showCancelButton]="false">
                        </p-fileupload>
                    </div>
                    @if (files.sales) {
                        <div class="mt-4">
                            <div class="flex items-center gap-2 mb-2">
                                <span class="font-medium">{{ files.sales.name }}</span>
                                <p-tag 
                                    [value]="files.sales.mapped ? ('updateStock.mapped' | translate) : ('updateStock.notMapped' | translate)" 
                                    [severity]="files.sales.mapped ? 'success' : 'warning'">
                                </p-tag>
                            </div>
                        </div>
                    }
                    <div class="mt-4 p-3 rounded dark:bg-surface-800">
                        <p class="text-sm font-medium mb-2 text-surface-900 dark:text-surface-100">
                            {{ 'updateStock.expectedColumns' | translate }}:
                        </p>
                        <code class="text-xs text-surface-700 dark:text-surface-100">id_store, id_product, quantity, range_date</code>
                    </div>
                </div>
            </div>

            <!-- Transfer File -->
            <div class="col-span-12 md:col-span-4">
                <div class="card h-full">
                    <h2 class="text-surface-900 dark:text-surface-0 text-xl font-semibold mb-4">
                        {{ 'updateStock.transferFile' | translate }}
                    </h2>
                    <div class="mb-4">
                        <p-fileupload 
                            mode="basic" 
                            name="transfer[]" 
                            accept=".csv" 
                            (onSelect)="onFileSelect($any($event), 'transfer')"
                            [chooseLabel]="'upload.uploadCsv' | translate"
                            chooseIcon="pi pi-plus"
                            [auto]="true"
                            [showUploadButton]="false"
                            [showCancelButton]="false">
                        </p-fileupload>
                    </div>
                    @if (files.transfer) {
                        <div class="mt-4">
                            <div class="flex items-center gap-2 mb-2">
                                <span class="font-medium">{{ files.transfer.name }}</span>
                                <p-tag 
                                    [value]="files.transfer.mapped ? ('updateStock.mapped' | translate) : ('updateStock.notMapped' | translate)" 
                                    [severity]="files.transfer.mapped ? 'success' : 'warning'">
                                </p-tag>
                            </div>
                        </div>
                    }
                    <div class="mt-4 p-3 rounded dark:bg-surface-800">
                        <p class="text-sm font-medium mb-2 text-surface-900 dark:text-surface-100">
                            {{ 'updateStock.expectedColumns' | translate }}:
                        </p>
                        <code class="text-xs text-surface-700 dark:text-surface-100">date, id_store_sent, id_store_receive, id_product, reason, quantity</code>
                    </div>
                </div>
            </div>

            <!-- Validation Buttons -->
            <div class="col-span-12">
                <div class="card">
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <!-- Validate Uploaded Files -->
                        <div class="flex flex-col gap-2">
                            <h3 class="text-surface-900 dark:text-surface-0 text-xl font-semibold">
                                {{ 'updateStock.validateConsistency' | translate }}
                            </h3>
                            <p class="text-muted-color text-sm">{{ 'updateStock.validateDescription' | translate }}</p>
                            <p-button 
                                [label]="'updateStock.validate' | translate" 
                                icon="pi pi-check"
                                [disabled]="!canValidate() || validating"
                                [loading]="validating"
                                (onClick)="validateConsistency()">
                            </p-button>
                        </div>
                        
                        <!-- Check Database Consistency -->
                        <div class="flex flex-col gap-2">
                            <h3 class="text-surface-900 dark:text-surface-0 text-xl font-semibold">
                                {{ 'updateStock.checkDatabaseConsistency' | translate }}
                            </h3>
                            <p class="text-muted-color text-sm">{{ 'updateStock.checkDatabaseDescription' | translate }}</p>
                            <p-button 
                                [label]="'updateStock.checkDatabase' | translate" 
                                icon="pi pi-database"
                                [disabled]="checkingDatabase"
                                [loading]="checkingDatabase"
                                (onClick)="checkDatabaseConsistency()">
                            </p-button>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Validation Results -->
            @if (validationResult) {
                <div class="col-span-12">
                    <div class="card">
                        <div class="flex items-center gap-2 mb-4">
                            <h3 class="text-surface-900 dark:text-surface-0 text-xl font-semibold">
                                {{ 'updateStock.validationResults' | translate }}
                            </h3>
                            <p-tag 
                                [value]="validationResult.valid ? ('updateStock.valid' | translate) : ('updateStock.invalid' | translate)" 
                                [severity]="validationResult.valid ? 'success' : 'danger'">
                            </p-tag>
                        </div>
                        
                        @if (validationResult.message) {
                            <p class="mb-4" [ngClass]="validationResult.valid ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'">
                                {{ validationResult.message }}
                            </p>
                        }

                        @if (validationResult.errors && validationResult.errors.length > 0) {
                            <div class="validation-errors mt-4">
                                <h4 class="text-surface-900 dark:text-surface-0 font-semibold mb-3 flex items-center gap-2">
                                    <i class="pi pi-exclamation-triangle text-red-500"></i>
                                    {{ 'updateStock.issuesFound' | translate }} ({{ validationResult.errors.length }}):
                                </h4>
                                <div class="flex flex-col gap-3">
                                    @for (error of validationResult.errors; track $index) {
                                        <div class="p-3 border-l-4 border-red-500 bg-red-50 dark:bg-red-900/20 rounded shadow-sm">
                                            <p class="text-sm font-medium text-red-700 dark:text-red-300 m-0">{{ error }}</p>
                                        </div>
                                    }
                                </div>
                            </div>
                        }

                        <!-- Record Analysis: New vs Updates -->
                        @if (validationResult.newSalesRecords !== undefined || validationResult.newTransferRecords !== undefined) {
                            <div class="mt-4 p-4 border border-surface-border rounded bg-surface-50 dark:bg-surface-800">
                                <h4 class="text-surface-900 dark:text-surface-0 font-semibold mb-3">
                                    {{ 'updateStock.recordAnalysis' | translate }}
                                </h4>
                                
                                <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                                    <!-- Sales Summary -->
                                    @if (validationResult.newSalesRecords !== undefined || validationResult.updateSalesRecords !== undefined) {
                                        <div class="p-3 border border-surface-border rounded">
                                            <h5 class="text-surface-900 dark:text-surface-0 font-medium mb-2">
                                                {{ 'updateStock.sales' | translate }}
                                            </h5>
                                            @if (validationResult.newSalesRecords && validationResult.newSalesRecords > 0) {
                                                <p class="text-sm text-green-600 dark:text-green-400 mb-1">
                                                    <i class="pi pi-plus-circle mr-1"></i>
                                                    {{ 'updateStock.newRecords' | translate }}: {{ validationResult.newSalesRecords }}
                                                </p>
                                            }
                                            @if (validationResult.updateSalesRecords && validationResult.updateSalesRecords > 0) {
                                                <p class="text-sm text-blue-600 dark:text-blue-400 mb-1">
                                                    <i class="pi pi-sync mr-1"></i>
                                                    {{ 'updateStock.updateRecords' | translate }}: {{ validationResult.updateSalesRecords }}
                                                </p>
                                            }
                                        </div>
                                    }
                                    
                                    <!-- Transfer Summary -->
                                    @if (validationResult.newTransferRecords !== undefined || validationResult.updateTransferRecords !== undefined) {
                                        <div class="p-3 border border-surface-border rounded">
                                            <h5 class="text-surface-900 dark:text-surface-0 font-medium mb-2">
                                                {{ 'updateStock.transfers' | translate }}
                                            </h5>
                                            @if (validationResult.newTransferRecords && validationResult.newTransferRecords > 0) {
                                                <p class="text-sm text-green-600 dark:text-green-400 mb-1">
                                                    <i class="pi pi-plus-circle mr-1"></i>
                                                    {{ 'updateStock.newRecords' | translate }}: {{ validationResult.newTransferRecords }}
                                                </p>
                                            }
                                            @if (validationResult.updateTransferRecords && validationResult.updateTransferRecords > 0) {
                                                <p class="text-sm text-blue-600 dark:text-blue-400 mb-1">
                                                    <i class="pi pi-sync mr-1"></i>
                                                    {{ 'updateStock.updateRecords' | translate }}: {{ validationResult.updateTransferRecords }}
                                                </p>
                                            }
                                        </div>
                                    }
                                    
                                    <!-- Stock Summary -->
                                    @if (validationResult.updateStockRecords !== undefined && validationResult.updateStockRecords > 0) {
                                        <div class="p-3 border border-surface-border rounded">
                                            <h5 class="text-surface-900 dark:text-surface-0 font-medium mb-2">
                                                {{ 'updateStock.stock' | translate }}
                                            </h5>
                                            <p class="text-sm text-blue-600 dark:text-blue-400 mb-1">
                                                <i class="pi pi-sync mr-1"></i>
                                                {{ 'updateStock.updateRecords' | translate }}: {{ validationResult.updateStockRecords }}
                                            </p>
                                        </div>
                                    }
                                </div>
                                
                                <!-- Detailed Lists -->
                                @if (validationResult.newSalesDetails && validationResult.newSalesDetails.length > 0) {
                                    <div class="mb-3">
                                        <h5 class="text-surface-900 dark:text-surface-0 font-medium mb-2 text-green-600 dark:text-green-400">
                                            <i class="pi pi-plus-circle mr-1"></i>
                                            {{ 'updateStock.newSalesDetails' | translate }}
                                        </h5>
                                        <ul class="list-none p-0 m-0 text-sm">
                                            @for (detail of validationResult.newSalesDetails; track $index) {
                                                <li class="mb-1 text-muted-color">{{ detail }}</li>
                                            }
                                        </ul>
                                    </div>
                                }
                                
                                @if (validationResult.updateSalesDetails && validationResult.updateSalesDetails.length > 0) {
                                    <div class="mb-3">
                                        <h5 class="text-surface-900 dark:text-surface-0 font-medium mb-2 text-blue-600 dark:text-blue-400">
                                            <i class="pi pi-sync mr-1"></i>
                                            {{ 'updateStock.updateSalesDetails' | translate }}
                                        </h5>
                                        <ul class="list-none p-0 m-0 text-sm">
                                            @for (detail of validationResult.updateSalesDetails; track $index) {
                                                <li class="mb-1 text-muted-color">{{ detail }}</li>
                                            }
                                        </ul>
                                    </div>
                                }
                                
                                @if (validationResult.newTransferDetails && validationResult.newTransferDetails.length > 0) {
                                    <div class="mb-3">
                                        <h5 class="text-surface-900 dark:text-surface-0 font-medium mb-2 text-green-600 dark:text-green-400">
                                            <i class="pi pi-plus-circle mr-1"></i>
                                            {{ 'updateStock.newTransferDetails' | translate }}
                                        </h5>
                                        <ul class="list-none p-0 m-0 text-sm">
                                            @for (detail of validationResult.newTransferDetails; track $index) {
                                                <li class="mb-1 text-muted-color">{{ detail }}</li>
                                            }
                                        </ul>
                                    </div>
                                }
                                
                                @if (validationResult.updateTransferDetails && validationResult.updateTransferDetails.length > 0) {
                                    <div class="mb-3">
                                        <h5 class="text-surface-900 dark:text-surface-0 font-medium mb-2 text-blue-600 dark:text-blue-400">
                                            <i class="pi pi-sync mr-1"></i>
                                            {{ 'updateStock.updateTransferDetails' | translate }}
                                        </h5>
                                        <ul class="list-none p-0 m-0 text-sm">
                                            @for (detail of validationResult.updateTransferDetails; track $index) {
                                                <li class="mb-1 text-muted-color">{{ detail }}</li>
                                            }
                                        </ul>
                                    </div>
                                }
                            </div>
                        }
                        
                        @if (validationResult.valid) {
                            <div class="mt-4">
                                <p class="text-muted-color mb-2">{{ 'updateStock.validMessage' | translate }}</p>
                                <p-button 
                                    [label]="'updateStock.uploadFiles' | translate" 
                                    icon="pi pi-upload"
                                    [loading]="uploading"
                                    [disabled]="uploading"
                                    (onClick)="uploadFiles()">
                                </p-button>
                            </div>
                        }
                    </div>
                </div>
            }

            <!-- Upload Results -->
            @if (uploading || (uploadResults.stock || uploadResults.sales || uploadResults.transfer)) {
                <div class="col-span-12">
                    <div class="card">
                        <h3 class="text-surface-900 dark:text-surface-0 text-xl font-semibold mb-4">
                            {{ 'updateStock.uploadResults' | translate }}
                        </h3>
                        
                        @if (uploading) {
                            <div class="flex items-center gap-2 mb-4">
                                <p-progressSpinner [style]="{ width: '20px', height: '20px' }"></p-progressSpinner>
                                <span class="text-muted-color">{{ 'updateStock.uploading' | translate }}</span>
                            </div>
                        }

                        @if (uploadResults.stock) {
                            <div class="mb-3">
                                <div class="flex items-center gap-2 mb-2">
                                    <strong>{{ 'updateStock.stockFile' | translate }}:</strong>
                                    <p-tag 
                                        [value]="uploadResults.stock.success ? ('common.success' | translate) : ('common.error' | translate)" 
                                        [severity]="uploadResults.stock.success ? 'success' : 'danger'">
                                    </p-tag>
                                </div>
                                <p class="text-sm" [ngClass]="uploadResults.stock.success ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'">
                                    {{ uploadResults.stock.message }}
                                </p>
                                @if (uploadResults.stock.errors && uploadResults.stock.errors.length > 0) {
                                    <ul class="list-none p-0 m-0 mt-2">
                                        @for (error of uploadResults.stock.errors; track $index) {
                                            <li class="mb-1">
                                                <p-message severity="error" [text]="error"></p-message>
                                            </li>
                                        }
                                    </ul>
                                }
                            </div>
                        }

                        @if (uploadResults.sales) {
                            <div class="mb-3">
                                <div class="flex items-center gap-2 mb-2">
                                    <strong>{{ 'updateStock.salesFile' | translate }}:</strong>
                                    <p-tag 
                                        [value]="uploadResults.sales.success ? ('common.success' | translate) : ('common.error' | translate)" 
                                        [severity]="uploadResults.sales.success ? 'success' : 'danger'">
                                    </p-tag>
                                </div>
                                <p class="text-sm" [ngClass]="uploadResults.sales.success ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'">
                                    {{ uploadResults.sales.message }}
                                </p>
                                @if (uploadResults.sales.errors && uploadResults.sales.errors.length > 0) {
                                    <ul class="list-none p-0 m-0 mt-2">
                                        @for (error of uploadResults.sales.errors; track $index) {
                                            <li class="mb-1">
                                                <p-message severity="error" [text]="error"></p-message>
                                            </li>
                                        }
                                    </ul>
                                }
                            </div>
                        }

                        @if (uploadResults.transfer) {
                            <div class="mb-3">
                                <div class="flex items-center gap-2 mb-2">
                                    <strong>{{ 'updateStock.transferFile' | translate }}:</strong>
                                    <p-tag 
                                        [value]="uploadResults.transfer.success ? ('common.success' | translate) : ('common.error' | translate)" 
                                        [severity]="uploadResults.transfer.success ? 'success' : 'danger'">
                                    </p-tag>
                                </div>
                                <p class="text-sm" [ngClass]="uploadResults.transfer.success ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'">
                                    {{ uploadResults.transfer.message }}
                                </p>
                                @if (uploadResults.transfer.errors && uploadResults.transfer.errors.length > 0) {
                                    <ul class="list-none p-0 m-0 mt-2">
                                        @for (error of uploadResults.transfer.errors; track $index) {
                                            <li class="mb-1">
                                                <p-message severity="error" [text]="error"></p-message>
                                            </li>
                                        }
                                    </ul>
                                }
                            </div>
                        }
                    </div>
                </div>
            }

            <!-- Database Consistency Results -->
            @if (databaseConsistencyResult) {
                <div class="col-span-12">
                    <div class="card">
                        <div class="flex items-center gap-2 mb-4">
                            <h3 class="text-surface-900 dark:text-surface-0 text-xl font-semibold">
                                {{ 'updateStock.databaseConsistencyResults' | translate }}
                            </h3>
                            <p-tag 
                                [value]="databaseConsistencyResult.valid ? ('updateStock.valid' | translate) : ('updateStock.invalid' | translate)" 
                                [severity]="databaseConsistencyResult.valid ? 'success' : 'danger'">
                            </p-tag>
                        </div>
                        
                        @if (databaseConsistencyResult.message) {
                            <p class="mb-4" [ngClass]="databaseConsistencyResult.valid ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'">
                                {{ databaseConsistencyResult.message }}
                            </p>
                        }

                        @if (databaseConsistencyResult.errors && databaseConsistencyResult.errors.length > 0) {
                            <div class="validation-errors">
                                <h4 class="text-surface-900 dark:text-surface-0 font-semibold mb-2">
                                    {{ 'updateStock.issuesFound' | translate }} ({{ databaseConsistencyResult.errors.length }}):
                                </h4>
                                <ul class="list-none p-0 m-0">
                                    @for (error of databaseConsistencyResult.errors; track $index) {
                                        <li class="mb-2">
                                            <p-message severity="error" [text]="error"></p-message>
                                        </li>
                                    }
                                </ul>
                            </div>
                        }
                    </div>
                </div>
            }
        </div>

        <!-- Column Mapping Dialog -->
        <p-dialog 
            [(visible)]="showMappingDialog" 
            [modal]="true" 
            [style]="{ width: '700px', maxHeight: '80vh' }"
            [contentStyle]="{ 'max-height': '60vh', 'overflow-y': 'auto' }"
            [header]="'upload.mapping' | translate"
            [closable]="true">
            <ng-template #content>
                @if (currentMapping && fileHeaders.length > 0) {
                    <div class="flex flex-col gap-4">
                        <p class="text-muted-color mb-2">{{ 'upload.mappingDescription' | translate }} <span class="text-red-500">*</span></p>
                        <div class="grid grid-cols-12 gap-4 mb-2 pb-2 border-b border-surface-border">
                            <div class="col-span-6">
                                <label class="block text-sm font-semibold text-surface-900 dark:text-surface-0">{{ 'upload.fileColumn' | translate }}</label>
                            </div>
                            <div class="col-span-6">
                                <label class="block text-sm font-semibold text-surface-900 dark:text-surface-0">{{ 'upload.backendColumn' | translate }}</label>
                            </div>
                        </div>
                        @for (mapping of currentMapping.mappings; track mapping.backendColumn) {
                            <div class="grid grid-cols-12 gap-4 items-center py-2">
                                <div class="col-span-6 w-full">
                                    <p-select 
                                        [(ngModel)]="mapping.fileColumn"
                                        [options]="getFileColumnOptions()"
                                        [placeholder]="'upload.selectFileColumn' | translate"
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
                <p-button [label]="'common.cancel' | translate" icon="pi pi-times" text (click)="cancelMapping()" />
                <p-button [label]="'upload.saveMapping' | translate" icon="pi pi-check" (click)="saveMapping()" />
            </ng-template>
        </p-dialog>
    `
})
export class UpdateStockComponent implements OnInit {
    private inventoryService = inject(InventoryDataService);

    files: {
        stock?: { name: string; file: File; mapped: boolean; mapping?: FileMappingConfig };
        sales?: { name: string; file: File; mapped: boolean; mapping?: FileMappingConfig };
        transfer?: { name: string; file: File; mapped: boolean; mapping?: FileMappingConfig };
    } = {};

    fileHeaders: string[] = [];
    currentMapping?: FileMappingConfig;
    pendingFileType?: 'stock' | 'sales' | 'transfer';
    currentFile?: File;
    showMappingDialog = false;
    validating = false;
    validationResult?: StockConsistencyValidationResult;
    checkingDatabase = false;
    databaseConsistencyResult?: StockConsistencyValidationResult;
    uploading = false;
    uploadResults: {
        stock?: { success: boolean; message: string; errors?: string[] };
        sales?: { success: boolean; message: string; errors?: string[] };
        transfer?: { success: boolean; message: string; errors?: string[] };
    } = {};

    ngOnInit() {
        // Component initialization
    }

    async onFileSelect(event: any, fileType: 'stock' | 'sales' | 'transfer') {
        const file = event.files?.[0] || event.target?.files?.[0];
        if (!file) return;

        this.files[fileType] = {
            name: file.name,
            file: file,
            mapped: false
        };

        // Parse headers
        try {
            this.fileHeaders = await this.inventoryService.parseCSVHeaders(file);
            this.pendingFileType = fileType;
            this.currentFile = file;

            // Get required columns
            this.inventoryService.getRequiredColumns(fileType).subscribe({
                next: (requiredColumns) => {
                    // Create mapping config with auto-matching
                    const mappings: ColumnMapping[] = requiredColumns.map(backendCol => {
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

                    this.currentMapping = {
                        fileType: fileType,
                        mappings
                    };
                    this.showMappingDialog = true;
                },
                error: (error) => {
                    console.error('Error fetching required columns:', error);
                    // Fallback to local constant
                    const backendColumns = [...BACKEND_COLUMNS[fileType]];
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

                    this.currentMapping = {
                        fileType: fileType,
                        mappings
                    };
                    this.showMappingDialog = true;
                }
            });
        } catch (error) {
            console.error('Error parsing headers:', error);
        }
    }

    getFileColumnOptions(): string[] {
        const validHeaders = this.fileHeaders.filter(h => h && h.trim() !== '');
        return ['', ...validHeaders];
    }

    saveMapping() {
        if (!this.currentMapping || !this.pendingFileType) return;

        const fileData = this.files[this.pendingFileType];
        if (fileData) {
            fileData.mapping = { ...this.currentMapping };
            fileData.mapped = true;
        }

        this.showMappingDialog = false;
        this.currentMapping = undefined;
        this.pendingFileType = undefined;
        this.currentFile = undefined;
    }

    cancelMapping() {
        this.showMappingDialog = false;
        this.currentMapping = undefined;
        this.pendingFileType = undefined;
        this.currentFile = undefined;
    }

    canValidate(): boolean {
        return !!(this.files.stock?.mapped && this.files.sales?.mapped && this.files.transfer?.mapped);
    }

    validateConsistency() {
        if (!this.canValidate()) return;

        this.validating = true;
        this.validationResult = undefined;

        this.inventoryService.validateStockConsistency(
            this.files.stock!.file,
            this.files.sales!.file,
            this.files.transfer!.file,
            this.files.stock!.mapping!,
            this.files.sales!.mapping!,
            this.files.transfer!.mapping!
        ).subscribe({
            next: (result) => {
                this.validationResult = result;
                this.validating = false;
            },
            error: (error) => {
                console.error('Validation error:', error);
                this.validationResult = {
                    valid: false,
                    errors: [error.error?.error?.message || 'Validation failed'],
                    message: 'Failed to validate consistency'
                };
                this.validating = false;
            }
        });
    }

    checkDatabaseConsistency() {
        this.checkingDatabase = true;
        this.databaseConsistencyResult = undefined;

        this.inventoryService.checkDatabaseConsistency().subscribe({
            next: (result) => {
                this.databaseConsistencyResult = result;
                this.checkingDatabase = false;
            },
            error: (error) => {
                console.error('Database consistency check error:', error);
                this.databaseConsistencyResult = {
                    valid: false,
                    errors: [error.error?.error?.message || 'Database consistency check failed'],
                    message: 'Failed to check database consistency'
                };
                this.checkingDatabase = false;
            }
        });
    }

    uploadFiles() {
        if (!this.validationResult?.valid || !this.canValidate()) {
            return;
        }

        this.uploading = true;
        this.uploadResults = {};

        // Upload files sequentially
        const uploadPromises: Promise<any>[] = [];

        // Upload stock file
        if (this.files.stock?.file && this.files.stock?.mapping) {
            uploadPromises.push(
                firstValueFrom(
                    this.inventoryService.uploadFile(
                        this.files.stock.file,
                        'stock',
                        this.files.stock.mapping
                    )
                ).then(
                    (result) => {
                        this.uploadResults.stock = {
                            success: result.valid || false,
                            message: result.valid
                                ? `Stock file uploaded successfully. ${result.rowsInserted} rows inserted.`
                                : `Stock file upload failed. ${result.rowsFailed} rows failed.`,
                            errors: result.errors || []
                        };
                    }
                ).catch((error) => {
                    this.uploadResults.stock = {
                        success: false,
                        message: 'Failed to upload stock file',
                        errors: [error.error?.error?.message || error.message || 'Unknown error']
                    };
                })
            );
        }

        // Upload sales file
        if (this.files.sales?.file && this.files.sales?.mapping) {
            uploadPromises.push(
                firstValueFrom(
                    this.inventoryService.uploadFile(
                        this.files.sales.file,
                        'sales',
                        this.files.sales.mapping
                    )
                ).then(
                    (result) => {
                        this.uploadResults.sales = {
                            success: result.valid || false,
                            message: result.valid
                                ? `Sales file uploaded successfully. ${result.rowsInserted} rows inserted.`
                                : `Sales file upload failed. ${result.rowsFailed} rows failed.`,
                            errors: result.errors || []
                        };
                    }
                ).catch((error) => {
                    this.uploadResults.sales = {
                        success: false,
                        message: 'Failed to upload sales file',
                        errors: [error.error?.error?.message || error.message || 'Unknown error']
                    };
                })
            );
        }

        // Upload transfer file
        if (this.files.transfer?.file && this.files.transfer?.mapping) {
            uploadPromises.push(
                firstValueFrom(
                    this.inventoryService.uploadFile(
                        this.files.transfer.file,
                        'transfer',
                        this.files.transfer.mapping
                    )
                ).then(
                    (result) => {
                        this.uploadResults.transfer = {
                            success: result.valid || false,
                            message: result.valid
                                ? `Transfer file uploaded successfully. ${result.rowsInserted} rows inserted.`
                                : `Transfer file upload failed. ${result.rowsFailed} rows failed.`,
                            errors: result.errors || []
                        };
                    }
                ).catch((error) => {
                    this.uploadResults.transfer = {
                        success: false,
                        message: 'Failed to upload transfer file',
                        errors: [error.error?.error?.message || error.message || 'Unknown error']
                    };
                })
            );
        }

        // Wait for all uploads to complete
        Promise.all(uploadPromises).finally(() => {
            this.uploading = false;
        });
    }
}
