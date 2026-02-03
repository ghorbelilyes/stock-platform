import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { TransferService } from '../../../shared/services/transfer.service';
import { StatusPillComponent } from '../../../shared/components/status-pill/status-pill.component';
import { TransferSuggestion, Transfer } from '../../../shared/models/inventory.models';

interface LazyLoadEvent {
    first?: number;
    rows?: number | null;
    sortField?: string | string[] | null;
    sortOrder?: number | null;
    multiSortMeta?: { field: string; order: number }[] | null;
    filters?: any;
    globalFilter?: string | string[] | null;
}

@Component({
    selector: 'app-transfers',
    standalone: true,
    imports: [CommonModule, FormsModule, TranslateModule, TableModule, ButtonModule, DialogModule, StatusPillComponent, InputTextModule],
    template: `
        <div class="grid grid-cols-12 gap-8">
            <div class="col-span-12">
                <div class="card">
                    <div class="flex justify-between items-center mb-6">
                        <div>
                            <h1 class="text-surface-900 dark:text-surface-0 text-3xl font-semibold mb-2">{{ 'transfers.title' | translate }}</h1>
                            <p class="text-muted-color">{{ 'transfers.description' | translate }}</p>
                        </div>
                        <p-button [label]="'transfers.newTransfer' | translate" icon="pi pi-plus" (onClick)="showTransferWizard = true"></p-button>
                    </div>

                    <p-table [value]="suggestions" [paginator]="true" [rows]="10" [loading]="loadingSuggestions">
                        <ng-template pTemplate="header">
                            <tr>
                                <th>{{ 'common.from' | translate }}</th>
                                <th>{{ 'common.to' | translate }}</th>
                                <th>{{ 'common.product' | translate }}</th>
                                <th>{{ 'common.quantity' | translate }}</th>
                                <th>{{ 'common.priority' | translate }}</th>
                                <th>{{ 'common.reason' | translate }}</th>
                                <th>{{ 'common.confidence' | translate }}</th>
                                <th>{{ 'common.action' | translate }}</th>
                            </tr>
                        </ng-template>
                        <ng-template pTemplate="body" let-suggestion>
                            <tr>
                                <td>{{ suggestion.fromStoreName }}</td>
                                <td>{{ suggestion.toStoreName }}</td>
                                <td>{{ suggestion.productName }}</td>
                                <td>{{ suggestion.quantity }}</td>
                                <td>
                                    <app-status-pill 
                                        [status]="suggestion.priority === 'high' ? 'high' : suggestion.priority === 'medium' ? 'medium' : 'low-priority'"
                                        [label]="suggestion.priority">
                                    </app-status-pill>
                                </td>
                                <td>{{ suggestion.reason }}</td>
                                <td>{{ suggestion.confidence }}%</td>
                                <td>
                                    <p-button 
                                        [label]="'transfers.transfer' | translate" 
                                        icon="pi pi-check" 
                                        size="small"
                                        (onClick)="approveTransfer(suggestion.id)">
                                    </p-button>
                                </td>
                            </tr>
                        </ng-template>
                        <ng-template pTemplate="emptymessage">
                            <tr>
                                <td colspan="8" class="text-center py-8 text-muted-color">
                                    {{ 'transfers.noTransferSuggestions' | translate }}
                                </td>
                            </tr>
                        </ng-template>
                    </p-table>
                </div>
            </div>

            <div class="col-span-12">
                <div class="card">
                    <h2 class="text-surface-900 dark:text-surface-0 text-xl font-semibold mb-4">{{ 'transfers.activeTransfers' | translate }}</h2>
                    <p-table 
                        [value]="transfers" 
                        [paginator]="true" 
                        [rows]="pageSize"
                        [totalRecords]="totalRecords"
                        [lazy]="true"
                        (onLazyLoad)="loadTransfersDataLazy($event)"
                        [globalFilterFields]="['sourceStoreName', 'destinationStoreName', 'notes']"
                        [loading]="loadingTransfers"
                        [sortMode]="'multiple'"
                        (onSort)="onSort($event)"
                        #dt>
                        <ng-template pTemplate="caption">
                            <div class="flex justify-between items-center">
                                <span class="p-input-icon-left">
                                    <i class="pi pi-search"></i>
                                    <input
                                        pInputText
                                        type="text"
                                        [(ngModel)]="globalSearch"
                                        (input)="onGlobalSearch($event)"
                                        [placeholder]="'common.search' | translate" />
                                </span>
                            </div>
                        </ng-template>
                        <ng-template pTemplate="header">
                            <tr>
                                <th [pSortableColumn]="'createdAt'">
                                    {{ 'common.date' | translate }}
                                    <p-sortIcon [field]="'createdAt'"></p-sortIcon>
                                </th>
                                <th [pSortableColumn]="'sourceStoreName'">
                                    {{ 'transfers.sourceStore' | translate }}
                                    <p-sortIcon [field]="'sourceStoreName'"></p-sortIcon>
                                </th>
                                <th [pSortableColumn]="'destinationStoreName'">
                                    {{ 'transfers.destinationStore' | translate }}
                                    <p-sortIcon [field]="'destinationStoreName'"></p-sortIcon>
                                </th>
                                <th>{{ 'common.product' | translate }}</th>
                                <th [pSortableColumn]="'items.quantity'">
                                    {{ 'common.quantity' | translate }}
                                    <p-sortIcon [field]="'items.quantity'"></p-sortIcon>
                                </th>
                                <th [pSortableColumn]="'notes'">
                                    {{ 'transfers.notes' | translate }}
                                    <p-sortIcon [field]="'notes'"></p-sortIcon>
                                </th>
                            </tr>
                        </ng-template>
                        <ng-template pTemplate="body" let-transfer>
                            <tr>
                                <td>{{ transfer.createdAt | date:'short' }}</td>
                                <td>{{ transfer.sourceStoreName || transfer.sourceStoreId }}</td>
                                <td>{{ transfer.destinationStoreName || transfer.destinationStoreId }}</td>
                                <td>{{ transfer.items[0]?.productName || transfer.items[0]?.sku || 'N/A' }}</td>
                                <td>{{ transfer.items[0]?.quantity || 0 }}</td>
                                <td>{{ transfer.notes || 'N/A' }}</td>
                            </tr>
                        </ng-template>
                        <ng-template pTemplate="emptymessage">
                            <tr>
                                <td colspan="6" class="text-center py-8 text-muted-color">
                                    {{ 'common.noData' | translate }}
                                </td>
                            </tr>
                        </ng-template>
                    </p-table>
                </div>
            </div>
        </div>

        <p-dialog [(visible)]="showTransferWizard" [modal]="true" [style]="{width: '50vw'}" [header]="'transfers.createTransfer' | translate">
            <p>{{ 'transfers.wizardComingSoon' | translate }}</p>
        </p-dialog>
    `
})
export class TransfersComponent implements OnInit {
    private transferService = inject(TransferService);
    suggestions: TransferSuggestion[] = [];
    transfers: Transfer[] = [];
    globalSearch: string = '';
    currentSortField: string = 'date';
    currentSortOrder: number = -1;
    showTransferWizard = false;
    loadingSuggestions = false;
    loadingTransfers = false;
    totalRecords = 0;
    pageSize = 20;

    ngOnInit() {
        this.loadSuggestions();
        // Initial load will be triggered by lazy load
    }

    private loadSuggestions() {
        this.loadingSuggestions = true;
        this.suggestions = this.transferService.getSuggestions();
        this.loadingSuggestions = false;
    }

    loadTransfersDataLazy(event: LazyLoadEvent) {
        this.loadingTransfers = true;
        const page = event.first && event.rows ? Math.floor(event.first / event.rows) : 0;
        const size = event.rows || this.pageSize;
        
        this.pageSize = size;

        // Map UI sort fields to backend fields
        let sortField = Array.isArray(event.sortField) ? event.sortField[0] : event.sortField;
        if (sortField === 'createdAt') sortField = 'date';
        else if (sortField === 'sourceStoreName') sortField = 'idStoreSent';
        else if (sortField === 'destinationStoreName') sortField = 'idStoreReceive';
        else if (sortField === 'items.quantity') sortField = 'quantity';
        else if (sortField === 'notes') sortField = 'reason';

        const sortOrder = event.sortOrder ?? this.currentSortOrder;
        const sortParam = sortField ? `${sortField},${sortOrder === 1 ? 'asc' : 'desc'}` : `${this.currentSortField},${this.currentSortOrder === 1 ? 'asc' : 'desc'}`;

        const searchTerm = this.globalSearch?.trim() || undefined;

        this.transferService.getTransfers(page, size, sortParam, searchTerm).subscribe({
            next: (response) => {
                if (response && response.content) {
                    this.transfers = response.content;
                    this.totalRecords = response.totalElements || 0;
                } else if (Array.isArray(response)) {
                    this.transfers = response;
                    this.totalRecords = response.length;
                } else {
                    this.transfers = [];
                    this.totalRecords = 0;
                }
                this.loadingTransfers = false;
            },
            error: (error) => {
                console.error('Error loading transfers:', error);
                this.loadingTransfers = false;
                this.transfers = [];
                this.totalRecords = 0;
            }
        });
    }

    approveTransfer(suggestionId: string) {
        this.transferService.approveSuggestion(suggestionId, undefined).subscribe({
            next: (transfer) => {
                this.loadTransfersDataLazy({ first: 0, rows: this.pageSize, sortField: this.currentSortField, sortOrder: this.currentSortOrder });
                // Remove approved suggestion
                this.suggestions = this.suggestions.filter(s => s.id !== suggestionId);
            },
            error: (error) => {
                console.error('Error approving transfer:', error);
            }
        });
    }

    getTransferStatusType(status: string): 'ok' | 'low' | 'out' | 'high' | 'medium' | 'low-priority' {
        if (status === 'approved' || status === 'received' || status === 'closed') return 'ok';
        if (status === 'picked' || status === 'in_transit') return 'medium';
        return 'low-priority';
    }

    onGlobalSearch(event: any) {
        const lazyEvent: LazyLoadEvent = {
            first: 0,
            rows: this.pageSize,
            sortField: this.currentSortField,
            sortOrder: this.currentSortOrder
        };
        this.loadTransfersDataLazy(lazyEvent);
    }

    onSort(event: any) {
        let sortField = event.field;
        if (sortField === 'createdAt') sortField = 'date';
        else if (sortField === 'sourceStoreName') sortField = 'idStoreSent';
        else if (sortField === 'destinationStoreName') sortField = 'idStoreReceive';
        else if (sortField === 'items.quantity') sortField = 'quantity';
        else if (sortField === 'notes') sortField = 'reason';
        this.currentSortField = sortField;
        this.currentSortOrder = event.order;
        const lazyEvent: LazyLoadEvent = {
            first: 0,
            rows: this.pageSize,
            sortField: event.field,
            sortOrder: event.order,
            multiSortMeta: event.multiSortMeta
        };
        this.loadTransfersDataLazy(lazyEvent);
    }
}
