import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { InputTextModule } from 'primeng/inputtext';
import { InventoryDataService } from '../../../shared/services/inventory-data.service';
import { StatusPillComponent } from '../../../shared/components/status-pill/status-pill.component';

interface StockData {
    idStore: number;
    idProduct: number;
    quantity: number;
    storeName?: string;
    productName?: string;
}

@Component({
    selector: 'app-stock',
    standalone: true,
    imports: [CommonModule, TableModule, TagModule, InputTextModule, StatusPillComponent],
    template: `
        <div class="grid grid-cols-12 gap-8">
            <div class="col-span-12">
                <div class="card">
                    <h1 class="text-surface-900 dark:text-surface-0 text-3xl font-semibold mb-6">Stock Overview</h1>
                    <p class="text-muted-color mb-6">Monitor inventory levels across all stores and warehouses.</p>
                    
                    <p-table [value]="stockData" [paginator]="true" [rows]="20" [globalFilterFields]="['idProduct', 'storeName']" [loading]="loading" #dt>
                        <ng-template pTemplate="caption">
                            <div class="flex justify-between items-center">
                                <span class="p-input-icon-left">
                                    <i class="pi pi-search"></i>
                                    <input pInputText type="text" (input)="dt.filterGlobal($event.target, 'contains')" placeholder="Search by Product ID or Store" />
                                </span>
                            </div>
                        </ng-template>
                        <ng-template pTemplate="header">
                            <tr>
                                <th>Store ID</th>
                                <th>Product ID</th>
                                <th>Quantity</th>
                                <th>Status</th>
                            </tr>
                        </ng-template>
                        <ng-template pTemplate="body" let-stock>
                            <tr>
                                <td>{{ stock.idStore }}</td>
                                <td>{{ stock.idProduct }}</td>
                                <td>{{ stock.quantity }}</td>
                                <td>
                                    <app-status-pill 
                                        [status]="getStockStatus(stock)"
                                        [label]="getStockStatusLabel(stock)">
                                    </app-status-pill>
                                </td>
                            </tr>
                        </ng-template>
                        <ng-template pTemplate="emptymessage">
                            <tr>
                                <td colspan="4" class="text-center py-8 text-muted-color">
                                    No stock data available. Upload stock files to view inventory levels.
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
    stockData: StockData[] = [];
    loading = false;

    ngOnInit() {
        this.loadStockData();
    }

    private loadStockData(page: number = 0, size: number = 100) {
        this.loading = true;
        this.inventoryService.getStocks(undefined, undefined, page, size).subscribe({
            next: (response) => {
                if (response && response.content) {
                    // Handle paginated response
                    this.stockData = response.content.map((stock: any) => ({
                        idStore: stock.idStore,
                        idProduct: stock.idProduct,
                        quantity: stock.quantity,
                        storeName: `Store ${stock.idStore}`,
                        productName: `Product ${stock.idProduct}`
                    }));
                } else if (Array.isArray(response)) {
                    // Handle array response
                    this.stockData = response.map((stock: any) => ({
                        idStore: stock.idStore,
                        idProduct: stock.idProduct,
                        quantity: stock.quantity,
                        storeName: `Store ${stock.idStore}`,
                        productName: `Product ${stock.idProduct}`
                    }));
                }
                this.loading = false;
            },
            error: (error) => {
                console.error('Error loading stock data:', error);
                this.loading = false;
            }
        });
    }

    getStockStatus(stock: StockData): 'ok' | 'low' | 'out' {
        if (stock.quantity <= 0) return 'out';
        if (stock.quantity < 10) return 'low'; // Threshold for low stock
        return 'ok';
    }

    getStockStatusLabel(stock: StockData): string {
        const status = this.getStockStatus(stock);
        if (status === 'out') return 'Out of Stock';
        if (status === 'low') return 'Low Stock';
        return 'In Stock';
    }
}
