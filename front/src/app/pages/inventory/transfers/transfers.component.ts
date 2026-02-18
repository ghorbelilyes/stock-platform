import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { TransferService } from '../../../shared/services/transfer.service';
import { StatusPillComponent } from '../../../shared/components/status-pill/status-pill.component';
import { TransferSuggestion, Transfer } from '../../../shared/models/inventory.models';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

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
    imports: [CommonModule, FormsModule, TranslateModule, TableModule, ButtonModule, DialogModule, StatusPillComponent, InputTextModule, TextareaModule],
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
                                    <div class="flex gap-2">
                                        <p-button 
                                            [label]="'transfers.approve' | translate" 
                                            icon="pi pi-check" 
                                            size="small"
                                            severity="success"
                                            [loading]="approvingId === suggestion.id"
                                            (onClick)="approveTransfer(suggestion)"></p-button>
                                        <p-button 
                                            [label]="'transfers.dismiss' | translate" 
                                            icon="pi pi-times" 
                                            size="small"
                                            severity="secondary"
                                            (onClick)="openRejectModal(suggestion)"></p-button>
                                    </div>
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
                    <div class="flex justify-between items-center mb-4">
                        <h2 class="text-surface-900 dark:text-surface-0 text-xl font-semibold">{{ 'transfers.activeTransfers' | translate }}</h2>
                        <p-button 
                            [label]="'transfers.exportApproved' | translate" 
                            icon="pi pi-file-excel" 
                            severity="success" 
                            [outlined]="true"
                            (onClick)="exportApprovedTransfers()">
                        </p-button>
                    </div>
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
                                <th [pSortableColumn]="'id'">{{ 'transfers.id' | translate }}</th>
                                <th [pSortableColumn]="'createdAt'">
                                    {{ 'common.date' | translate }}
                                    <p-sortIcon [field]="'createdAt'"></p-sortIcon>
                                </th>
                                <th>{{ 'transfers.status' | translate }}</th>
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
                        <ng-template pTemplate="body" let-row>
                            <tr>
                                <td><span class="font-mono">{{ row.id }}</span></td>
                                <td>{{ row.createdAt | date:'short' }}</td>
                                <td>
                                    <app-status-pill 
                                        [status]="getTransferStatusType(row.status)"
                                        [label]="getTransferStatusLabel(row.status) | translate">
                                    </app-status-pill>
                                </td>
                                <td>{{ row.sourceStoreName || row.sourceStoreId }}</td>
                                <td>{{ row.destinationStoreName || row.destinationStoreId }}</td>
                                <td>{{ row.items[0]?.productName || row.items[0]?.sku || 'N/A' }}</td>
                                <td>{{ row.items[0]?.quantity || 0 }}</td>
                                <td>{{ row.notes || 'N/A' }}</td>
                            </tr>
                        </ng-template>
                        <ng-template pTemplate="emptymessage">
                            <tr>
                                <td colspan="8" class="text-center py-8 text-muted-color">
                                    {{ 'common.noData' | translate }}
                                </td>
                            </tr>
                        </ng-template>
                    </p-table>
                </div>
            </div>

            <div class="col-span-12">
                <div class="card">
                    <h2 class="text-surface-900 dark:text-surface-0 text-xl font-semibold mb-4">{{ 'transfers.rejectedTransfers' | translate }}</h2>
                    <p-table 
                        [value]="rejectedTransfers" 
                        [paginator]="true" 
                        [rows]="rejectedPageSize"
                        [totalRecords]="rejectedTotalRecords"
                        [lazy]="true"
                        (onLazyLoad)="loadRejectedTransfersLazy($event)"
                        [globalFilterFields]="['sourceStoreName', 'destinationStoreName', 'notes']"
                        [loading]="loadingRejected"
                        [sortMode]="'multiple'"
                        (onSort)="onRejectedSort($event)"
                        #dtRejected>
                        <ng-template pTemplate="caption">
                            <div class="flex justify-between items-center">
                                <span class="p-input-icon-left">
                                    <i class="pi pi-search"></i>
                                    <input
                                        pInputText
                                        type="text"
                                        [(ngModel)]="rejectedSearch"
                                        (input)="onRejectedSearch($event)"
                                        [placeholder]="'common.search' | translate" />
                                </span>
                            </div>
                        </ng-template>
                        <ng-template pTemplate="header">
                            <tr>
                                <th [pSortableColumn]="'id'">{{ 'transfers.id' | translate }}</th>
                                <th [pSortableColumn]="'createdAt'">
                                    {{ 'common.date' | translate }}
                                    <p-sortIcon [field]="'createdAt'"></p-sortIcon>
                                </th>
                                <th>{{ 'transfers.status' | translate }}</th>
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
                        <ng-template pTemplate="body" let-row>
                            <tr>
                                <td><span class="font-mono">{{ row.id }}</span></td>
                                <td>{{ row.createdAt | date:'short' }}</td>
                                <td>
                                    <app-status-pill 
                                        [status]="getTransferStatusType(row.status)"
                                        [label]="getTransferStatusLabel(row.status) | translate">
                                    </app-status-pill>
                                </td>
                                <td>{{ row.sourceStoreName || row.sourceStoreId }}</td>
                                <td>{{ row.destinationStoreName || row.destinationStoreId }}</td>
                                <td>{{ row.items[0]?.productName || row.items[0]?.sku || 'N/A' }}</td>
                                <td>{{ row.items[0]?.quantity || 0 }}</td>
                                <td>{{ row.notes || 'N/A' }}</td>
                            </tr>
                        </ng-template>
                        <ng-template pTemplate="emptymessage">
                            <tr>
                                <td colspan="8" class="text-center py-8 text-muted-color">
                                    {{ 'common.noData' | translate }}
                                </td>
                            </tr>
                        </ng-template>
                    </p-table>
                </div>
            </div>
        </div>

        <p-dialog [(visible)]="showRejectModal" [modal]="true" [style]="{width: '28rem'}" [header]="'transfers.rejectSuggestion' | translate"
            (onHide)="closeRejectModal()" [draggable]="false" [resizable]="false">
            <div class="flex flex-col gap-3">
                <label for="rejectNote">{{ 'transfers.rejectReason' | translate }}</label>
                <textarea id="rejectNote" pInputTextarea [(ngModel)]="rejectNote" [placeholder]="'transfers.rejectReasonPlaceholder' | translate" rows="4" class="w-full"></textarea>
            </div>
            <ng-template pTemplate="footer">
                <p-button [label]="'common.cancel' | translate" severity="secondary" (onClick)="closeRejectModal()"></p-button>
                <p-button [label]="'transfers.confirmReject' | translate" severity="danger" [loading]="rejecting" (onClick)="confirmReject()"></p-button>
            </ng-template>
        </p-dialog>

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
    showRejectModal = false;
    rejectNote = '';
    rejecting = false;
    suggestionToReject: TransferSuggestion | null = null;

    loadingSuggestions = false;
    loadingTransfers = false;
    totalRecords = 0;
    pageSize = 20;

    rejectedTransfers: Transfer[] = [];
    rejectedPageSize = 20;
    rejectedTotalRecords = 0;
    loadingRejected = false;
    rejectedSearch = '';
    rejectedSortField: string = 'date';
    rejectedSortOrder: number = -1;

    approvingId: string | null = null;

    ngOnInit() {
        this.loadSuggestions();
        // Initial load will be triggered by lazy load
    }

    loadSuggestions() {
        this.loadingSuggestions = true;
        this.transferService.getSuggestions().subscribe({
            next: (list) => {
                this.suggestions = list;
                this.loadingSuggestions = false;
            },
            error: () => {
                this.loadingSuggestions = false;
                this.suggestions = [];
            }
        });
    }

    openRejectModal(suggestion: TransferSuggestion) {
        this.suggestionToReject = suggestion;
        this.rejectNote = '';
        this.showRejectModal = true;
    }

    closeRejectModal() {
        this.showRejectModal = false;
        this.suggestionToReject = null;
        this.rejectNote = '';
    }

    confirmReject() {
        if (!this.suggestionToReject) return;
        this.rejecting = true;
        this.transferService.rejectSuggestion(this.suggestionToReject.id, this.rejectNote).subscribe({
            next: () => {
                this.rejecting = false;
                this.suggestions = this.suggestions.filter(s => s.id !== this.suggestionToReject!.id);
                this.closeRejectModal();
                this.loadRejectedTransfersLazy({ first: 0, rows: this.rejectedPageSize, sortField: this.rejectedSortField, sortOrder: this.rejectedSortOrder });
            },
            error: (err) => {
                console.error('Error rejecting suggestion:', err);
                this.rejecting = false;
            }
        });
    }

    loadRejectedTransfersLazy(event: LazyLoadEvent) {
        this.loadingRejected = true;
        const page = event.first != null && event.rows ? Math.floor(event.first / event.rows) : 0;
        const size = event.rows || this.rejectedPageSize;
        this.rejectedPageSize = size;

        let uiSortField: string | undefined = Array.isArray(event.sortField) ? (event.sortField[0] ?? undefined) : (event.sortField ?? undefined);
        let uiSortOrder: number | undefined = event.sortOrder ?? undefined;
        if (!uiSortField && event.multiSortMeta && event.multiSortMeta.length > 0) {
            uiSortField = event.multiSortMeta[0].field;
            uiSortOrder = event.multiSortMeta[0].order;
        }
        let sortField = uiSortField;
        if (sortField) {
            if (sortField === 'createdAt') sortField = 'date';
            else if (sortField === 'sourceStoreName') sortField = 'idStoreSent';
            else if (sortField === 'destinationStoreName') sortField = 'idStoreReceive';
            else if (sortField === 'items.quantity') sortField = 'quantity';
            else if (sortField === 'notes') sortField = 'reason';
        }
        if (!sortField) sortField = this.rejectedSortField || 'date';
        const sortOrder = uiSortOrder !== undefined && uiSortOrder !== null ? uiSortOrder : this.rejectedSortOrder;
        this.rejectedSortField = sortField;
        this.rejectedSortOrder = sortOrder;
        const sortParam = `${sortField},${sortOrder === 1 ? 'asc' : 'desc'}`;
        const searchTerm = this.rejectedSearch?.trim() || undefined;

        this.transferService.getTransfers(page, size, sortParam, searchTerm, { status: 'rejected' }).subscribe({
            next: (response) => {
                if (response?.content) {
                    this.rejectedTransfers = response.content;
                    this.rejectedTotalRecords = response.totalElements ?? 0;
                } else if (Array.isArray(response)) {
                    this.rejectedTransfers = response;
                    this.rejectedTotalRecords = response.length;
                } else {
                    this.rejectedTransfers = [];
                    this.rejectedTotalRecords = 0;
                }
                this.loadingRejected = false;
            },
            error: () => {
                this.loadingRejected = false;
                this.rejectedTransfers = [];
                this.rejectedTotalRecords = 0;
            }
        });
    }

    onRejectedSearch(_event: any) {
        this.loadRejectedTransfersLazy({ first: 0, rows: this.rejectedPageSize, sortField: this.rejectedSortField, sortOrder: this.rejectedSortOrder });
    }

    onRejectedSort(event: any) {
        this.rejectedSortField = event.field || this.rejectedSortField || 'date';
        this.rejectedSortOrder = event.order !== null && event.order !== undefined ? event.order : this.rejectedSortOrder;
    }

    loadTransfersDataLazy(event: LazyLoadEvent) {
        this.loadingTransfers = true;
        const page = event.first && event.rows ? Math.floor(event.first / event.rows) : 0;
        const size = event.rows || this.pageSize;

        this.pageSize = size;

        // Determine the UI sort field and order coming from PrimeNG
        let uiSortField: string | undefined = Array.isArray(event.sortField)
            ? (event.sortField[0] ?? undefined)
            : (event.sortField ?? undefined);
        let uiSortOrder: number | undefined = event.sortOrder ?? undefined;

        // In multiple sort mode, sort info is in multiSortMeta
        if (!uiSortField && event.multiSortMeta && event.multiSortMeta.length > 0) {
            uiSortField = event.multiSortMeta[0].field;
            uiSortOrder = event.multiSortMeta[0].order;
        }

        // Map UI sort fields to backend fields
        let sortField = uiSortField;
        if (sortField) {
            if (sortField === 'createdAt') sortField = 'date';
            else if (sortField === 'sourceStoreName') sortField = 'idStoreSent';
            else if (sortField === 'destinationStoreName') sortField = 'idStoreReceive';
            else if (sortField === 'items.quantity') sortField = 'quantity';
            else if (sortField === 'notes') sortField = 'reason';
            // If sortField doesn't match any UI field, it might already be a backend field name, keep it as is
        }

        // Fall back to current state if no sort info in event
        if (!sortField) {
            sortField = this.currentSortField || 'date';
        }
        const sortOrder = uiSortOrder !== undefined && uiSortOrder !== null ? uiSortOrder : this.currentSortOrder;

        // Update state for subsequent calls
        this.currentSortField = sortField;
        this.currentSortOrder = sortOrder;

        // Build sort parameter
        const sortParam = `${sortField},${sortOrder === 1 ? 'asc' : 'desc'}`;

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

    approveTransfer(suggestion: TransferSuggestion) {
        this.approvingId = suggestion.id;
        this.transferService.approveSuggestion(suggestion.id, suggestion.quantity).subscribe({
            next: () => {
                this.approvingId = null;
                this.loadTransfersDataLazy({ first: 0, rows: this.pageSize, sortField: this.currentSortField, sortOrder: this.currentSortOrder });
                this.suggestions = this.suggestions.filter(s => s.id !== suggestion.id);
            },
            error: (error) => {
                console.error('Error approving transfer:', error);
                this.approvingId = null;
            }
        });
    }

    getTransferStatusType(status: string): 'ok' | 'low' | 'out' | 'high' | 'medium' | 'low-priority' | 'overstock' {
        if (status === 'received' || status === 'closed') return 'ok';
        if (status === 'approved') return 'overstock';
        if (status === 'picked' || status === 'in_transit') return 'medium';
        if (status === 'rejected') return 'low-priority';
        return 'low-priority';
    }

    getTransferStatusLabel(status: string): string {
        if (status === 'in_transit' || status === 'picked') return 'transfers.statusInProgress';
        if (status === 'approved') return 'transfers.statusApproved';
        if (status === 'received') return 'transfers.statusReceived';
        if (status === 'closed') return 'transfers.statusClosed';
        if (status === 'rejected') return 'transfers.statusRejected';
        return 'transfers.statusProposed';
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
        // Just store the latest sort state; actual mapping is done in loadTransfersDataLazy
        this.currentSortField = event.field || this.currentSortField || 'date';
        this.currentSortOrder = event.order !== null && event.order !== undefined ? event.order : this.currentSortOrder;
    }

    exportApprovedTransfers() {
        // Fetch a larger batch of transfers to find all approved ones
        this.loadingTransfers = true;
        this.transferService.getTransfers(0, 1000).subscribe({
            next: (response) => {
                const allData = response.content || (Array.isArray(response) ? response : []);
                const approvedData = allData.filter((t: any) => t.status === 'approved');

                if (approvedData.length === 0) {
                    console.warn('No approved transfers found to export');
                    this.loadingTransfers = false;
                    return;
                }

                this.generateExcel(approvedData);
                this.loadingTransfers = false;
            },
            error: (err) => {
                console.error('Export failed', err);
                this.loadingTransfers = false;
            }
        });
    }

    private generateExcel(data: Transfer[]) {
        const worksheetData = data.map(t => ({
            'ID': t.id,
            'Date': new Date(t.createdAt).toLocaleString(),
            'Status': t.status,
            'Source Store': t.sourceStoreName,
            'Destination Store': t.destinationStoreName,
            'Product': t.items[0]?.productName || 'N/A',
            'Quantity': t.items[0]?.quantity || 0,
            'Notes': t.notes || ''
        }));

        const worksheet = XLSX.utils.json_to_sheet(worksheetData);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Approved Transfers');

        const excelBuffer: any = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
        const dataBlob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8' });
        saveAs(dataBlob, `approved_transfers_${new Date().getTime()}.xlsx`);
    }
}
