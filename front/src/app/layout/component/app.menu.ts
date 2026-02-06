import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { MenuItem } from 'primeng/api';
import { AppMenuitem } from './app.menuitem';
import { Subscription } from 'rxjs';

@Component({
    selector: 'app-menu',
    standalone: true,
    imports: [CommonModule, AppMenuitem, RouterModule, TranslateModule],
    template: `<ul class="layout-menu">
        <ng-container *ngFor="let item of model; let i = index">
            <li app-menuitem *ngIf="!item.separator" [item]="item" [index]="i" [root]="true"></li>
            <li *ngIf="item.separator" class="menu-separator"></li>
        </ng-container>
    </ul> `
})
export class AppMenu implements OnInit, OnDestroy {
    model: MenuItem[] = [];
    private translateService = inject(TranslateService);
    private langChangeSubscription?: Subscription;

    ngOnInit() {
        // Load menu initially
        this.loadMenu();

        // Subscribe to language changes to reload menu
        this.langChangeSubscription = this.translateService.onLangChange.subscribe(() => {
            this.loadMenu();
        });
    }

    ngOnDestroy() {
        // Unsubscribe to prevent memory leaks
        if (this.langChangeSubscription) {
            this.langChangeSubscription.unsubscribe();
        }
    }

    private loadMenu() {
        // Load translations for menu items
        this.translateService.get([
            'navigation.home',
            'navigation.dashboard',
            'navigation.inventory',
            'navigation.uploadData',
            'navigation.updateStock',
            'navigation.stores',
            'navigation.products',
            'navigation.categories',
            'navigation.stockOverview',
            'navigation.salesAnalysis',
            'navigation.transferSuggestions',
            'navigation.reports',
            'navigation.settings'
        ]).subscribe(translations => {
            this.model = [
                {
                    label: translations['navigation.home'],
                    items: [
                        { 
                            label: translations['navigation.dashboard'], 
                            icon: 'pi pi-fw pi-home', 
                            routerLink: ['/'] 
                        }
                    ]
                },
                {
                    label: translations['navigation.inventory'],
                    icon: 'pi pi-fw pi-box',
                    items: [
                        {
                            label: translations['navigation.uploadData'],
                            icon: 'pi pi-fw pi-cloud-upload',
                            routerLink: ['/inventory/upload']
                        },
                        {
                            label: translations['navigation.updateStock'],
                            icon: 'pi pi-fw pi-refresh',
                            routerLink: ['/inventory/update-stock']
                        },
                        {
                            label: translations['navigation.stores'],
                            icon: 'pi pi-fw pi-building',
                            routerLink: ['/inventory/stores']
                        },
                        {
                            label: translations['navigation.products'],
                            icon: 'pi pi-fw pi-shopping-bag',
                            routerLink: ['/inventory/products']
                        },
                        {
                            label: translations['navigation.categories'],
                            icon: 'pi pi-fw pi-tags',
                            routerLink: ['/inventory/categories']
                        },
                        {
                            label: translations['navigation.stockOverview'],
                            icon: 'pi pi-fw pi-box',
                            routerLink: ['/inventory/stock']
                        },
                        {
                            label: translations['navigation.salesAnalysis'],
                            icon: 'pi pi-fw pi-chart-bar',
                            routerLink: ['/inventory/sales']
                        },
                        {
                            label: translations['navigation.transferSuggestions'],
                            icon: 'pi pi-fw pi-arrows-h',
                            routerLink: ['/inventory/transfers']
                        },
                        {
                            label: translations['navigation.reports'],
                            icon: 'pi pi-fw pi-file',
                            routerLink: ['/inventory/reports']
                        },
                        {
                            label: translations['navigation.settings'],
                            icon: 'pi pi-fw pi-cog',
                            routerLink: ['/inventory/settings']
                        }
                    ]
                }
            ];
        });
    }
}
