import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
    selector: 'app-reports',
    standalone: true,
    imports: [CommonModule],
    template: `
        <div class="grid grid-cols-12 gap-8">
            <div class="col-span-12">
                <div class="card">
                    <h1 class="text-surface-900 dark:text-surface-0 text-3xl font-semibold mb-6">Reports</h1>
                    <p class="text-muted-color mb-6">Generate and view inventory reports.</p>
                    
                    <div class="grid grid-cols-12 gap-4">
                        <div class="col-span-12 md:col-span-6 lg:col-span-4">
                            <div class="card text-center cursor-pointer hover:shadow-lg transition-shadow">
                                <i class="pi pi-chart-bar text-4xl text-primary mb-3"></i>
                                <h3 class="text-surface-900 dark:text-surface-0 text-xl font-semibold mb-2">Stock Report</h3>
                                <p class="text-muted-color">Current inventory levels</p>
                            </div>
                        </div>
                        <div class="col-span-12 md:col-span-6 lg:col-span-4">
                            <div class="card text-center cursor-pointer hover:shadow-lg transition-shadow">
                                <i class="pi pi-shopping-cart text-4xl text-primary mb-3"></i>
                                <h3 class="text-surface-900 dark:text-surface-0 text-xl font-semibold mb-2">Sales Report</h3>
                                <p class="text-muted-color">Sales performance analysis</p>
                            </div>
                        </div>
                        <div class="col-span-12 md:col-span-6 lg:col-span-4">
                            <div class="card text-center cursor-pointer hover:shadow-lg transition-shadow">
                                <i class="pi pi-arrows-h text-4xl text-primary mb-3"></i>
                                <h3 class="text-surface-900 dark:text-surface-0 text-xl font-semibold mb-2">Transfer Report</h3>
                                <p class="text-muted-color">Transfer history and status</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `
})
export class ReportsComponent {}
