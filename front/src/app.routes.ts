import { Routes } from '@angular/router';
import { AppLayout } from './app/layout/component/app.layout';
import { Dashboard } from './app/pages/dashboard/dashboard';
import { Documentation } from './app/reference/demos/documentation/documentation';
import { Landing } from './app/pages/landing/landing';
import { Notfound } from './app/pages/notfound/notfound';
import { authGuard } from './app/shared/guards/auth.guard';
import { roleGuard } from './app/shared/guards/role.guard';
import { anyRoleGuard } from './app/shared/guards/role.guard';

export const appRoutes: Routes = [
    {
        path: '',
        component: AppLayout,
        canActivate: [authGuard],
        children: [
            { path: '', component: Dashboard },
            {
                path: 'inventory',
                loadChildren: () => import('./app/pages/inventory/inventory.routes'),
                canActivate: [authGuard]
            },
            { path: 'uikit', loadChildren: () => import('./app/reference/uikit/uikit.routes') },
            { path: 'documentation', component: Documentation },
            { path: 'pages', loadChildren: () => import('./app/pages/pages.routes') }
        ]
    },
    { path: 'landing', component: Landing },
    { path: 'notfound', component: Notfound },
    { path: 'auth', loadChildren: () => import('./app/pages/auth/auth.routes') },
    // Redirect root to login if not authenticated (will be handled by auth guard)
    { path: '**', component: Notfound, canActivate: [authGuard] }
];
