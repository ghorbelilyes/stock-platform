import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { TableModule, TableLazyLoadEvent } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { InputTextModule } from 'primeng/inputtext';
import { SelectButtonModule } from 'primeng/selectbutton';
import { InventoryDataService } from '../../../shared/services/inventory-data.service';
import { StatusPillComponent } from '../../../shared/components/status-pill/status-pill.component';

type ViewMode = 'store' | 'product';

interface StockData {
    idStore: number;
    idProduct: number;
    quantity: number;
    /** Quantity arriving at this store for this product (transfers in_transit to this store) - Incoming (en route) */
    incomingQty: number;
    /** Quantity leaving this store for this product (transfers in_transit from this store) - Out to transit (en route) */
    outToTransit: number;
    /** Quantity approved for transfer but not yet in_transit - Quantity for transfer */
    quantityForTransfer: number;
    /** quantity + incomingQty - outToTransit (approved transfers not yet deducted) */
    virtualQuantity: number;
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
    imports: [CommonModule, FormsModule, TranslateModule, TableModule, TagModule, InputTextModule, SelectButtonModule, StatusPillComponent],
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
                        #dt>
                        <ng-template pTemplate="caption">
                            <div class="flex justify-between items-center gap-4">
                                <span class="p-input-icon-left flex-1">
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
                                        <span>{{ 'stock.onHand' | translate }}</span>
                                        <p-sortIcon [field]="'quantity'"></p-sortIcon>
                                    </div>
                                </th>
                                <th>{{ 'stock.incoming' | translate }}</th>
                                <th>{{ 'stock.outToTransit' | translate }}</th>
                                <th>{{ 'stock.quantityForTransfer' | translate }}</th>
                                <th [pSortableColumn]="'virtualQuantity'">
                                    <div class="flex items-center gap-2">
                                        <span>{{ 'stock.virtualQuantity' | translate }}</span>
                                        <p-sortIcon [field]="'virtualQuantity'"></p-sortIcon>
                                    </div>
                                </th>
                                <th>{{ 'common.status' | translate }}</th>
                            </tr>
                        </ng-template>
                        <ng-template pTemplate="emptymessage">
                            <tr>
                                <td colspan="11" class="text-center py-8 text-muted-color">
                                    <div *ngIf="!loading">
                                        <p class="mb-2">{{ 'common.noData' | translate }}</p>
                                    </div>
                                </td>
                            </tr>
                        </ng-template>
                        <ng-template pTemplate="body" let-stock>
                            <tr>
                                <td>{{ stock.store?.name || 'N/A' }}</td>
                                <td>{{ stock.store?.city || 'N/A' }}</td>
                                <td>
                                    <p-tag [value]="stock.store?.type || 'N/A'" [severity]="getStoreTypeSeverity(stock.store?.type)"></p-tag>
                                </td>
                                <td>{{ stock.product?.name || 'N/A' }}</td>
                                <td>{{ stock.quantity }}</td>
                                <td>
                                    <span *ngIf="stock.incomingQty > 0" class="font-medium text-primary">+{{ stock.incomingQty }}</span>
                                    <span *ngIf="stock.incomingQty === 0" class="text-muted-color">0</span>
                                </td>
                                <td>
                                    <span *ngIf="stock.outToTransit > 0" class="font-medium text-orange-500">-{{ stock.outToTransit }}</span>
                                    <span *ngIf="stock.outToTransit === 0" class="text-muted-color">0</span>
                                </td>
                                <td>
                                    <span *ngIf="stock.quantityForTransfer > 0" class="font-medium text-yellow-600 dark:text-yellow-400">{{ stock.quantityForTransfer }}</span>
                                    <span *ngIf="stock.quantityForTransfer === 0" class="text-muted-color">0</span>
                                </td>
                                <td>
                                    <span [class.font-semibold]="stock.virtualQuantity !== stock.quantity">{{ stock.virtualQuantity }}</span>
                                </td>
                                <td>
                                    <app-status-pill 
                                        [status]="getStockStatus(stock)"
                                        [label]="getStockStatusLabel(stock)">
                                    </app-status-pill>
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

    ngOnInit() {
        this.viewModeOptions[0].label = this.translateService.instant('stock.viewByStore');
        this.viewModeOptions[1].label = this.translateService.instant('stock.viewByProduct');
    }

    /** Map API stock row (with incomingQty, outToTransit, quantityForTransfer) to StockData and compute virtualQuantity */
    private mapStockRow(row: any): StockData {
        const quantity = row.quantity ?? 0;
        const incomingQty = row.incomingQty ?? 0;
        const outToTransit = row.outToTransit ?? 0;
        const quantityForTransfer = row.quantityForTransfer ?? 0;
        // Virtual quantity = on hand + incoming - out to transit - quantity for transfer
        // Approved transfers reduce virtual quantity because they're committed to be sent
        return {
            idStore: row.idStore ?? row.store?.id,
            idProduct: row.idProduct ?? row.product?.id,
            quantity,
            incomingQty,
            outToTransit,
            quantityForTransfer,
            virtualQuantity: quantity + incomingQty - outToTransit - quantityForTransfer,
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

    getStoreTypeSeverity(type?: string): 'success' | 'info' | 'warning' | 'danger' | 'secondary' {
        if (!type) return 'secondary';
        if (type.toLowerCase() === 'warehouse') return 'info';
        return 'success';
    }
}
