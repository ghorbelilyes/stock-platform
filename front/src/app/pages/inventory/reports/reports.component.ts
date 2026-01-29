import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';

@Component({
    selector: 'app-reports',
    standalone: true,
    imports: [CommonModule, TranslateModule],
    template: `
        <div class="grid grid-cols-12 gap-8">
            <div class="col-span-12">
                <div class="card">
                    <h1 class="text-surface-900 dark:text-surface-0 text-3xl font-semibold mb-6">{{ 'navigation.reports' | translate }}</h1>
                    <p class="text-muted-color mb-6">{{ 'reports.description' | translate }}</p>
                    
                    <div class="grid grid-cols-12 gap-4">
                        <div class="col-span-12 md:col-span-6 lg:col-span-4">
                            <div class="card text-center cursor-pointer hover:shadow-lg transition-shadow">
                                <i class="pi pi-chart-bar text-4xl text-primary mb-3"></i>
                                <h3 class="text-surface-900 dark:text-surface-0 text-xl font-semibold mb-2">{{ 'reports.stockReport' | translate }}</h3>
                                <p class="text-muted-color">{{ 'reports.stockReportDescription' | translate }}</p>
                            </div>
                        </div>
                        <div class="col-span-12 md:col-span-6 lg:col-span-4">
                            <div class="card text-center cursor-pointer hover:shadow-lg transition-shadow">
                                <i class="pi pi-shopping-cart text-4xl text-primary mb-3"></i>
                                <h3 class="text-surface-900 dark:text-surface-0 text-xl font-semibold mb-2">{{ 'reports.salesReport' | translate }}</h3>
                                <p class="text-muted-color">{{ 'reports.salesReportDescription' | translate }}</p>
                            </div>
                        </div>
                        <div class="col-span-12 md:col-span-6 lg:col-span-4">
                            <div class="card text-center cursor-pointer hover:shadow-lg transition-shadow">
                                <i class="pi pi-arrows-h text-4xl text-primary mb-3"></i>
                                <h3 class="text-surface-900 dark:text-surface-0 text-xl font-semibold mb-2">{{ 'reports.transferReport' | translate }}</h3>
                                <p class="text-muted-color">{{ 'reports.transferReportDescription' | translate }}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `
})
export class ReportsComponent {}
