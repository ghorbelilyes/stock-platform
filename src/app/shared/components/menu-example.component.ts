import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MenuService } from '../services/menu.service';
import { MenuItem } from 'primeng/api';

/**
 * Example component demonstrating how to control the sidebar menu
 * This is a reference component - you can use these patterns in your own components
 */
@Component({
    selector: 'app-menu-example',
    standalone: true,
    imports: [CommonModule],
    template: `
        <div class="p-4">
            <h2>Menu Control Examples</h2>
            
            <div class="card mt-4">
                <h3>Add Menu Item</h3>
                <button (click)="addMenuItem()" class="p-button">Add "My Page" to Menu</button>
            </div>
            
            <div class="card mt-4">
                <h3>Remove Menu Item</h3>
                <button (click)="removeMenuItem()" class="p-button">Remove "UI Components"</button>
            </div>
            
            <div class="card mt-4">
                <h3>Toggle Visibility</h3>
                <button (click)="toggleMenuItemVisibility()" class="p-button">
                    {{ isVisible ? 'Hide' : 'Show' }} "Pages" Menu
                </button>
            </div>
            
            <div class="card mt-4">
                <h3>Toggle Enable/Disable</h3>
                <button (click)="toggleMenuItemEnabled()" class="p-button">
                    {{ isEnabled ? 'Disable' : 'Enable' }} "Dashboard"
                </button>
            </div>
        </div>
    `
})
export class MenuExampleComponent implements OnInit {
    isVisible = true;
    isEnabled = true;

    private menuService = inject(MenuService);

    ngOnInit() {
        // Example: Load menu based on user roles
        // const userRoles = ['admin', 'user'];
        // const filteredMenu = this.menuService.filterMenuByRole(userRoles);
        // this.menuService.setMenuItems(filteredMenu);
    }

    addMenuItem() {
        const newItem: MenuItem = {
            label: 'My Page',
            icon: 'pi pi-fw pi-star',
            routerLink: ['/my-page']
        };
        this.menuService.addMenuItem(newItem);
    }

    removeMenuItem() {
        this.menuService.removeMenuItem('UI Components');
    }

    toggleMenuItemVisibility() {
        this.isVisible = !this.isVisible;
        this.menuService.setMenuItemVisibility('Pages', this.isVisible);
    }

    toggleMenuItemEnabled() {
        this.isEnabled = !this.isEnabled;
        this.menuService.setMenuItemEnabled('Dashboard', this.isEnabled);
    }
}
