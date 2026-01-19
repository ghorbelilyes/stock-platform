import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { ChartModule } from 'primeng/chart';
import { TagModule } from 'primeng/tag';
import { KpiCardComponent } from '../../shared/components/kpi-card/kpi-card.component';
import { StatusPillComponent } from '../../shared/components/status-pill/status-pill.component';
import { InventoryDataService } from '../../shared/services/inventory-data.service';
import { TransferService } from '../../shared/services/transfer.service';
import { TransferSuggestion } from '../../shared/models/inventory.models';

@Component({
    selector: 'app-dashboard',
    standalone: true,
    imports: [
        CommonModule,
        TableModule,
        ButtonModule,
        ChartModule,
        TagModule,
        KpiCardComponent,
        StatusPillComponent
    ],
    template: `
        <div class="grid grid-cols-12 gap-8">
            <!-- Header Section -->
            <div class="col-span-12">
                <div class="card mb-6">
                    <h1 class="text-surface-900 dark:text-surface-0 text-3xl font-semibold mb-4">AI-Powered Inventory Management for Multi-Store Businesses.</h1>
                    <div class="flex flex-wrap gap-3">
                        <p-button label="Upload Files" icon="pi pi-cloud-upload" [outlined]="true"></p-button>
                        <p-button label="Analyze Data" icon="pi pi-search" severity="success"></p-button>
                        <p-button label="Generate Transfers" icon="pi pi-arrows-h" severity="success"></p-button>
                    </div>
                </div>
            </div>

            <!-- KPI Cards -->
            <div class="col-span-12 lg:col-span-6 xl:col-span-3">
                <app-kpi-card 
                    label="Stores Monitored" 
                    [value]="kpiData.storesMonitored"
                    icon="pi pi-building text-xl!"
                    iconColor="blue">
                </app-kpi-card>
            </div>
            <div class="col-span-12 lg:col-span-6 xl:col-span-3">
                <app-kpi-card 
                    label="Total Products" 
                    [value]="kpiData.totalProducts"
                    icon="pi pi-box text-xl!"
                    iconColor="green">
                </app-kpi-card>
            </div>
            <div class="col-span-12 lg:col-span-6 xl:col-span-3">
                <app-kpi-card 
                    label="Transfers In Progress" 
                    [value]="kpiData.transfersInProgress"
                    icon="pi pi-arrows-h text-xl!"
                    iconColor="orange">
                </app-kpi-card>
            </div>
            <div class="col-span-12 lg:col-span-6 xl:col-span-3">
                <app-kpi-card 
                    label="Stockout Risk Alerts" 
                    [value]="kpiData.stockoutRiskAlerts"
                    icon="pi pi-exclamation-triangle text-xl!"
                    iconColor="red">
                </app-kpi-card>
            </div>

            <!-- Transfer Suggestions Table -->
            <div class="col-span-12">
                <div class="card">
                    <h2 class="text-surface-900 dark:text-surface-0 text-2xl font-semibold mb-2">AI-Generated Transfer Suggestions</h2>
                    <p class="text-muted-color mb-6">Automated transfer recommendations to optimize inventory levels.</p>
                    
                    <p-table [value]="transferSuggestions" [paginator]="true" [rows]="10">
                        <ng-template pTemplate="header">
                            <tr>
                                <th>From</th>
                                <th>To</th>
                                <th>Product</th>
                                <th>Quantity</th>
                                <th>Priority</th>
                                <th>Reason</th>
                                <th>Confidence</th>
                                <th>Action</th>
                            </tr>
                        </ng-template>
                        <ng-template pTemplate="body" let-suggestion>
                            <tr>
                                <td>
                                    <div class="flex items-center gap-2">
                                        <i class="pi pi-arrow-right text-green-500"></i>
                                        <span>{{ suggestion.fromStoreName }}</span>
                                    </div>
                                </td>
                                <td>{{ suggestion.toStoreName }}</td>
                                <td>{{ suggestion.productName }}</td>
                                <td>{{ suggestion.quantity }}</td>
                                <td>
                                    <app-status-pill 
                                        [status]="suggestion.priority === 'high' ? 'high' : suggestion.priority === 'medium' ? 'medium' : 'low-priority'"
                                        [label]="suggestion.priority">
                                    </app-status-pill>
                                </td>
                                <td>{{ suggestion.reason }}</td>
                                <td>{{ suggestion.confidence }}%</td>
                                <td>
                                    <p-button 
                                        label="Transfer" 
                                        icon="pi pi-check" 
                                        size="small"
                                        severity="success"
                                        (onClick)="approveTransfer(suggestion.id)">
                                    </p-button>
                                </td>
                            </tr>
                        </ng-template>
                    </p-table>
                </div>
            </div>

            <!-- Charts Section -->
            <div class="col-span-12 xl:col-span-6">
                <div class="card">
                    <h2 class="text-surface-900 dark:text-surface-0 text-xl font-semibold mb-4">Stock Level Analysis</h2>
                    <p-chart type="bar" [data]="stockChartData" [options]="stockChartOptions" [style]="{height: '300px'}"></p-chart>
                </div>
            </div>
            <div class="col-span-12 xl:col-span-6">
                <div class="card">
                    <h2 class="text-surface-900 dark:text-surface-0 text-xl font-semibold mb-4">Sales Trends</h2>
                    <p-chart type="line" [data]="salesChartData" [options]="salesChartOptions" [style]="{height: '300px'}"></p-chart>
                </div>
            </div>
        </div>
    `
})
export class Dashboard implements OnInit {
    private inventoryService = inject(InventoryDataService);
    private transferService = inject(TransferService);

    kpiData = {
        storesMonitored: 0,
        totalProducts: 0,
        transfersInProgress: 0,
        stockoutRiskAlerts: 0
    };

    transferSuggestions: TransferSuggestion[] = [];
    stockChartData: any;
    salesChartData: any;
    stockChartOptions: any;
    salesChartOptions: any;

    ngOnInit() {
        this.loadKPIData();
        this.loadTransferSuggestions();
        this.prepareCharts();
    }

    private loadKPIData() {
        const stores = this.inventoryService.getStores();
        const stocks = this.inventoryService.getStocks();
        const transfers = this.transferService.getTransfers();
        
        const uniqueSkus = new Set(stocks.map(s => s.sku));
        const activeTransfers = transfers.filter(t => 
            t.status === 'approved' || t.status === 'picked' || t.status === 'in_transit'
        );

        const lowStockItems = stocks.filter(s => {
            const available = s.onHand - s.reserved;
            return available < s.reorderPoint;
        });

        this.kpiData = {
            storesMonitored: stores.length,
            totalProducts: uniqueSkus.size,
            transfersInProgress: activeTransfers.length,
            stockoutRiskAlerts: lowStockItems.length
        };
    }

    private loadTransferSuggestions() {
        this.transferSuggestions = this.transferService.getSuggestions().slice(0, 10);
    }

    approveTransfer(suggestionId: string) {
        this.transferService.approveSuggestion(suggestionId);
        this.transferSuggestions = this.transferSuggestions.filter(s => s.id !== suggestionId);
        this.loadKPIData(); // Refresh KPI data
    }

    private prepareCharts() {
        const stores = this.inventoryService.getStores();
        const stocks = this.inventoryService.getStocks();
        const sales = this.inventoryService.getSales();

        // Stock Level Analysis Chart
        const months = ['Mar', 'Apr', 'May', 'Jun', 'Jul', 'Dec'];
        const inStock = months.map(() => Math.floor(Math.random() * 5) + 3);
        const lowStock = months.map(() => Math.floor(Math.random() * 2) + 1);
        const outOfStock = months.map(() => Math.floor(Math.random() * 1));

        this.stockChartData = {
            labels: months,
            datasets: [
                {
                    label: 'In Stock',
                    data: inStock,
                    backgroundColor: '#10B981',
                    borderColor: '#10B981'
                },
                {
                    label: 'Low Stock',
                    data: lowStock,
                    backgroundColor: '#F59E0B',
                    borderColor: '#F59E0B'
                },
                {
                    label: 'Out of Stock',
                    data: outOfStock,
                    backgroundColor: '#EF4444',
                    borderColor: '#EF4444'
                }
            ]
        };

        this.stockChartOptions = {
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

        // Sales Trends Chart
        const storeNames = stores.filter(s => s.type === 'store').slice(0, 2).map(s => s.name);
        const salesData = storeNames.map((storeName, index) => {
            const monthlyData = months.map(() => Math.floor(Math.random() * 15) + 5);
            return {
                label: storeName,
                data: monthlyData,
                borderColor: index === 0 ? '#3B82F6' : '#F97316',
                backgroundColor: index === 0 ? 'rgba(59, 130, 246, 0.1)' : 'rgba(249, 115, 22, 0.1)',
                tension: 0.4,
                fill: true
            };
        });

        this.salesChartData = {
            labels: months,
            datasets: salesData
        };

        this.salesChartOptions = {
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
