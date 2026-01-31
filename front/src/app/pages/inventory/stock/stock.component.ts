import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { TableModule, TableLazyLoadEvent } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { InputTextModule } from 'primeng/inputtext';
import { InventoryDataService } from '../../../shared/services/inventory-data.service';
import { StatusPillComponent } from '../../../shared/components/status-pill/status-pill.component';

interface StockData {
    idStore: number;
    idProduct: number;
    quantity: number;
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
    imports: [CommonModule, FormsModule, TranslateModule, TableModule, TagModule, InputTextModule, StatusPillComponent],
    template: `
        <div class="grid grid-cols-12 gap-8">
            <div class="col-span-12">
                <div class="card">
                    <h1 class="text-surface-900 dark:text-surface-0 text-3xl font-semibold mb-6">{{ 'stock.title' | translate }}</h1>
                    <p class="text-muted-color mb-6">{{ 'stock.description' | translate }}</p>
                    
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
                        [sortField]="currentSortField"
                        [sortOrder]="currentSortOrder"
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
                                        <span>{{ 'common.quantity' | translate }}</span>
                                        <p-sortIcon [field]="'quantity'"></p-sortIcon>
                                    </div>
                                </th>
                                <th>{{ 'common.status' | translate }}</th>
                            </tr>
                        </ng-template>
                        <ng-template pTemplate="emptymessage">
                            <tr>
                                <td colspan="6" class="text-center py-8 text-muted-color">
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
    
    // Search and sort state
    globalSearch: string = '';
    currentSortField: string = 'idStore';
    currentSortOrder: number = 1;
    tableFilters: { [key: string]: any } = {};

    ngOnInit() {
        // Initial load will be triggered by lazy load
    }

    loadStockDataLazy(event: TableLazyLoadEvent) {
        this.loading = true;
        const page = event.first && event.rows ? Math.floor(event.first / event.rows) : 0;
        const size = event.rows || this.pageSize;
        
        this.pageSize = size;

        // Build sort parameter - map nested fields to backend fields
        let sortParam: string | undefined;
        if (event.sortField) {
            let sortField = Array.isArray(event.sortField) ? event.sortField[0] : event.sortField;
            // Map nested fields to backend fields
            if (sortField === 'store.name') sortField = 'storeName';
            else if (sortField === 'product.name') sortField = 'productName';
            else if (sortField === 'store.city') sortField = 'city';
            else if (sortField === 'store.type') sortField = 'type';
            
            const sortOrder = event.sortOrder === 1 ? 'asc' : 'desc';
            sortParam = `${sortField},${sortOrder}`;
            this.currentSortField = event.sortField as string;
            this.currentSortOrder = event.sortOrder || 1;
        } else {
            sortParam = `${this.currentSortField},${this.currentSortOrder === 1 ? 'asc' : 'desc'}`;
        }

        // Build filters from column filters - map nested fields
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
                if (response && response.content) {
                    this.stockData = response.content.map((stock: any) => ({
                        idStore: stock.idStore,
                        idProduct: stock.idProduct,
                        quantity: stock.quantity,
                        store: stock.store,
                        product: stock.product
                    }));
                    this.totalRecords = response.totalElements || 0;
                } else if (Array.isArray(response)) {
                    this.stockData = response.map((stock: any) => ({
                        idStore: stock.idStore,
                        idProduct: stock.idProduct,
                        quantity: stock.quantity,
                        store: stock.store,
                        product: stock.product
                    }));
                    this.totalRecords = response.length;
                } else {
                    this.stockData = [];
                    this.totalRecords = 0;
                }
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
        this.currentSortField = event.field;
        this.currentSortOrder = event.order;
        const lazyEvent: TableLazyLoadEvent = {
            first: 0,
            rows: this.pageSize,
            sortField: event.field,
            sortOrder: event.order,
            filters: this.tableFilters
        };
        this.loadStockDataLazy(lazyEvent);
    }

    onFilter(event: any) {
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
        if (stock.quantity <= 0) return 'out';
        if (stock.quantity < 10) return 'low';
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
