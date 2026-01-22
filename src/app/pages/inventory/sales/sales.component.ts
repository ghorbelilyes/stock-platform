import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TableModule } from 'primeng/table';
import { ChartModule } from 'primeng/chart';
import { InventoryDataService } from '../../../shared/services/inventory-data.service';

interface SalesData {
    id: number;
    rangeDate: string;
    idStore: number;
    idProduct: number;
    quantity: number;
}

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
                    <p-chart type="line" [data]="chartData" [options]="chartOptions" [style]="{height: '300px'}"></p-chart>
                </div>
            </div>

            <div class="col-span-12">
                <div class="card">
                    <h2 class="text-surface-900 dark:text-surface-0 text-xl font-semibold mb-4">Recent Sales</h2>
                    <p-table [value]="recentSales" [paginator]="true" [rows]="20" [loading]="loading">
                        <ng-template pTemplate="header">
                            <tr>
                                <th>Date</th>
                                <th>Store ID</th>
                                <th>Product ID</th>
                                <th>Quantity</th>
                            </tr>
                        </ng-template>
                        <ng-template pTemplate="body" let-sale>
                            <tr>
                                <td>{{ sale.rangeDate | date:'short' }}</td>
                                <td>{{ sale.idStore }}</td>
                                <td>{{ sale.idProduct }}</td>
                                <td>{{ sale.quantity }}</td>
                            </tr>
                        </ng-template>
                        <ng-template pTemplate="emptymessage">
                            <tr>
                                <td colspan="4" class="text-center py-8 text-muted-color">
                                    No sales data available. Upload sales files to view sales records.
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

    ngOnInit() {
        this.loadSalesData();
    }

    private loadSalesData() {
        this.loading = true;
        // Get sales from last 30 days
        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - 30);

        this.inventoryService.getSales(
            undefined,
            undefined,
            startDate.toISOString().split('T')[0],
            endDate.toISOString().split('T')[0]
        ).subscribe({
            next: (response) => {
                let sales: SalesData[] = [];
                
                if (response && response.content) {
                    sales = response.content;
                } else if (Array.isArray(response)) {
                    sales = response;
                }

                // Get recent sales (last 100)
                this.recentSales = sales
                    .slice(-100)
                    .reverse();

                // Prepare chart data
                this.prepareChartData(sales);
                this.loading = false;
            },
            error: (error) => {
                console.error('Error loading sales data:', error);
                this.loading = false;
            }
        });
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
