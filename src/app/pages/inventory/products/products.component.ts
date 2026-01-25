import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TableModule, TableLazyLoadEvent } from 'primeng/table';
import { InputTextModule } from 'primeng/inputtext';
import { InventoryDataService } from '../../../shared/services/inventory-data.service';

interface ProductData {
    id: number;
    codeBarre: string;
    name: string;
    description?: string;
}

@Component({
    selector: 'app-products',
    standalone: true,
    imports: [CommonModule, FormsModule, TableModule, InputTextModule],
    template: `
        <div class="grid grid-cols-12 gap-8">
            <div class="col-span-12">
                <div class="card">
                    <h1 class="text-surface-900 dark:text-surface-0 text-3xl font-semibold mb-6">Products</h1>
                    <p class="text-muted-color mb-6">Manage all products in your inventory system with pagination, sorting, filtering, and search.</p>
                    
                    <p-table 
                        [value]="productsData" 
                        [paginator]="true" 
                        [rows]="pageSize"
                        [totalRecords]="totalRecords"
                        [lazy]="true"
                        (onLazyLoad)="loadProductsDataLazy($event)"
                        [globalFilterFields]="['name', 'codeBarre', 'description']" 
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
                                        placeholder="Search by Name, Barcode, or Description" 
                                        class="w-full"
                                    />
                                </span>
                            </div>
                        </ng-template>
                        <ng-template pTemplate="header">
                            <tr>
                                <th [pSortableColumn]="'codeBarre'">
                                    <div class="flex items-center justify-between gap-2">
                                        <div class="flex items-center gap-2">
                                            <span>Barcode</span>
                                            <p-sortIcon [field]="'codeBarre'"></p-sortIcon>
                                        </div>
                                        <p-columnFilter type="text" field="codeBarre" display="menu" [showMatchModes]="false" matchMode="contains"></p-columnFilter>
                                    </div>
                                </th>
                                <th [pSortableColumn]="'name'">
                                    <div class="flex items-center justify-between gap-2">
                                        <div class="flex items-center gap-2">
                                            <span>Name</span>
                                            <p-sortIcon [field]="'name'"></p-sortIcon>
                                        </div>
                                        <p-columnFilter type="text" field="name" display="menu" [showMatchModes]="false" matchMode="contains"></p-columnFilter>
                                    </div>
                                </th>
                                <th [pSortableColumn]="'description'">
                                    <div class="flex items-center justify-between gap-2">
                                        <div class="flex items-center gap-2">
                                            <span>Description</span>
                                            <p-sortIcon [field]="'description'"></p-sortIcon>
                                        </div>
                                        <p-columnFilter type="text" field="description" display="menu" [showMatchModes]="false" matchMode="contains"></p-columnFilter>
                                    </div>
                                </th>
                            </tr>
                        </ng-template>
                        <ng-template pTemplate="emptymessage">
                            <tr>
                                <td colspan="3" class="text-center py-8 text-muted-color">
                                    <div *ngIf="!loading">
                                        <p class="mb-2">No products found.</p>
                                        <p class="text-sm" *ngIf="globalSearch">Try adjusting your search query.</p>
                                    </div>
                                </td>
                            </tr>
                        </ng-template>
                        <ng-template pTemplate="body" let-product>
                            <tr>
                                <td>{{ product.codeBarre }}</td>
                                <td>{{ product.name }}</td>
                                <td>{{ product.description || 'N/A' }}</td>
                            </tr>
                        </ng-template>
                    </p-table>
                </div>
            </div>
        </div>
    `
})
export class ProductsComponent implements OnInit {
    private inventoryService = inject(InventoryDataService);
    productsData: ProductData[] = [];
    loading = false;
    totalRecords = 0;
    pageSize = 20;
    
    // Search and sort state
    globalSearch: string = '';
    currentSortField: string = 'id';
    currentSortOrder: number = 1; // 1 for ASC, -1 for DESC
    tableFilters: { [key: string]: any } = {};

    ngOnInit() {
        // Initial load will be triggered by lazy load
    }

    loadProductsDataLazy(event: TableLazyLoadEvent) {
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
        const filters: { name?: string; codeBarre?: string; description?: string } = {};
        if (event.filters) {
            // Update table filters state
            this.tableFilters = { ...event.filters };
            
            // Extract filter values
            const nameFilter = event.filters['name'];
            const codeBarreFilter = event.filters['codeBarre'];
            const descriptionFilter = event.filters['description'];
            
            // Handle single filter object or array
            if (nameFilter) {
                const filterValue = Array.isArray(nameFilter) ? nameFilter[0] : nameFilter;
                if (filterValue && filterValue.value !== null && filterValue.value !== undefined && filterValue.value !== '') {
                    filters.name = String(filterValue.value).trim();
                }
            }
            if (codeBarreFilter) {
                const filterValue = Array.isArray(codeBarreFilter) ? codeBarreFilter[0] : codeBarreFilter;
                if (filterValue && filterValue.value !== null && filterValue.value !== undefined && filterValue.value !== '') {
                    filters.codeBarre = String(filterValue.value).trim();
                }
            }
            if (descriptionFilter) {
                const filterValue = Array.isArray(descriptionFilter) ? descriptionFilter[0] : descriptionFilter;
                if (filterValue && filterValue.value !== null && filterValue.value !== undefined && filterValue.value !== '') {
                    filters.description = String(filterValue.value).trim();
                }
            }
        }

        // Use global search if provided, otherwise use filters
        const searchTerm = this.globalSearch?.trim() || undefined;
        const filterParams = Object.keys(filters).length > 0 && !searchTerm ? filters : undefined;

        this.inventoryService.getProducts(page, size, sortParam, searchTerm, filterParams).subscribe({
            next: (response) => {
                if (response && response.content) {
                    this.productsData = response.content.map((product: any) => ({
                        id: product.id,
                        codeBarre: product.codeBarre,
                        name: product.name,
                        description: product.description
                    }));
                    this.totalRecords = response.totalElements || 0;
                } else if (Array.isArray(response)) {
                    this.productsData = response.map((product: any) => ({
                        id: product.id,
                        codeBarre: product.codeBarre,
                        name: product.name,
                        description: product.description
                    }));
                    this.totalRecords = response.length;
                } else {
                    this.productsData = [];
                    this.totalRecords = 0;
                }
                this.loading = false;
            },
            error: (error) => {
                console.error('Error loading products data:', error);
                this.loading = false;
                this.productsData = [];
                this.totalRecords = 0;
            }
        });
    }

    onGlobalSearch(event: any) {
        // Reset to first page when searching, but preserve column filters
        const lazyEvent: TableLazyLoadEvent = {
            first: 0,
            rows: this.pageSize,
            sortField: this.currentSortField,
            sortOrder: this.currentSortOrder,
            filters: this.tableFilters
        };
        this.loadProductsDataLazy(lazyEvent);
    }

    onSort(event: any) {
        this.currentSortField = event.field;
        this.currentSortOrder = event.order;
        // Reload with new sort
        const lazyEvent: TableLazyLoadEvent = {
            first: 0,
            rows: this.pageSize,
            sortField: event.field,
            sortOrder: event.order,
            filters: this.tableFilters
        };
        this.loadProductsDataLazy(lazyEvent);
    }

    onFilter(event: any) {
        // When filters change, trigger lazy load
        const lazyEvent: TableLazyLoadEvent = {
            first: 0,
            rows: this.pageSize,
            sortField: this.currentSortField,
            sortOrder: this.currentSortOrder,
            filters: event.filters || {}
        };
        this.loadProductsDataLazy(lazyEvent);
    }
}
