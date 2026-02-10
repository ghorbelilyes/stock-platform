import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { ChartModule } from 'primeng/chart';
import { TagModule } from 'primeng/tag';
import { KpiCardComponent } from '../../shared/components/kpi-card/kpi-card.component';
import { StatusPillComponent } from '../../shared/components/status-pill/status-pill.component';
import { InventoryDataService } from '../../shared/services/inventory-data.service';
import { TransferService } from '../../shared/services/transfer.service';
import { TransferSuggestion } from '../../shared/models/inventory.models';
import { forkJoin } from 'rxjs';

@Component({
    selector: 'app-dashboard',
    standalone: true,
    imports: [
        CommonModule,
        RouterModule,
        TranslateModule,
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
                    <h1 class="text-surface-900 dark:text-surface-0 text-3xl font-semibold mb-4">{{ 'dashboard.header' | translate }}</h1>
                    <div class="flex flex-wrap gap-3">
                        <p-button [label]="'dashboard.uploadFiles' | translate" icon="pi pi-cloud-upload" [outlined]="true" routerLink="/inventory/upload"></p-button>
                        <p-button [label]="'dashboard.analyzeData' | translate" icon="pi pi-search" severity="success"></p-button>
                        <p-button [label]="'dashboard.generateTransfers' | translate" icon="pi pi-arrows-h" severity="success"></p-button>
                    </div>
                </div>
            </div>

            <!-- KPI Cards -->
            <div class="col-span-12 lg:col-span-6 xl:col-span-3">
                <app-kpi-card 
                    [label]="'dashboard.storesMonitored' | translate" 
                    [value]="kpiData.storesMonitored"
                    icon="pi pi-building text-xl!"
                    iconColor="blue">
                </app-kpi-card>
            </div>
            <div class="col-span-12 lg:col-span-6 xl:col-span-3">
                <app-kpi-card 
                    [label]="'dashboard.totalProducts' | translate" 
                    [value]="kpiData.totalProducts"
                    icon="pi pi-box text-xl!"
                    iconColor="green">
                </app-kpi-card>
            </div>
            <div class="col-span-12 lg:col-span-6 xl:col-span-3">
                <app-kpi-card 
                    [label]="'dashboard.transfersInProgress' | translate" 
                    [value]="kpiData.transfersInProgress"
                    icon="pi pi-arrows-h text-xl!"
                    iconColor="orange">
                </app-kpi-card>
            </div>
            <div class="col-span-12 lg:col-span-6 xl:col-span-3">
                <app-kpi-card 
                    [label]="'dashboard.stockoutRiskAlerts' | translate" 
                    [value]="kpiData.stockoutRiskAlerts"
                    icon="pi pi-exclamation-triangle text-xl!"
                    iconColor="red">
                </app-kpi-card>
            </div>

            <!-- Transfer Suggestions Table -->
            <div class="col-span-12">
                <div class="card">
                    <h2 class="text-surface-900 dark:text-surface-0 text-2xl font-semibold mb-2">{{ 'dashboard.transferSuggestionsTitle' | translate }}</h2>
                    <p class="text-muted-color mb-6">{{ 'dashboard.transferSuggestionsDescription' | translate }}</p>
                    
                    <p-table [value]="transferSuggestions" [paginator]="true" [rows]="10" [loading]="loading">
                        <ng-template pTemplate="header">
                            <tr>
                                <th>{{ 'common.from' | translate }}</th>
                                <th>{{ 'common.to' | translate }}</th>
                                <th>{{ 'common.product' | translate }}</th>
                                <th>{{ 'common.quantity' | translate }}</th>
                                <th>{{ 'common.priority' | translate }}</th>
                                <th>{{ 'common.reason' | translate }}</th>
                                <th>{{ 'common.confidence' | translate }}</th>
                                <th>{{ 'common.action' | translate }}</th>
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
                                        [label]="'dashboard.transfer' | translate" 
                                        icon="pi pi-check" 
                                        size="small"
                                        severity="success"
                                        (onClick)="approveTransfer(suggestion.id)">
                                    </p-button>
                                </td>
                            </tr>
                        </ng-template>
                        <ng-template pTemplate="emptymessage">
                            <tr>
                                <td colspan="8" class="text-center py-8 text-muted-color">
                                    {{ 'dashboard.noTransferSuggestions' | translate }}
                                </td>
                            </tr>
                        </ng-template>
                    </p-table>
                </div>
            </div>

            <!-- Charts Section -->
            <div class="col-span-12 xl:col-span-6">
                <div class="card">
                    <h2 class="text-surface-900 dark:text-surface-0 text-xl font-semibold mb-4">{{ 'dashboard.stockLevelAnalysis' | translate }}</h2>
                    <p-chart type="bar" [data]="stockChartData" [options]="stockChartOptions" [style]="{height: '300px'}"></p-chart>
                </div>
            </div>
            <div class="col-span-12 xl:col-span-6">
                <div class="card">
                    <h2 class="text-surface-900 dark:text-surface-0 text-xl font-semibold mb-4">{{ 'dashboard.salesTrends' | translate }}</h2>
                    <p-chart type="line" [data]="salesChartData" [options]="salesChartOptions" [style]="{height: '300px'}"></p-chart>
                </div>
            </div>
        </div>
    `
})
export class Dashboard implements OnInit {
    private inventoryService = inject(InventoryDataService);
    private transferService = inject(TransferService);
    private translateService = inject(TranslateService);

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
    loading = false;

    ngOnInit() {
        this.loadKPIData();
        this.loadTransferSuggestions();
        this.prepareCharts();
    }

    private loadKPIData() {
        // Load data from APIs
        forkJoin({
            products: this.inventoryService.getProducts(),
            stocks: this.inventoryService.getStocks(),
            transfers: this.transferService.getTransfers()
        }).subscribe({
            next: (data) => {
                // Calculate KPIs
                this.kpiData.totalProducts = data.products.length;

                // Count active transfers
                const transfersList = Array.isArray(data.transfers) ? data.transfers : (data.transfers?.content || []);
                const activeTransfers = transfersList.filter((t: any) =>
                    t.status === 'approved' || t.status === 'picked' || t.status === 'in_transit'
                );
                this.kpiData.transfersInProgress = activeTransfers.length;

                // For stores and stockout alerts, we'll need to fetch stocks with more details
                // For now, set defaults
                this.kpiData.storesMonitored = 0; // TODO: Implement store count endpoint
                this.kpiData.stockoutRiskAlerts = 0; // TODO: Calculate from stock data
            },
            error: (error) => {
                console.error('Error loading KPI data:', error);
            }
        });
    }

    private loadTransferSuggestions() {
        this.loading = true;
        this.transferService.getSuggestions().subscribe({
            next: (list) => {
                this.transferSuggestions = list.slice(0, 10);
                this.loading = false;
            },
            error: () => {
                this.transferSuggestions = [];
                this.loading = false;
            }
        });
    }

    approveTransfer(suggestionId: string) {
        this.transferService.approveSuggestion(suggestionId, undefined).subscribe({
            next: (transfer) => {
                // Remove suggestion from list
                this.transferSuggestions = this.transferSuggestions.filter(s => s.id !== suggestionId);
                // Refresh KPI data
                this.loadKPIData();
            },
            error: (error) => {
                console.error('Error approving transfer:', error);
            }
        });
    }

    private prepareCharts() {
        // Load data for charts
        forkJoin({
            stocks: this.inventoryService.getStocks(),
            sales: this.inventoryService.getSales()
        }).subscribe({
            next: (data) => {
                this.prepareStockChart(data.stocks);
                this.prepareSalesChart(data.sales);
            },
            error: (error) => {
                console.error('Error loading chart data:', error);
                // Use default empty charts
                this.prepareDefaultCharts();
            }
        });
    }

    private prepareStockChart(stocks: any) {
        // Process stock data for chart
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];

        // Group stocks by status (mock calculation for now)
        const inStock = months.map(() => Math.floor(Math.random() * 5) + 3);
        const lowStock = months.map(() => Math.floor(Math.random() * 2) + 1);
        const outOfStock = months.map(() => Math.floor(Math.random() * 1));

        // Load translations for chart labels
        this.translateService.get(['dashboard.inStock', 'dashboard.lowStock', 'dashboard.outOfStock']).subscribe(translations => {
            this.stockChartData = {
                labels: months,
                datasets: [
                    {
                        label: translations['dashboard.inStock'],
                        data: inStock,
                        backgroundColor: '#10B981',
                        borderColor: '#10B981'
                    },
                    {
                        label: translations['dashboard.lowStock'],
                        data: lowStock,
                        backgroundColor: '#F59E0B',
                        borderColor: '#F59E0B'
                    },
                    {
                        label: translations['dashboard.outOfStock'],
                        data: outOfStock,
                        backgroundColor: '#EF4444',
                        borderColor: '#EF4444'
                    }
                ]
            };
        });

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
    }

    private prepareSalesChart(sales: any) {
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];

        // Process sales data (mock for now)
        const salesData = [
            {
                label: 'Store 1',
                data: months.map(() => Math.floor(Math.random() * 15) + 5),
                borderColor: '#3B82F6',
                backgroundColor: 'rgba(59, 130, 246, 0.1)',
                tension: 0.4,
                fill: true
            },
            {
                label: 'Store 2',
                data: months.map(() => Math.floor(Math.random() * 15) + 5),
                borderColor: '#F97316',
                backgroundColor: 'rgba(249, 115, 22, 0.1)',
                tension: 0.4,
                fill: true
            }
        ];

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

    private prepareDefaultCharts() {
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];

        this.translateService.get('common.noData').subscribe(noDataLabel => {
            this.stockChartData = {
                labels: months,
                datasets: [{
                    label: noDataLabel,
                    data: [],
                    backgroundColor: '#6B7280'
                }]
            };

            this.salesChartData = {
                labels: months,
                datasets: [{
                    label: noDataLabel,
                    data: [],
                    borderColor: '#6B7280'
                }]
            };
        });

        this.stockChartOptions = {
            responsive: true,
            maintainAspectRatio: false
        };

        this.salesChartOptions = {
            responsive: true,
            maintainAspectRatio: false
        };
    }
}
