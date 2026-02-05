import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { TableModule, TableLazyLoadEvent } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { InputTextModule } from 'primeng/inputtext';
import { InventoryDataService } from '../../../shared/services/inventory-data.service';

interface StoreData {
    id: number;
    serialNumber: string;
    name: string;
    city: string;
    type: string;
    leadTimeDays?: number;
}

@Component({
    selector: 'app-stores',
    standalone: true,
    imports: [CommonModule, FormsModule, TranslateModule, TableModule, TagModule, InputTextModule],
    template: `
        <div class="grid grid-cols-12 gap-8">
            <div class="col-span-12">
                <div class="card">
                    <h1 class="text-surface-900 dark:text-surface-0 text-3xl font-semibold mb-6">{{ 'stores.title' | translate }}</h1>
                    <p class="text-muted-color mb-6">{{ 'stores.description' | translate }}</p>
                    
                    <p-table 
                        [value]="storesData" 
                        [paginator]="true" 
                        [rows]="pageSize"
                        [totalRecords]="totalRecords"
                        [lazy]="true"
                        (onLazyLoad)="loadStoresDataLazy($event)"
                        [globalFilterFields]="['name', 'city', 'type', 'serialNumber']" 
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
                                        [placeholder]="'stores.searchPlaceholder' | translate" 
                                        class="w-full"
                                    />
                                </span>
                            </div>
                        </ng-template>
                        <ng-template pTemplate="header">
                            <tr>
                                <th [pSortableColumn]="'serialNumber'">
                                    <div class="flex items-center justify-between gap-2">
                                        <div class="flex items-center gap-2">
                                            <span>{{ 'stores.serialNumber' | translate }}</span>
                                            <p-sortIcon [field]="'serialNumber'"></p-sortIcon>
                                        </div>
                                        <p-columnFilter type="text" field="serialNumber" display="menu" [showMatchModes]="false" matchMode="contains"></p-columnFilter>
                                    </div>
                                </th>
                                <th [pSortableColumn]="'name'">
                                    <div class="flex items-center justify-between gap-2">
                                        <div class="flex items-center gap-2">
                                            <span>{{ 'common.name' | translate }}</span>
                                            <p-sortIcon [field]="'name'"></p-sortIcon>
                                        </div>
                                        <p-columnFilter type="text" field="name" display="menu" [showMatchModes]="false" matchMode="contains"></p-columnFilter>
                                    </div>
                                </th>
                                <th [pSortableColumn]="'city'">
                                    <div class="flex items-center justify-between gap-2">
                                        <div class="flex items-center gap-2">
                                            <span>{{ 'common.city' | translate }}</span>
                                            <p-sortIcon [field]="'city'"></p-sortIcon>
                                        </div>
                                        <p-columnFilter type="text" field="city" display="menu" [showMatchModes]="false" matchMode="contains"></p-columnFilter>
                                    </div>
                                </th>
                                <th [pSortableColumn]="'type'">
                                    <div class="flex items-center justify-between gap-2">
                                        <div class="flex items-center gap-2">
                                            <span>{{ 'common.type' | translate }}</span>
                                            <p-sortIcon [field]="'type'"></p-sortIcon>
                                        </div>
                                        <p-columnFilter type="text" field="type" display="menu" [showMatchModes]="false" matchMode="contains"></p-columnFilter>
                                    </div>
                                </th>
                                <th [pSortableColumn]="'leadTimeDays'">
                                    <div class="flex items-center gap-2">
                                        <span>{{ 'stores.leadTimeDays' | translate }}</span>
                                        <p-sortIcon [field]="'leadTimeDays'"></p-sortIcon>
                                    </div>
                                </th>
                            </tr>
                        </ng-template>
                        <ng-template pTemplate="emptymessage">
                            <tr>
                                <td colspan="5" class="text-center py-8 text-muted-color">
                                    <div *ngIf="!loading">
                                        <p class="mb-2">No stores found.</p>
                                        <p class="text-sm" *ngIf="globalSearch">Try adjusting your search query.</p>
                                    </div>
                                </td>
                            </tr>
                        </ng-template>
                        <ng-template pTemplate="body" let-store>
                            <tr>
                                <td>{{ store.serialNumber }}</td>
                                <td>{{ store.name }}</td>
                                <td>{{ store.city }}</td>
                                <td>
                                    <p-tag [value]="store.type || 'N/A'" [severity]="getStoreTypeSeverity(store.type)"></p-tag>
                                </td>
                                <td>{{ store.leadTimeDays ?? 'N/A' }}</td>
                            </tr>
                        </ng-template>
                    </p-table>
                </div>
            </div>
        </div>
    `
})
export class StoresComponent implements OnInit {
    private inventoryService = inject(InventoryDataService);
    storesData: StoreData[] = [];
    loading = false;
    totalRecords = 0;
    pageSize = 20;
    
    // Search and sort state
    globalSearch: string = '';
    currentSortField: string = 'id';
    currentSortOrder: number = 1;
    tableFilters: { [key: string]: any } = {};

    ngOnInit() {
        // Initial load will be triggered by lazy load
    }

    loadStoresDataLazy(event: TableLazyLoadEvent) {
        this.loading = true;
        const page = event.first && event.rows ? Math.floor(event.first / event.rows) : 0;
        const size = event.rows || this.pageSize;
        
        this.pageSize = size;

        // Build sort parameter
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
        const filters: { name?: string; serialNumber?: string; city?: string; type?: string } = {};
        if (event.filters) {
            this.tableFilters = { ...event.filters };
            
            const nameFilter = event.filters['name'];
            const serialNumberFilter = event.filters['serialNumber'];
            const cityFilter = event.filters['city'];
            const typeFilter = event.filters['type'];
            
            if (nameFilter) {
                const filterValue = Array.isArray(nameFilter) ? nameFilter[0] : nameFilter;
                if (filterValue && filterValue.value !== null && filterValue.value !== undefined && filterValue.value !== '') {
                    filters.name = String(filterValue.value).trim();
                }
            }
            if (serialNumberFilter) {
                const filterValue = Array.isArray(serialNumberFilter) ? serialNumberFilter[0] : serialNumberFilter;
                if (filterValue && filterValue.value !== null && filterValue.value !== undefined && filterValue.value !== '') {
                    filters.serialNumber = String(filterValue.value).trim();
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

        this.inventoryService.getStores(page, size, sortParam, searchTerm, filterParams).subscribe({
            next: (response) => {
                if (response && response.content) {
                    this.storesData = response.content.map((store: any) => ({
                        id: store.id,
                        serialNumber: store.serialNumber,
                        name: store.name,
                        city: store.city,
                        type: store.type,
                        leadTimeDays: store.leadTimeDays
                    }));
                    this.totalRecords = response.totalElements || 0;
                } else if (Array.isArray(response)) {
                    this.storesData = response.map((store: any) => ({
                        id: store.id,
                        serialNumber: store.serialNumber,
                        name: store.name,
                        city: store.city,
                        type: store.type,
                        leadTimeDays: store.leadTimeDays
                    }));
                    this.totalRecords = response.length;
                } else {
                    this.storesData = [];
                    this.totalRecords = 0;
                }
                this.loading = false;
            },
            error: (error) => {
                console.error('Error loading stores data:', error);
                this.loading = false;
                this.storesData = [];
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
        this.loadStoresDataLazy(lazyEvent);
    }

    onSort(event: any) {
        // Just update the state - PrimeNG will automatically trigger onLazyLoad
        this.currentSortField = event.field;
        this.currentSortOrder = event.order;
    }

    onFilter(event: any) {
        const lazyEvent: TableLazyLoadEvent = {
            first: 0,
            rows: this.pageSize,
            sortField: this.currentSortField,
            sortOrder: this.currentSortOrder,
            filters: event.filters || {}
        };
        this.loadStoresDataLazy(lazyEvent);
    }

    getStoreTypeSeverity(type?: string): 'success' | 'info' | 'warning' | 'danger' | 'secondary' {
        if (!type) return 'secondary';
        if (type.toLowerCase() === 'warehouse') return 'info';
        return 'success';
    }
}
