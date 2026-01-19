import { Routes } from '@angular/router';

export default [
    { path: '', redirectTo: 'upload', pathMatch: 'full' },
    { path: 'upload', loadComponent: () => import('./upload/upload.component').then(m => m.UploadComponent) },
    { path: 'stock', loadComponent: () => import('./stock/stock.component').then(m => m.StockComponent) },
    { path: 'sales', loadComponent: () => import('./sales/sales.component').then(m => m.SalesComponent) },
    { path: 'transfers', loadComponent: () => import('./transfers/transfers.component').then(m => m.TransfersComponent) },
    { path: 'reports', loadComponent: () => import('./reports/reports.component').then(m => m.ReportsComponent) },
    { path: 'settings', loadComponent: () => import('./settings/settings.component').then(m => m.SettingsComponent) },
    { path: '**', redirectTo: '/notfound' }
] as Routes;
