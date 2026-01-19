import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { InputTextModule } from 'primeng/inputtext';
import { InventoryDataService } from '../../../shared/services/inventory-data.service';
import { StatusPillComponent } from '../../../shared/components/status-pill/status-pill.component';
import { Stock } from '../../../shared/models/inventory.models';

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
                    
                    <p-table [value]="stockData" [paginator]="true" [rows]="20" [globalFilterFields]="['sku', 'storeName']" #dt>
                        <ng-template pTemplate="caption">
                            <div class="flex justify-between items-center">
                                <span class="p-input-icon-left">
                                    <i class="pi pi-search"></i>
                                    <input pInputText type="text" (input)="dt.filterGlobal($event.target, 'contains')" placeholder="Search by SKU or Store" />
                                </span>
                            </div>
                        </ng-template>
                        <ng-template pTemplate="header">
                            <tr>
                                <th>Store</th>
                                <th>SKU</th>
                                <th>On Hand</th>
                                <th>Reserved</th>
                                <th>Available</th>
                                <th>Reorder Point</th>
                                <th>Safety Stock</th>
                                <th>Status</th>
                            </tr>
                        </ng-template>
                        <ng-template pTemplate="body" let-stock>
                            <tr>
                                <td>{{ stock.storeName }}</td>
                                <td>{{ stock.sku }}</td>
                                <td>{{ stock.onHand }}</td>
                                <td>{{ stock.reserved }}</td>
                                <td>{{ stock.onHand - stock.reserved }}</td>
                                <td>{{ stock.reorderPoint }}</td>
                                <td>{{ stock.safetyStock }}</td>
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
    stockData: Array<Stock & { storeName: string }> = [];

    ngOnInit() {
        const stores = this.inventoryService.getStores();
        const stocks = this.inventoryService.getStocks();
        const storeMap = new Map(stores.map(s => [s.id, s.name]));

        this.stockData = stocks.map(stock => ({
            ...stock,
            storeName: storeMap.get(stock.storeId) || 'Unknown'
        }));
    }

    getStockStatus(stock: Stock): 'ok' | 'low' | 'out' {
        const available = stock.onHand - stock.reserved;
        if (available <= 0) return 'out';
        if (available < stock.reorderPoint) return 'low';
        return 'ok';
    }

    getStockStatusLabel(stock: Stock): string {
        const status = this.getStockStatus(stock);
        if (status === 'out') return 'Out of Stock';
        if (status === 'low') return 'Low Stock';
        return 'In Stock';
    }
}
