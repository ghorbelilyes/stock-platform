import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { TableModule, TableLazyLoadEvent } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { InputTextModule } from 'primeng/inputtext';
import { SelectButtonModule } from 'primeng/selectbutton';
import { ButtonModule } from 'primeng/button';
import { RippleModule } from 'primeng/ripple';
import { InventoryDataService } from '../../../shared/services/inventory-data.service';

type ViewMode = 'store' | 'product';

interface StockData {
    rowKey: string;
    idStore: number;
    idProduct: number;
    quantity: number;
    /** Quantity coming to this store for this product (approved or in_transit to this store) - Incoming */
    incomingQty: number;
    /** Quantity already shipped from this store for this product (transfers in_transit from this store) - In Transit (outgoing) */
    outToTransit: number;
    /** Quantity from approved transfers from this store for this product that are not yet shipped - Reserved */
    quantityForTransfer: number;
    /** Projected quantity after all transfers are completed: quantity - outToTransit + incomingQty */
    virtualQuantity: number;
    /** Quantity sold in the last 30 days */
    soldLast30Days: number;
    /** Average daily sales (soldLast30Days / 30) */
    avgDailySales: number;
    /** Days of cover (quantity / avgDailySales) */
    daysOfCover: number;
    store?: {
        id: number;
        name: string;
        city: string;
        type: string;
        serialNumber: string;
    };
    product?: {
        id: number;
        name: string;
        codeBarre: string;
        description?: string;
    };
}

@Component({
    selector: 'app-stock',
    standalone: true,
    imports: [CommonModule, FormsModule, TranslateModule, TableModule, TagModule, InputTextModule, SelectButtonModule, ButtonModule, RippleModule],
    styles: [`
        :host .stock-table-row:hover {
            background-color: color-mix(in srgb, var(--primary-color) 8%, transparent) !important;
        }
        :host .stock-table-row.p-row-expanded {
            background-color: color-mix(in srgb, var(--primary-color) 12%, transparent) !important;
            border-bottom: none;
        }
        :host .stock-expansion-cell {
            background-color: var(--surface-ground) !important;
            border-left: 4px solid var(--primary-color);
            padding: 0 !important;
        }
        :host .expansion-container {
            padding: 1.5rem;
            background: linear-gradient(0deg, color-mix(in srgb, var(--primary-color) 15%, transparent) 0%, transparent 100%);
        }
        :host .stat-card {
            background: var(--surface-card);
            border: 1px solid var(--surface-border);
            border-radius: 12px;
            padding: 1rem;
            display: flex;
            align-items: center;
            justify-content: space-between;
            box-shadow: 0 2px 4px rgba(0,0,0,0.02);
            transition: all 0.2s ease;
        }
        :host .stat-card:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(0,0,0,0.05);
            border-color: var(--primary-color);
        }
        :host .stock-projected-icon,
        :host .stock-projected-value {
            color: var(--primary-color) !important;
        }
        :host .transfers-inner-table ::ng-deep .p-datatable .p-datatable-thead > tr > th {
            background-color: var(--surface-100) !important;
            font-size: 0.75rem;
            text-transform: uppercase;
            letter-spacing: 0.05em;
            padding: 0.75rem 1rem;
        }
        :host .transfers-inner-table ::ng-deep .p-datatable .p-datatable-tbody > tr {
            background-color: var(--surface-card) !important;
        }
    `],
    template: `
        <div class="grid grid-cols-12 gap-8">
            <div class="col-span-12">
                <div class="card">
                    <div class="flex flex-wrap justify-between items-start gap-4 mb-6">
                        <div>
                            <h1 class="text-surface-900 dark:text-surface-0 text-3xl font-semibold mb-2">{{ 'stock.title' | translate }}</h1>
                            <p class="text-muted-color">{{ 'stock.description' | translate }}</p>
                        </div>
                        <div class="flex items-center gap-2">
                            <span class="text-sm font-medium text-surface-600 dark:text-surface-400">{{ 'stock.viewMode' | translate }}:</span>
                            <p-selectButton [options]="viewModeOptions" [(ngModel)]="viewMode" (onChange)="onViewModeChange()" optionLabel="label" optionValue="value"></p-selectButton>
                        </div>
                    </div>
                    <p-table 
                        [value]="stockData" 
                        dataKey="rowKey"
                        [expandedRowKeys]="expandedRows"
                        (onRowExpand)="onRowExpand($event)"
                        [paginator]="true" 
                        [rows]="pageSize" 
                        [totalRecords]="totalRecords"
                        [lazy]="true"
                        (onLazyLoad)="loadStockDataLazy($event)"
                        [globalFilterFields]="['store.name', 'store.city', 'store.type', 'product.name']" 
                        [loading]="loading"
                        [sortMode]="'single'"
                        (onSort)="onSort($event)"
                        [filterDelay]="300"
                        [filters]="tableFilters"
                        (onFilter)="onFilter($event)"
                        [tableStyle]="{ 'min-width': '50rem' }"
                        #dt>
                        <ng-template pTemplate="caption">
                            <div class="flex flex-wrap justify-between items-center gap-4">
                                <span class="p-input-icon-left flex-1 min-w-[200px]">
                                    <i class="pi pi-search"></i>
                                    <input 
                                        pInputText 
                                        type="text" 
                                        [(ngModel)]="globalSearch"
                                        (input)="onGlobalSearch($event)"
                                        [placeholder]="'stock.searchPlaceholder' | translate" 
                                        class="w-full"
                                    />
                                </span>
                            </div>
                        </ng-template>
                        <ng-template pTemplate="header">
                            <tr>
                                <th style="width: 3rem"></th>
                                <th [pSortableColumn]="'store.name'">
                                    <div class="flex items-center justify-between gap-2">
                                        <div class="flex items-center gap-2">
                                            <span>{{ 'stock.storeName' | translate }}</span>
                                            <p-sortIcon [field]="'store.name'"></p-sortIcon>
                                        </div>
                                        <p-columnFilter type="text" field="store.name" display="menu" [showMatchModes]="false" matchMode="contains"></p-columnFilter>
                                    </div>
                                </th>
                                <th [pSortableColumn]="'store.city'">
                                    <div class="flex items-center justify-between gap-2">
                                        <div class="flex items-center gap-2">
                                            <span>{{ 'common.city' | translate }}</span>
                                            <p-sortIcon [field]="'store.city'"></p-sortIcon>
                                        </div>
                                        <p-columnFilter type="text" field="store.city" display="menu" [showMatchModes]="false" matchMode="contains"></p-columnFilter>
                                    </div>
                                </th>
                                <th [pSortableColumn]="'store.type'">
                                    <div class="flex items-center justify-between gap-2">
                                        <div class="flex items-center gap-2">
                                            <span>{{ 'common.type' | translate }}</span>
                                            <p-sortIcon [field]="'store.type'"></p-sortIcon>
                                        </div>
                                        <p-columnFilter type="text" field="store.type" display="menu" [showMatchModes]="false" matchMode="contains"></p-columnFilter>
                                    </div>
                                </th>
                                <th [pSortableColumn]="'product.name'">
                                    <div class="flex items-center justify-between gap-2">
                                        <div class="flex items-center gap-2">
                                            <span>{{ 'stock.productName' | translate }}</span>
                                            <p-sortIcon [field]="'product.name'"></p-sortIcon>
                                        </div>
                                        <p-columnFilter type="text" field="product.name" display="menu" [showMatchModes]="false" matchMode="contains"></p-columnFilter>
                                    </div>
                                </th>
                                <th [pSortableColumn]="'quantity'">
                                    <div class="flex items-center gap-2">
                                        <span [attr.title]="'stock.onHandTooltip' | translate">{{ 'stock.onHand' | translate }}</span>
                                        <p-sortIcon [field]="'quantity'"></p-sortIcon>
                                    </div>
                                </th>
                                <th>
                                    <span [attr.title]="'stock.availableTooltip' | translate">{{ 'stock.available' | translate }}</span>
                                </th>
                                <th>
                                    <span [attr.title]="'stock.incomingTooltip' | translate">{{ 'stock.incoming' | translate }}</span>
                                </th>
                                <th>
                                    <span [attr.title]="'stock.soldTooltip' | translate">{{ 'stock.soldLast30Days' | translate }}</span>
                                </th>
                                <th>
                                    <span [attr.title]="'stock.avgDailyTooltip' | translate">{{ 'stock.avgDailySales' | translate }}</span>
                                </th>
                                <th>
                                    <span [attr.title]="'stock.daysOfCoverTooltip' | translate">{{ 'stock.daysOfCover' | translate }}</span>
                                </th>
                                <th>{{ 'common.status' | translate }}</th>
                            </tr>
                        </ng-template>
                        <ng-template pTemplate="emptymessage">
                            <tr>
                                <td colspan="12" class="text-center py-8 text-muted-color">
                                    <div *ngIf="!loading">
                                        <p class="mb-2">{{ 'common.noData' | translate }}</p>
                                    </div>
                                </td>
                            </tr>
                        </ng-template>
                        <ng-template pTemplate="body" let-stock let-expanded="expanded">
                            <tr [pRowToggler]="stock" class="cursor-pointer stock-table-row">
                                <td>
                                    <i class="pi" [ngClass]="expanded ? 'pi-chevron-down' : 'pi-chevron-right'"></i>
                                </td>
                                <td>{{ stock.store?.name || 'N/A' }}</td>
                                <td>{{ stock.store?.city || 'N/A' }}</td>
                                <td>
                                    <p-tag [value]="stock.store?.type || 'N/A'" [severity]="getStoreTypeSeverity(stock.store?.type)"></p-tag>
                                </td>
                                <td>{{ stock.product?.name || 'N/A' }}</td>
                                <td>{{ stock.quantity }}</td>
                                <td>
                                    <span [class.font-semibold]="getAvailable(stock) !== stock.quantity">{{ getAvailable(stock) }}</span>
                                </td>
                                <td>
                                    <span *ngIf="stock.incomingQty > 0" class="font-medium text-primary">+{{ stock.incomingQty }}</span>
                                    <span *ngIf="stock.incomingQty === 0" class="text-muted-color">0</span>
                                </td>
                                <td>{{ stock.soldLast30Days }}</td>
                                <td>{{ stock.avgDailySales | number:'1.2-2' }}</td>
                                <td>
                                    <span [class.text-red-500]="stock.daysOfCover < 10" [class.font-bold]="stock.daysOfCover < 10">
                                        {{ stock.daysOfCover > 900 ? '∞' : (stock.daysOfCover | number:'1.1-1') }}
                                    </span>
                                </td>
                                <td>
                                    <p-tag [value]="getStockStatusLabel(stock)" [severity]="getStockStatusSeverity(stock)"></p-tag>
                                </td>
                            </tr>
                        </ng-template>
                        <ng-template pTemplate="expandedrow" let-stock>
                            <tr>
                                <td colspan="12" class="stock-expansion-cell">
                                    <div class="expansion-container">
                                        <!-- Loading state -->
                                        <div *ngIf="loadingTransfers[stock.rowKey]" class="flex flex-col items-center justify-center py-12 text-muted-color">
                                            <i class="pi pi-spin pi-spinner text-2xl mb-2"></i>
                                            <span class="text-sm">{{ 'common.loading' | translate }}</span>
                                        </div>

                                        <ng-container *ngIf="!loadingTransfers[stock.rowKey]">
                                            <!-- Empty state (No transfers) -->
                                            <div *ngIf="!transfersByRowKey[stock.rowKey] || transfersByRowKey[stock.rowKey]?.length === 0" 
                                                class="flex flex-col items-center justify-center py-12 bg-surface-0 dark:bg-surface-900 rounded-xl border border-dashed border-surface-200 dark:border-surface-700 mx-4">
                                                <div class="w-16 h-16 rounded-full bg-surface-100 dark:bg-surface-800 flex items-center justify-center mb-4">
                                                    <i class="pi pi-inbox text-3xl text-surface-400"></i>
                                                </div>
                                                <h5 class="text-surface-900 dark:text-surface-0 font-bold mb-1">{{ 'stock.noTransfersForProduct' | translate }}</h5>
                                            </div>

                                            <!-- Content state (Has transfers) -->
                                            <ng-container *ngIf="transfersByRowKey[stock.rowKey] && transfersByRowKey[stock.rowKey]!.length > 0">
                                                <div class="grid grid-cols-3 gap-4 mb-6">
                                                    <div class="stat-card">
                                                        <div class="flex items-center gap-3">
                                                            <div class="w-8 h-8 rounded-full bg-yellow-50 dark:bg-yellow-900/20 flex items-center justify-center">
                                                                <i class="pi pi-lock text-yellow-600 dark:text-yellow-400"></i>
                                                            </div>
                                                            <span class="text-sm font-semibold text-surface-600 dark:text-surface-400">{{ 'stock.reserved' | translate }}</span>
                                                        </div>
                                                        <span class="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                                                            {{ getReservedFromTransfers(stock) }}
                                                        </span>
                                                    </div>

                                                    <div class="stat-card">
                                                        <div class="flex items-center gap-3">
                                                            <div class="w-8 h-8 rounded-full bg-orange-50 dark:bg-orange-900/20 flex items-center justify-center">
                                                                <i class="pi pi-send text-orange-500"></i>
                                                            </div>
                                                            <span class="text-sm font-semibold text-surface-600 dark:text-surface-400">{{ 'stock.inTransit' | translate }}</span>
                                                        </div>
                                                        <span class="text-2xl font-bold text-orange-500">
                                                            {{ getInTransitFromTransfers(stock) }}
                                                        </span>
                                                    </div>

                                                    <div class="stat-card">
                                                        <div class="flex items-center gap-3">
                                                            <div class="w-8 h-8 rounded-full bg-primary-50 dark:bg-primary-900/20 flex items-center justify-center">
                                                                <i class="pi pi-chart-line stock-projected-icon"></i>
                                                            </div>
                                                            <span class="text-sm font-semibold text-surface-600 dark:text-surface-400">{{ 'stock.projected' | translate }}</span>
                                                        </div>
                                                        <span class="text-2xl font-bold stock-projected-value">
                                                            {{ getProjectedFromTransfers(stock) }}
                                                        </span>
                                                    </div>
                                                </div>

                                                <div class="rounded-xl border border-surface-200 dark:border-surface-700 bg-surface-0 dark:bg-surface-900 overflow-hidden shadow-sm">
                                                    <div class="p-4 border-b border-surface-200 dark:border-surface-700 flex justify-between items-center bg-surface-50/50 dark:bg-surface-800/50">
                                                        <h5 class="font-bold text-surface-900 dark:text-surface-0 m-0">{{ 'stock.transfersForProduct' | translate }}</h5>
                                                        <span class="text-xs font-medium px-2 py-1 bg-surface-200 dark:bg-surface-700 rounded text-surface-600 dark:text-surface-400">
                                                            {{ (transfersByRowKey[stock.rowKey]?.length || 0) }} {{ 'transfers.title' | translate }}
                                                        </span>
                                                    </div>

                                                    <p-table 
                                                        [value]="transfersByRowKey[stock.rowKey] || []" 
                                                        class="transfers-inner-table"
                                                        [paginator]="false"
                                                        [scrollable]="true"
                                                        scrollHeight="300px">
                                                        <ng-template pTemplate="header">
                                                            <tr>
                                                                <th style="width: 100px">{{ 'stock.direction' | translate }}</th>
                                                                <th>{{ 'transfers.fromStore' | translate }}</th>
                                                                <th>{{ 'transfers.toStore' | translate }}</th>
                                                                <th>{{ 'common.quantity' | translate }}</th>
                                                                <th>{{ 'transfers.transferDate' | translate }}</th>
                                                                <th>{{ 'common.status' | translate }}</th>
                                                            </tr>
                                                        </ng-template>
                                                        <ng-template pTemplate="body" let-t>
                                                            <tr class="hover:bg-surface-50 dark:hover:bg-surface-800/50 transition-colors">
                                                                <td>
                                                                    <div *ngIf="isOutgoing(t, stock)" class="flex items-center gap-1 text-orange-500 font-semibold text-xs">
                                                                        <i class="pi pi-arrow-up-right"></i>
                                                                        <span>{{ 'stock.outgoing' | translate }}</span>
                                                                    </div>
                                                                    <div *ngIf="isIncoming(t, stock)" class="flex items-center gap-1 text-primary font-semibold text-xs">
                                                                        <i class="pi pi-arrow-down-left"></i>
                                                                        <span>{{ 'stock.incoming' | translate }}</span>
                                                                    </div>
                                                                </td>
                                                                <td class="font-medium text-sm">{{ t.sourceStoreName || '—' }}</td>
                                                                <td class="font-medium text-sm">{{ t.destinationStoreName || '—' }}</td>
                                                                <td>
                                                                    <span class="px-2 py-1 rounded bg-surface-100 dark:bg-surface-800 font-mono text-sm">
                                                                        {{ t.quantity }}
                                                                    </span>
                                                                </td>
                                                                <td class="text-sm text-surface-500">
                                                                    <span class="block">{{ t.date | date:'mediumDate' }}</span>
                                                                    <span class="text-xs opacity-60">{{ t.date | date:'shortTime' }}</span>
                                                                </td>
                                                                <td>
                                                                    <p-tag [value]="getTransferStatusLabel(t.status)" [severity]="getTransferStatusSeverity(t.status)" [rounded]="true"></p-tag>
                                                                </td>
                                                            </tr>
                                                        </ng-template>
                                                    </p-table>
                                                </div>
                                            </ng-container>
                                        </ng-container>
                                    </div>
                                </td>
                            </tr>
                        </ng-template>
                    </p-table>
                </div>
            </div>
        </div>
    `
})
export class StockComponent implements OnInit {
    private inventoryService = inject(InventoryDataService);
    private translateService = inject(TranslateService);

    stockData: StockData[] = [];
    loading = false;
    totalRecords = 0;
    pageSize = 20;

    viewMode: ViewMode = 'store';
    viewModeOptions = [
        { label: 'By store', value: 'store' as ViewMode },
        { label: 'By product', value: 'product' as ViewMode }
    ];

    // Search and sort state
    globalSearch: string = '';
    currentSortField: string = 'store.name';
    currentSortOrder: number = 1;
    tableFilters: { [key: string]: any } = {};

    /** Row expansion: key = rowKey, value = true when expanded */
    expandedRows: { [key: string]: boolean } = {};
    /** Transfers loaded per expanded row, key = rowKey */
    transfersByRowKey: { [key: string]: any[] | undefined } = {};
    /** Loading state for transfers per row, key = rowKey */
    loadingTransfers: { [key: string]: boolean } = {};

    ngOnInit() {
        this.viewModeOptions[0].label = this.translateService.instant('stock.viewByStore');
        this.viewModeOptions[1].label = this.translateService.instant('stock.viewByProduct');
    }

    /** Map API stock row (with incomingQty, outToTransit, quantityForTransfer) to StockData and compute virtualQuantity */
    private mapStockRow(row: any): StockData {
        const quantity = row.quantity ?? 0; // On Hand
        const incomingQty = row.incomingQty ?? 0; // Incoming to this location (approved or in_transit)
        const outToTransit = row.outToTransit ?? 0; // In Transit (already shipped from this location)
        const quantityForTransfer = row.quantityForTransfer ?? 0; // Reserved (approved but not yet shipped)
        // Projected = OnHand - InTransit + Incoming
        const idStore = row.idStore ?? row.store?.id;
        const idProduct = row.idProduct ?? row.product?.id;
        return {
            rowKey: `${idStore}-${idProduct}`,
            idStore,
            idProduct,
            quantity,
            incomingQty,
            outToTransit,
            quantityForTransfer,
            virtualQuantity: quantity - quantityForTransfer + incomingQty, // Projected = On Hand - Reserved + Incoming
            soldLast30Days: row.soldLast30Days ?? 0,
            avgDailySales: row.avgDailySales ?? 0,
            daysOfCover: row.daysOfCover ?? 0,
            store: row.store,
            product: row.product
        };
    }

    onViewModeChange() {
        if (this.viewMode === 'product') {
            this.currentSortField = 'product.name';
            this.currentSortOrder = 1;
        } else {
            this.currentSortField = 'store.name';
            this.currentSortOrder = 1;
        }
        const lazyEvent: TableLazyLoadEvent = {
            first: 0,
            rows: this.pageSize,
            sortField: this.currentSortField,
            sortOrder: this.currentSortOrder,
            filters: this.tableFilters
        };
        this.loadStockDataLazy(lazyEvent);
    }

    /** Available = OnHand - Reserved */
    getAvailable(stock: StockData): number {
        const quantity = stock.quantity ?? 0;
        const reserved = stock.quantityForTransfer ?? 0;
        return quantity - reserved;
    }

    onRowExpand(event: { data: StockData }) {
        const stock = event.data;
        const key = stock.rowKey;
        if (this.transfersByRowKey[key] !== undefined) return; // already loaded
        this.loadingTransfers[key] = true;
        this.inventoryService.getTransfersByStoreAndProduct(stock.idStore, stock.idProduct, ['in_transit', 'approved']).subscribe({
            next: (list) => {
                this.transfersByRowKey[key] = list ?? [];
                this.loadingTransfers[key] = false;
            },
            error: () => {
                this.transfersByRowKey[key] = [];
                this.loadingTransfers[key] = false;
            }
        });
    }

    /** Calculate Reserved from transfers list (approved transfers from this store) */
    getReservedFromTransfers(stock: StockData): number {
        const transfers = this.transfersByRowKey[stock.rowKey] || [];
        return transfers
            .filter((t: any) => t.idStoreSent === stock.idStore && t.status === 'approved')
            .reduce((sum: number, t: any) => sum + (t.quantity || 0), 0);
    }

    /** Calculate In Transit from transfers list (in_transit transfers from this store) */
    getInTransitFromTransfers(stock: StockData): number {
        const transfers = this.transfersByRowKey[stock.rowKey] || [];
        return transfers
            .filter((t: any) => t.idStoreSent === stock.idStore && t.status === 'in_transit')
            .reduce((sum: number, t: any) => sum + (t.quantity || 0), 0);
    }

    getProjectedFromTransfers(stock: StockData): number {
        const quantity = stock.quantity ?? 0;
        const reserved = this.getReservedFromTransfers(stock);
        const incoming = (this.transfersByRowKey[stock.rowKey] || [])
            .filter((t: any) => t.idStoreReceive === stock.idStore && t.status === 'in_transit')
            .reduce((sum: number, t: any) => sum + (t.quantity || 0), 0);
        return quantity - reserved + incoming;
    }

    getTransferStatusLabel(status: string): string {
        if (!status) return '—';
        const map: Record<string, string> = {
            in_transit: 'transfers.statusInProgress',
            approved: 'transfers.statusApproved',
            received: 'transfers.statusReceived',
            closed: 'transfers.statusClosed',
            proposed: 'transfers.statusProposed'
        };
        const key = map[status] || 'transfers.statusProposed';
        return this.translateService.instant(key);
    }

    getTransferStatusSeverity(status: string): 'success' | 'info' | 'warning' | 'danger' | 'secondary' {
        if (!status) return 'secondary';
        if (status === 'received' || status === 'closed') return 'success';
        if (status === 'approved') return 'info';   // blue
        if (status === 'in_transit') return 'warning';  // yellow
        return 'secondary';
    }

    loadStockDataLazy(event: TableLazyLoadEvent) {
        this.loading = true;
        const page = event.first && event.rows ? Math.floor(event.first / event.rows) : 0;
        const size = event.rows || this.pageSize;

        this.pageSize = size;

        // Build sort parameter - keep nested paths for backend sorting
        let sortParam: string | undefined;
        if (event.sortField) {
            const sortField = Array.isArray(event.sortField) ? event.sortField[0] : event.sortField;
            const sortOrder = event.sortOrder === 1 ? 'asc' : 'desc';
            sortParam = `${sortField},${sortOrder}`;
            this.currentSortField = sortField;
            this.currentSortOrder = event.sortOrder || 1;
        } else {
            sortParam = `${this.currentSortField},${this.currentSortOrder === 1 ? 'asc' : 'desc'}`;
        }

        // Build filters from column filters
        const filters: { storeName?: string; productName?: string; city?: string; type?: string } = {};
        if (event.filters) {
            this.tableFilters = { ...event.filters };

            const storeNameFilter = event.filters['store.name'];
            const productNameFilter = event.filters['product.name'];
            const cityFilter = event.filters['store.city'];
            const typeFilter = event.filters['store.type'];

            if (storeNameFilter) {
                const filterValue = Array.isArray(storeNameFilter) ? storeNameFilter[0] : storeNameFilter;
                if (filterValue && filterValue.value !== null && filterValue.value !== undefined && filterValue.value !== '') {
                    filters.storeName = String(filterValue.value).trim();
                }
            }
            if (productNameFilter) {
                const filterValue = Array.isArray(productNameFilter) ? productNameFilter[0] : productNameFilter;
                if (filterValue && filterValue.value !== null && filterValue.value !== undefined && filterValue.value !== '') {
                    filters.productName = String(filterValue.value).trim();
                }
            }
            if (cityFilter) {
                const filterValue = Array.isArray(cityFilter) ? cityFilter[0] : cityFilter;
                if (filterValue && filterValue.value !== null && filterValue.value !== undefined && filterValue.value !== '') {
                    filters.city = String(filterValue.value).trim();
                }
            }
            if (typeFilter) {
                const filterValue = Array.isArray(typeFilter) ? typeFilter[0] : typeFilter;
                if (filterValue && filterValue.value !== null && filterValue.value !== undefined && filterValue.value !== '') {
                    filters.type = String(filterValue.value).trim();
                }
            }
        }

        const searchTerm = this.globalSearch?.trim() || undefined;
        const filterParams = Object.keys(filters).length > 0 && !searchTerm ? filters : undefined;

        this.inventoryService.getStocks(page, size, sortParam, searchTerm, filterParams).subscribe({
            next: (response) => {
                const rawList = response?.content ?? (Array.isArray(response) ? response : []);
                this.stockData = rawList.map((row: any) => this.mapStockRow(row));
                this.totalRecords = response?.totalElements ?? (Array.isArray(response) ? response.length : 0);
                this.loading = false;
            },
            error: (error) => {
                console.error('Error loading stock data:', error);
                this.loading = false;
                this.stockData = [];
                this.totalRecords = 0;
            }
        });
    }

    onGlobalSearch(event: any) {
        const lazyEvent: TableLazyLoadEvent = {
            first: 0,
            rows: this.pageSize,
            sortField: this.currentSortField,
            sortOrder: this.currentSortOrder,
            filters: this.tableFilters
        };
        this.loadStockDataLazy(lazyEvent);
    }

    onSort(event: any) {
        // Just update the state - PrimeNG will automatically trigger onLazyLoad
        this.currentSortField = event.field;
        this.currentSortOrder = event.order;
    }

    onFilter(event: any) {
        this.tableFilters = { ...event.filters };
        const lazyEvent: TableLazyLoadEvent = {
            first: 0,
            rows: this.pageSize,
            sortField: this.currentSortField,
            sortOrder: this.currentSortOrder,
            filters: event.filters || {}
        };
        this.loadStockDataLazy(lazyEvent);
    }

    getStockStatus(stock: StockData): 'ok' | 'low' | 'out' {
        const q = stock.virtualQuantity;
        if (q <= 0) return 'out';
        if (q < 10) return 'low';
        return 'ok';
    }

    getStockStatusLabel(stock: StockData): string {
        const status = this.getStockStatus(stock);
        if (status === 'out') return this.translateService.instant('dashboard.outOfStock');
        if (status === 'low') return this.translateService.instant('dashboard.lowStock');
        return this.translateService.instant('dashboard.inStock');
    }

    getStockStatusSeverity(stock: StockData): 'success' | 'info' | 'warning' | 'danger' | 'secondary' {
        const status = this.getStockStatus(stock);
        if (status === 'out') return 'danger';
        if (status === 'low') return 'warning';
        return 'success';
    }

    getStoreTypeSeverity(type?: string): 'success' | 'info' | 'warning' | 'danger' | 'secondary' {
        if (!type) return 'secondary';
        if (type.toLowerCase() === 'warehouse') return 'info';
        return 'success';
    }

    isOutgoing(t: any, stock: StockData): boolean {
        return t.idStoreSent === stock.idStore;
    }

    isIncoming(t: any, stock: StockData): boolean {
        return t.idStoreReceive === stock.idStore;
    }
}
