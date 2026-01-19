import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TableModule } from 'primeng/table';
import { ChartModule } from 'primeng/chart';
import { InventoryDataService } from '../../../shared/services/inventory-data.service';

@Component({
    selector: 'app-sales',
    standalone: true,
    imports: [CommonModule, TableModule, ChartModule],
    template: `
        <div class="grid grid-cols-12 gap-8">
            <div class="col-span-12">
                <div class="card">
                    <h1 class="text-surface-900 dark:text-surface-0 text-3xl font-semibold mb-6">Sales Analysis</h1>
                    <p class="text-muted-color mb-6">Analyze sales trends and performance across stores.</p>
                </div>
            </div>

            <div class="col-span-12">
                <div class="card">
                    <h2 class="text-surface-900 dark:text-surface-0 text-xl font-semibold mb-4">Sales Trends</h2>
                    <p-chart type="line" [data]="chartData" [options]="chartOptions"></p-chart>
                </div>
            </div>

            <div class="col-span-12">
                <div class="card">
                    <h2 class="text-surface-900 dark:text-surface-0 text-xl font-semibold mb-4">Recent Sales</h2>
                    <p-table [value]="recentSales" [paginator]="true" [rows]="20">
                        <ng-template pTemplate="header">
                            <tr>
                                <th>Date</th>
                                <th>Store</th>
                                <th>SKU</th>
                                <th>Quantity</th>
                                <th>Price</th>
                                <th>Total</th>
                            </tr>
                        </ng-template>
                        <ng-template pTemplate="body" let-sale>
                            <tr>
                                <td>{{ sale.date | date:'short' }}</td>
                                <td>{{ sale.storeName }}</td>
                                <td>{{ sale.sku }}</td>
                                <td>{{ sale.qtySold }}</td>
                                <td>{{ sale.price | currency:'USD' }}</td>
                                <td>{{ (sale.qtySold * sale.price) | currency:'USD' }}</td>
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
    recentSales: Array<any> = [];
    chartData: any;
    chartOptions: any;

    ngOnInit() {
        const stores = this.inventoryService.getStores();
        const sales = this.inventoryService.getSales();
        const storeMap = new Map(stores.map(s => [s.id, s.name]));

        // Get recent sales (last 100)
        this.recentSales = sales
            .slice(-100)
            .map(sale => ({
                ...sale,
                storeName: storeMap.get(sale.storeId) || 'Unknown'
            }))
            .reverse();

        // Prepare chart data
        this.prepareChartData(sales, stores);
    }

    private prepareChartData(sales: any[], stores: any[]) {
        const storeNames = stores.filter(s => s.type === 'store').map(s => s.name);
        const months = ['Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep'];
        
        const datasets = storeNames.slice(0, 2).map((storeName, index) => {
            const store = stores.find(s => s.name === storeName);
            const storeSales = sales.filter(s => s.storeId === store?.id);
            const monthlyData = months.map(() => Math.floor(Math.random() * 15) + 5);
            
            return {
                label: storeName,
                data: monthlyData,
                borderColor: index === 0 ? '#3B82F6' : '#F97316',
                backgroundColor: index === 0 ? 'rgba(59, 130, 246, 0.1)' : 'rgba(249, 115, 22, 0.1)',
                tension: 0.4
            };
        });

        this.chartData = {
            labels: months,
            datasets
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
