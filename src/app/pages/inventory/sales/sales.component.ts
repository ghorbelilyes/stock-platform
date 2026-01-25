import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TableModule, TableLazyLoadEvent } from 'primeng/table';
import { ChartModule } from 'primeng/chart';
import { InputTextModule } from 'primeng/inputtext';
import { DatePickerModule } from 'primeng/datepicker';
import { ButtonModule } from 'primeng/button';
import { InventoryDataService } from '../../../shared/services/inventory-data.service';

interface SalesData {
    id: number;
    rangeDate: string;
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
    selector: 'app-sales',
    standalone: true,
    imports: [CommonModule, TableModule, ChartModule, InputTextModule, DatePickerModule, ButtonModule, FormsModule],
    template: `
        <div class="grid grid-cols-12 gap-8">
            <div class="col-span-12">
                <div class="card">
                    <h1 class="text-surface-900 dark:text-surface-0 text-3xl font-semibold mb-6">Sales Analysis</h1>
                    <p class="text-muted-color mb-6">Analyze sales trends and performance across stores.</p>
                    
                    <div class="flex flex-wrap gap-4 items-end mb-6 p-4 border border-surface-border rounded bg-surface-0 dark:bg-surface-800">
                        <div class="flex-1 min-w-[200px]">
                            <label for="startDate" class="block text-sm font-medium text-surface-900 dark:text-surface-0 mb-2">From Date</label>
                            <p-datepicker 
                                id="startDate"
                                [(ngModel)]="startDate" 
                                [showIcon]="true"
                                [showButtonBar]="true"
                                dateFormat="yy-mm-dd"
                                placeholder="Select start date"
                                [maxDate]="endDate || today"
                                styleClass="w-full"
                                inputStyleClass="w-full">
                            </p-datepicker>
                        </div>
                        <div class="flex-1 min-w-[200px]">
                            <label for="endDate" class="block text-sm font-medium text-surface-900 dark:text-surface-0 mb-2">To Date</label>
                            <p-datepicker 
                                id="endDate"
                                [(ngModel)]="endDate" 
                                [showIcon]="true"
                                [showButtonBar]="true"
                                dateFormat="yy-mm-dd"
                                placeholder="Select end date"
                                [minDate]="startDate"
                                [maxDate]="today"
                                styleClass="w-full"
                                inputStyleClass="w-full">
                            </p-datepicker>
                        </div>
                        <div class="flex gap-2">
                            <p-button 
                                label="Apply Filter" 
                                icon="pi pi-filter" 
                                (onClick)="applyDateFilter()"
                                [disabled]="!startDate || !endDate">
                            </p-button>
                            <p-button 
                                label="Reset" 
                                icon="pi pi-refresh" 
                                severity="secondary"
                                (onClick)="resetDateFilter()">
                            </p-button>
                        </div>
                    </div>
                </div>
            </div>

            <div class="col-span-12">
                <div class="card">
                    <h2 class="text-surface-900 dark:text-surface-0 text-xl font-semibold mb-4">Sales Trends</h2>
                    <p-chart type="line" [data]="chartData" [options]="chartOptions" [style]="{height: '300px'}"></p-chart>
                </div>
            </div>

            <div class="col-span-12">
                <div class="card">
                    <h2 class="text-surface-900 dark:text-surface-0 text-xl font-semibold mb-4">Recent Sales</h2>
                    <p-table 
                        [value]="recentSales" 
                        [paginator]="true" 
                        [rows]="pageSize"
                        [totalRecords]="totalRecords"
                        [lazy]="true"
                        (onLazyLoad)="loadSalesDataLazy($event)"
                        [globalFilterFields]="['store.name', 'store.city', 'product.name']"
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
                                        placeholder="Search by Store, Product, or City" 
                                        class="w-full"
                                    />
                                </span>
                            </div>
                        </ng-template>
                        <ng-template pTemplate="header">
                            <tr>
                                <th [pSortableColumn]="'rangeDate'">
                                    <div class="flex items-center gap-2">
                                        <span>Date</span>
                                        <p-sortIcon [field]="'rangeDate'"></p-sortIcon>
                                    </div>
                                </th>
                                <th [pSortableColumn]="'store.name'">
                                    <div class="flex items-center justify-between gap-2">
                                        <div class="flex items-center gap-2">
                                            <span>Store Name</span>
                                            <p-sortIcon [field]="'store.name'"></p-sortIcon>
                                        </div>
                                        <p-columnFilter type="text" field="store.name" display="menu" [showMatchModes]="false" matchMode="contains"></p-columnFilter>
                                    </div>
                                </th>
                                <th [pSortableColumn]="'store.city'">
                                    <div class="flex items-center justify-between gap-2">
                                        <div class="flex items-center gap-2">
                                            <span>City</span>
                                            <p-sortIcon [field]="'store.city'"></p-sortIcon>
                                        </div>
                                        <p-columnFilter type="text" field="store.city" display="menu" [showMatchModes]="false" matchMode="contains"></p-columnFilter>
                                    </div>
                                </th>
                                <th [pSortableColumn]="'product.name'">
                                    <div class="flex items-center justify-between gap-2">
                                        <div class="flex items-center gap-2">
                                            <span>Product Name</span>
                                            <p-sortIcon [field]="'product.name'"></p-sortIcon>
                                        </div>
                                        <p-columnFilter type="text" field="product.name" display="menu" [showMatchModes]="false" matchMode="contains"></p-columnFilter>
                                    </div>
                                </th>
                                <th [pSortableColumn]="'quantity'">
                                    <div class="flex items-center gap-2">
                                        <span>Quantity</span>
                                        <p-sortIcon [field]="'quantity'"></p-sortIcon>
                                    </div>
                                </th>
                            </tr>
                        </ng-template>
                        <ng-template pTemplate="body" let-sale>
                            <tr>
                                <td>{{ sale.rangeDate | date:'short' }}</td>
                                <td>{{ sale.store?.name || sale.idStore }}</td>
                                <td>{{ sale.store?.city || 'N/A' }}</td>
                                <td>{{ sale.product?.name || sale.idProduct }}</td>
                                <td>{{ sale.quantity }}</td>
                            </tr>
                        </ng-template>
                        <ng-template pTemplate="emptymessage">
                            <tr>
                                <td colspan="5" class="text-center py-8 text-muted-color">
                                    <div *ngIf="!loading">
                                        <p class="mb-2">No sales data found.</p>
                                        <p class="text-sm" *ngIf="globalSearch">Try adjusting your search query.</p>
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
export class SalesComponent implements OnInit {
    private inventoryService = inject(InventoryDataService);
    recentSales: SalesData[] = [];
    chartData: any;
    chartOptions: any;
    loading = false;
    totalRecords = 0;
    pageSize = 20;
    allSales: SalesData[] = [];
    // Initialize with default date range (from 2025-01-01 to today)
    startDate: Date = new Date('2025-01-01');
    endDate: Date = new Date();
    today: Date = new Date();
    
    // Search and sort state
    globalSearch: string = '';
    currentSortField: string = 'rangeDate';
    currentSortOrder: number = -1; // Default to DESC for date
    tableFilters: { [key: string]: any } = {};

    ngOnInit() {
        // Load all sales for chart
        this.loadAllSalesForChart();
    }

    private loadAllSalesForChart() {
        if (!this.startDate || !this.endDate) {
            return;
        }

        const startDateStr = this.formatDateForApi(this.startDate);
        const endDateStr = this.formatDateForApi(this.endDate);

        // Use filters for date range
        const filters = {
            startDate: startDateStr,
            endDate: endDateStr
        };

        this.inventoryService.getSales(
            0,
            1000, // Get more data for chart
            undefined, // sort
            undefined, // search
            filters
        ).subscribe({
            next: (response) => {
                if (response && response.content) {
                    this.allSales = response.content;
                } else if (Array.isArray(response)) {
                    this.allSales = response;
                }
                this.prepareChartData(this.allSales);
            },
            error: (error) => {
                console.error('Error loading sales data for chart:', error);
            }
        });
    }

    loadSalesDataLazy(event: TableLazyLoadEvent) {
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
            
            const sortOrder = event.sortOrder === 1 ? 'asc' : 'desc';
            sortParam = `${sortField},${sortOrder}`;
            this.currentSortField = event.sortField as string;
            this.currentSortOrder = event.sortOrder || -1;
        } else {
            sortParam = `${this.currentSortField === 'rangeDate' ? 'rangeDate' : 'rangeDate'},${this.currentSortOrder === 1 ? 'asc' : 'desc'}`;
        }

        // Build filters from column filters
        const filters: { storeName?: string; productName?: string; city?: string; startDate?: string; endDate?: string } = {};
        if (event.filters) {
            this.tableFilters = { ...event.filters };
            
            const storeNameFilter = event.filters['store.name'];
            const productNameFilter = event.filters['product.name'];
            const cityFilter = event.filters['store.city'];
            
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
        }

        // Add date range to filters if set
        if (this.startDate && this.endDate) {
            filters.startDate = this.formatDateForApi(this.startDate);
            filters.endDate = this.formatDateForApi(this.endDate);
        }

        const searchTerm = this.globalSearch?.trim() || undefined;
        const filterParams = Object.keys(filters).length > 0 && !searchTerm ? filters : (searchTerm ? undefined : { startDate: filters.startDate, endDate: filters.endDate });

        this.inventoryService.getSales(page, size, sortParam, searchTerm, filterParams).subscribe({
            next: (response) => {
                if (response && response.content) {
                    this.recentSales = response.content;
                    this.totalRecords = response.totalElements || 0;
                } else if (Array.isArray(response)) {
                    this.recentSales = response;
                    this.totalRecords = response.length;
                } else {
                    this.recentSales = [];
                    this.totalRecords = 0;
                }
                this.loading = false;
            },
            error: (error) => {
                console.error('Error loading sales data:', error);
                this.loading = false;
                this.recentSales = [];
                this.totalRecords = 0;
            }
        });
    }

    applyDateFilter() {
        if (this.startDate && this.endDate) {
            // Reload chart data with new date range
            this.loadAllSalesForChart();
            
            // Reset table to first page and reload
            const lazyEvent: TableLazyLoadEvent = {
                first: 0,
                rows: this.pageSize,
                sortField: this.currentSortField,
                sortOrder: this.currentSortOrder,
                filters: this.tableFilters
            };
            this.loadSalesDataLazy(lazyEvent);
        }
    }

    resetDateFilter() {
        // Reset to default (from 2025-01-01 to today)
        this.endDate = new Date();
        this.startDate = new Date('2025-01-01');
        
        // Reload data
        this.loadAllSalesForChart();
        const lazyEvent: TableLazyLoadEvent = {
            first: 0,
            rows: this.pageSize,
            sortField: this.currentSortField,
            sortOrder: this.currentSortOrder,
            filters: this.tableFilters
        };
        this.loadSalesDataLazy(lazyEvent);
    }

    onGlobalSearch(event: any) {
        const lazyEvent: TableLazyLoadEvent = {
            first: 0,
            rows: this.pageSize,
            sortField: this.currentSortField,
            sortOrder: this.currentSortOrder,
            filters: this.tableFilters
        };
        this.loadSalesDataLazy(lazyEvent);
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
        this.loadSalesDataLazy(lazyEvent);
    }

    onFilter(event: any) {
        const lazyEvent: TableLazyLoadEvent = {
            first: 0,
            rows: this.pageSize,
            sortField: this.currentSortField,
            sortOrder: this.currentSortOrder,
            filters: event.filters || {}
        };
        this.loadSalesDataLazy(lazyEvent);
    }

    private formatDateForApi(date: Date): string {
        return date.toISOString().split('T')[0];
    }

    private prepareChartData(sales: SalesData[]) {
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        
        // Group sales by month
        const monthlyData = months.map((month, index) => {
            const monthSales = sales.filter(sale => {
                const saleDate = new Date(sale.rangeDate);
                return saleDate.getMonth() === index;
            });
            return monthSales.reduce((sum, sale) => sum + sale.quantity, 0);
        });

        this.chartData = {
            labels: months,
            datasets: [{
                label: 'Sales Quantity',
                data: monthlyData,
                borderColor: '#3B82F6',
                backgroundColor: 'rgba(59, 130, 246, 0.1)',
                tension: 0.4,
                fill: true
            }]
        };

        this.chartOptions = {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: true,
                    position: 'top'
                }
            },
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        };
    }
}
