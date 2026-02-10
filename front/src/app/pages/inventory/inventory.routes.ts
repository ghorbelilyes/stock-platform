import { Routes } from '@angular/router';
import { authGuard } from '../../shared/guards/auth.guard';
import { roleGuard } from '../../shared/guards/role.guard';
import { anyRoleGuard } from '../../shared/guards/role.guard';

export default [
    { path: '', redirectTo: 'upload', pathMatch: 'full' },
    // Admin only: File upload
    { 
        path: 'upload', 
        loadComponent: () => import('./upload/upload.component').then(m => m.UploadComponent),
        canActivate: [roleGuard('ADMIN')]
    },
    { 
        path: 'update-stock', 
        loadComponent: () => import('./update-stock/update-stock.component').then(m => m.UpdateStockComponent),
        canActivate: [roleGuard('ADMIN')]
    },
    // Admin + Manager: Stocks, Sales, Transfers, Stores
    { 
        path: 'stock', 
        loadComponent: () => import('./stock/stock.component').then(m => m.StockComponent),
        canActivate: [anyRoleGuard(['ADMIN', 'MANAGER'])]
    },
    { 
        path: 'sales', 
        loadComponent: () => import('./sales/sales.component').then(m => m.SalesComponent),
        canActivate: [anyRoleGuard(['ADMIN', 'MANAGER'])]
    },
    { 
        path: 'transfers', 
        loadComponent: () => import('./transfers/transfers.component').then(m => m.TransfersComponent),
        canActivate: [anyRoleGuard(['ADMIN', 'MANAGER'])]
    },
    { 
        path: 'stores', 
        loadComponent: () => import('./stores/stores.component').then(m => m.StoresComponent),
        canActivate: [anyRoleGuard(['ADMIN', 'MANAGER'])]
    },
    // All authenticated users: Products, Categories
    { 
        path: 'products', 
        loadComponent: () => import('./products/products.component').then(m => m.ProductsComponent),
        canActivate: [authGuard]
    },
    { 
        path: 'categories', 
        loadComponent: () => import('./categories/categories.component').then(m => m.CategoriesComponent),
        canActivate: [authGuard]
    },
    { 
        path: 'reports', 
        loadComponent: () => import('./reports/reports.component').then(m => m.ReportsComponent),
        canActivate: [anyRoleGuard(['ADMIN', 'MANAGER'])]
    },
    { 
        path: 'settings', 
        loadComponent: () => import('./settings/settings.component').then(m => m.SettingsComponent),
        canActivate: [roleGuard('ADMIN')]
    },
    { path: '**', redirectTo: '/notfound' }
] as Routes;
