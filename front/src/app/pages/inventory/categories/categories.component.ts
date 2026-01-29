import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { TableModule, TableLazyLoadEvent } from 'primeng/table';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { TextareaModule } from 'primeng/textarea';
import { MultiSelectModule } from 'primeng/multiselect';
import { CheckboxModule } from 'primeng/checkbox';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ToastModule } from 'primeng/toast';
import { TooltipModule } from 'primeng/tooltip';
import { ConfirmationService, MessageService } from 'primeng/api';
import { InventoryDataService } from '../../../shared/services/inventory-data.service';
import { forkJoin } from 'rxjs';

interface CategoryData {
    id: number;
    name: string;
    description?: string;
    allowStoreToStoreTransfer?: boolean;
    products?: ProductData[];
}

interface ProductData {
    id: number;
    codeBarre: string;
    name: string;
    description?: string;
    category?: { id: number; name: string };
}

@Component({
    selector: 'app-categories',
    standalone: true,
    imports: [
        CommonModule, FormsModule, TranslateModule, TableModule, InputTextModule, ButtonModule,
        DialogModule, TextareaModule, MultiSelectModule, CheckboxModule, ConfirmDialogModule, ToastModule, TooltipModule
    ],
    providers: [ConfirmationService, MessageService],
    styles: [`
        ::ng-deep .p-select-overlay,
        ::ng-deep .p-multiselect-overlay {
            z-index: 10000 !important;
        }
    `],
    template: `
        <div class="grid grid-cols-12 gap-8">
            <div class="col-span-12">
                <div class="card">
                    <div class="flex justify-between items-center mb-6">
                        <div>
                            <h1 class="text-surface-900 dark:text-surface-0 text-3xl font-semibold mb-2">{{ 'categories.title' | translate }}</h1>
                            <p class="text-muted-color">{{ 'categories.description' | translate }}</p>
                        </div>
                        <button 
                            pButton 
                            [label]="'categories.addCategory' | translate" 
                            icon="pi pi-plus" 
                            class="p-button-primary"
                            (click)="openAddDialog()">
                        </button>
                    </div>
                    
                    <p-table 
                        [value]="categoriesData" 
                        [paginator]="true" 
                        [rows]="pageSize"
                        [totalRecords]="totalRecords"
                        [lazy]="true"
                        (onLazyLoad)="loadCategoriesDataLazy($event)"
                        [globalFilterFields]="['name', 'description']" 
                        [loading]="loading"
                        [sortMode]="'single'"
                        [sortField]="currentSortField"
                        [sortOrder]="currentSortOrder"
                        (onSort)="onSort($event)"
                        [filterDelay]="300"
                        [filters]="tableFilters"
                        (onFilter)="onFilter($event)"
                        #dt>
                        <ng-template pTemplate="caption">
                            <div class="flex justify-between items-center gap-4">
                                <span class="p-input-icon-left flex-1">
                                    <i class="pi pi-search"></i>
                                    <input 
                                        pInputText 
                                        type="text" 
                                        [(ngModel)]="globalSearch"
                                        (input)="onGlobalSearch($event)"
                                        [placeholder]="'common.search' | translate" 
                                        class="w-full"
                                    />
                                </span>
                            </div>
                        </ng-template>
                        <ng-template pTemplate="header">
                            <tr>
                                <th [pSortableColumn]="'name'">
                                    <div class="flex items-center justify-between gap-2">
                                        <div class="flex items-center gap-2">
                                            <span>Name</span>
                                            <p-sortIcon [field]="'name'"></p-sortIcon>
                                        </div>
                                        <p-columnFilter type="text" field="name" display="menu" [showMatchModes]="false" matchMode="contains"></p-columnFilter>
                                    </div>
                                </th>
                                <th [pSortableColumn]="'description'">
                                    <div class="flex items-center justify-between gap-2">
                                        <div class="flex items-center gap-2">
                                            <span>Description</span>
                                            <p-sortIcon [field]="'description'"></p-sortIcon>
                                        </div>
                                        <p-columnFilter type="text" field="description" display="menu" [showMatchModes]="false" matchMode="contains"></p-columnFilter>
                                    </div>
                                </th>
                                <th>Allow Store-to-Store Transfer</th>
                                <th>Products Count</th>
                                <th>Actions</th>
                            </tr>
                        </ng-template>
                        <ng-template pTemplate="emptymessage">
                            <tr>
                                <td colspan="5" class="text-center py-8 text-muted-color">
                                    <div *ngIf="!loading">
                                        <p class="mb-2">No categories found.</p>
                                        <p class="text-sm" *ngIf="globalSearch">Try adjusting your search query.</p>
                                    </div>
                                </td>
                            </tr>
                        </ng-template>
                        <ng-template pTemplate="body" let-category>
                            <tr>
                                <td>{{ category.name }}</td>
                                <td>{{ category.description || 'N/A' }}</td>
                                <td class="text-center">
                                    <span *ngIf="category.allowStoreToStoreTransfer !== false" class="text-green-600">
                                        <i class="pi pi-check-circle"></i> Yes
                                    </span>
                                    <span *ngIf="category.allowStoreToStoreTransfer === false" class="text-red-600">
                                        <i class="pi pi-times-circle"></i> No
                                    </span>
                                </td>
                                <td>{{ category.products?.length || 0 }}</td>
                                <td>
                                    <div class="flex gap-2">
                                        <button 
                                            pButton 
                                            icon="pi pi-list" 
                                            class="p-button-sm p-button-text"
                                            pTooltip="View/Manage Products"
                                            (click)="openProductsDialog(category)"
                                            title="Manage Products">
                                        </button>
                                        <button 
                                            pButton 
                                            icon="pi pi-pencil" 
                                            class="p-button-sm p-button-text"
                                            (click)="openEditDialog(category)"
                                            title="Edit">
                                        </button>
                                        <button 
                                            pButton 
                                            icon="pi pi-trash" 
                                            class="p-button-sm p-button-text p-button-danger"
                                            (click)="deleteCategory(category)"
                                            title="Delete">
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        </ng-template>
                    </p-table>
                </div>
            </div>
        </div>

        <!-- Category Dialog -->
        <p-dialog 
            [(visible)]="showCategoryDialog" 
            [header]="isEditMode ? 'Edit Category' : 'Add Category'"
            [modal]="true"
            [style]="{ width: '500px', 'max-height': '90vh' }"
            [contentStyle]="{ 'max-height': 'calc(90vh - 100px)', 'overflow-y': 'auto' }"
            (onHide)="resetCategoryForm()">
            <form (ngSubmit)="saveCategory()">
                <div class="flex flex-col gap-4">
                    <div>
                        <label for="categoryName" class="block mb-2 font-medium">Name *</label>
                        <input 
                            id="categoryName"
                            pInputText 
                            [(ngModel)]="categoryForm.name" 
                            name="categoryName"
                            class="w-full"
                            required
                            placeholder="Category name" />
                    </div>
                    <div>
                        <label for="categoryDescription" class="block mb-2 font-medium">Description</label>
                        <textarea 
                            id="categoryDescription"
                            pTextarea 
                            [(ngModel)]="categoryForm.description" 
                            name="categoryDescription"
                            class="w-full"
                            rows="3"
                            placeholder="Category description"></textarea>
                    </div>
                    <div>
                        <div class="flex items-center gap-2">
                            <p-checkbox 
                                [(ngModel)]="categoryForm.allowStoreToStoreTransfer" 
                                inputId="allowStoreToStoreTransfer"
                                [binary]="true"
                                name="allowStoreToStoreTransfer"
                                [ngModelOptions]="{standalone: true}">
                            </p-checkbox>
                            <label for="allowStoreToStoreTransfer" class="cursor-pointer">
                                Allow store-to-store transfer
                            </label>
                        </div>
                        <small class="text-muted-color mt-1 block">
                            If unchecked, only warehouse → store transfers are allowed for products in this category.
                        </small>
                    </div>
                    <!-- Products Selection Section - Show in both create and edit modes -->
                    <div class="flex flex-col gap-4 border-t pt-4">
                        <div class="flex items-center gap-2">
                            <p-checkbox 
                                [(ngModel)]="showOnlyWithoutCategory" 
                                inputId="filterCheckbox"
                                [binary]="true"
                                name="filterCheckbox"
                                [ngModelOptions]="{standalone: true}"
                                (onChange)="onFilterChange()">
                            </p-checkbox>
                            <label for="filterCheckbox" class="cursor-pointer">
                                Show only products without category
                            </label>
                        </div>
                        <div>
                            <label for="productsToAdd" class="block mb-2 font-medium">Select Products to Add</label>
                            <p-multiselect 
                                id="productsToAdd"
                                [(ngModel)]="selectedProductsToAdd"
                                name="productsToAdd"
                                [ngModelOptions]="{standalone: true}"
                                [options]="availableProductsForSelection"
                                optionLabel="name"
                                placeholder="Select products to add to this category"
                                display="chip"
                                [filter]="true"
                                [loading]="loadingAvailableProducts"
                                [showClear]="true"
                                appendTo="body"
                                class="w-full">
                                <ng-template let-product pTemplate="item">
                                    <div class="flex flex-col">
                                        <span class="font-medium">{{ product.name }}</span>
                                        <span class="text-sm text-muted-color">{{ product.codeBarre }}</span>
                                        <span class="text-xs text-muted-color" *ngIf="product.category">
                                            Current category: {{ product.category.name }}
                                        </span>
                                    </div>
                                </ng-template>
                            </p-multiselect>
                        </div>
                        <div class="flex justify-end">
                            <button 
                                pButton 
                                type="button"
                                [label]="'categories.addSelectedProducts' | translate" 
                                icon="pi pi-plus" 
                                class="p-button-primary"
                                [disabled]="!selectedProductsToAdd || selectedProductsToAdd.length === 0"
                                (click)="addSelectedProductsToCategory()">
                            </button>
                        </div>
                    </div>
                    <div class="flex justify-end gap-2 mt-4">
                        <button 
                            pButton 
                            type="button"
                            [label]="'common.cancel' | translate" 
                            class="p-button-secondary"
                            (click)="showCategoryDialog = false">
                        </button>
                        <button 
                            pButton 
                            type="submit"
                            [label]="'common.save' | translate" 
                            class="p-button-primary"
                            [disabled]="!categoryForm.name || categoryForm.name.trim() === ''">
                        </button>
                    </div>
                </div>
            </form>
        </p-dialog>

        <!-- Products Dialog -->
        <p-dialog 
            [(visible)]="showProductsDialog" 
            [header]="'Manage Products - ' + selectedCategory?.name"
            [modal]="true"
            [style]="{ width: '900px', 'max-height': '90vh' }"
            [contentStyle]="{ 'max-height': 'calc(90vh - 100px)', 'overflow-y': 'auto' }"
            (onHide)="resetProductsForm()">
            <div class="flex flex-col gap-4">
                <!-- Add Products Section -->
                <div class="card p-4 bg-surface-50 dark:bg-surface-800">
                    <div class="flex justify-between items-center mb-4">
                        <h3 class="text-lg font-semibold">Add Products to Category</h3>
                        <button 
                            pButton 
                            [label]="'categories.createNewProduct' | translate" 
                            icon="pi pi-plus" 
                            class="p-button-sm p-button-outlined"
                            (click)="openAddProductDialog()">
                        </button>
                    </div>
                    <div class="flex flex-col gap-4">
                        <div class="flex items-center gap-2">
                            <p-checkbox 
                                [(ngModel)]="showOnlyWithoutCategory" 
                                inputId="filterCheckbox"
                                [binary]="true"
                                name="filterCheckbox"
                                [ngModelOptions]="{standalone: true}"
                                (onChange)="onFilterChange()">
                            </p-checkbox>
                            <label for="filterCheckbox" class="cursor-pointer">
                                Show only products without category
                            </label>
                        </div>
                        <div>
                            <label for="productsToAdd" class="block mb-2 font-medium">Select Products to Add</label>
                            <p-multiselect 
                                id="productsToAdd"
                                [(ngModel)]="selectedProductsToAdd"
                                name="productsToAdd"
                                [ngModelOptions]="{standalone: true}"
                                [options]="availableProductsForSelection"
                                optionLabel="name"
                                placeholder="Select products to add to this category"
                                display="chip"
                                [filter]="true"
                                [loading]="loadingAvailableProducts"
                                [showClear]="true"
                                appendTo="body"
                                class="w-full">
                                <ng-template let-product pTemplate="item">
                                    <div class="flex flex-col">
                                        <span class="font-medium">{{ product.name }}</span>
                                        <span class="text-sm text-muted-color">{{ product.codeBarre }}</span>
                                        <span class="text-xs text-muted-color" *ngIf="product.category">
                                            Current category: {{ product.category.name }}
                                        </span>
                                    </div>
                                </ng-template>
                            </p-multiselect>
                        </div>
                        <div class="flex justify-end">
                            <button 
                                pButton 
                                [label]="'categories.addSelectedProducts' | translate" 
                                icon="pi pi-plus" 
                                class="p-button-primary"
                                [disabled]="!selectedProductsToAdd || selectedProductsToAdd.length === 0"
                                (click)="addSelectedProductsToCategory()">
                            </button>
                        </div>
                    </div>
                </div>

                <!-- Products in Category Section -->
                <div>
                    <h3 class="text-lg font-semibold mb-4">Products in this category</h3>
                    <p-table [value]="categoryProducts" [paginator]="true" [rows]="10" [loading]="loadingProducts">
                        <ng-template pTemplate="header">
                            <tr>
                                <th>Barcode</th>
                                <th>Name</th>
                                <th>Description</th>
                                <th>Actions</th>
                            </tr>
                        </ng-template>
                        <ng-template pTemplate="body" let-product>
                            <tr>
                                <td>{{ product.codeBarre }}</td>
                                <td>{{ product.name }}</td>
                                <td>{{ product.description || 'N/A' }}</td>
                                <td>
                                    <button 
                                        pButton 
                                        icon="pi pi-pencil" 
                                        class="p-button-sm p-button-text"
                                        (click)="openEditProductDialog(product)"
                                        title="Edit">
                                    </button>
                                    <button 
                                        pButton 
                                        icon="pi pi-trash" 
                                        class="p-button-sm p-button-text p-button-danger"
                                        (click)="removeProductFromCategory(product)"
                                        title="Remove from Category">
                                    </button>
                                </td>
                            </tr>
                        </ng-template>
                        <ng-template pTemplate="emptymessage">
                            <tr>
                                <td colspan="4" class="text-center py-8 text-muted-color">
                                    No products in this category.
                                </td>
                            </tr>
                        </ng-template>
                    </p-table>
                </div>
            </div>
        </p-dialog>

        <!-- Product Dialog -->
        <p-dialog 
            [(visible)]="showProductDialog" 
            [header]="isEditProductMode ? 'Edit Product' : 'Add Product'"
            [modal]="true"
            [style]="{ width: '600px', 'max-height': '90vh' }"
            [contentStyle]="{ 'max-height': 'calc(90vh - 100px)', 'overflow-y': 'auto' }"
            (onHide)="resetProductForm()">
            <form (ngSubmit)="saveProduct()">
                <div class="flex flex-col gap-4">
                    <div>
                        <label for="productCodeBarre" class="block mb-2 font-medium">Barcode *</label>
                        <input 
                            id="productCodeBarre"
                            pInputText 
                            [(ngModel)]="productForm.codeBarre" 
                            name="productCodeBarre"
                            class="w-full"
                            [disabled]="isEditProductMode"
                            required
                            placeholder="Product barcode" />
                    </div>
                    <div>
                        <label for="productName" class="block mb-2 font-medium">Name *</label>
                        <input 
                            id="productName"
                            pInputText 
                            [(ngModel)]="productForm.name" 
                            name="productName"
                            class="w-full"
                            required
                            placeholder="Product name" />
                    </div>
                    <div>
                        <label for="productDescription" class="block mb-2 font-medium">Description</label>
                        <textarea 
                            id="productDescription"
                            pTextarea 
                            [(ngModel)]="productForm.description" 
                            name="productDescription"
                            class="w-full"
                            rows="3"
                            placeholder="Product description"></textarea>
                    </div>
                    <div class="flex justify-end gap-2 mt-4">
                        <button 
                            pButton 
                            type="button"
                            [label]="'common.cancel' | translate" 
                            class="p-button-secondary"
                            (click)="showProductDialog = false">
                        </button>
                        <button 
                            pButton 
                            type="submit"
                            [label]="'common.save' | translate" 
                            class="p-button-primary"
                            [disabled]="!productForm.name || productForm.name.trim() === '' || !productForm.codeBarre || productForm.codeBarre.trim() === ''">
                        </button>
                    </div>
                </div>
            </form>
        </p-dialog>

        <p-confirmDialog></p-confirmDialog>
        <p-toast></p-toast>
    `
})
export class CategoriesComponent implements OnInit {
    private inventoryService = inject(InventoryDataService);
    private confirmationService = inject(ConfirmationService);
    private messageService = inject(MessageService);

    categoriesData: CategoryData[] = [];
    loading = false;
    totalRecords = 0;
    pageSize = 20;

    // Search and sort state
    globalSearch: string = '';
    currentSortField: string = 'id';
    currentSortOrder: number = 1;
    tableFilters: { [key: string]: any } = {};

    // Dialog state
    showCategoryDialog = false;
    showProductsDialog = false;
    showProductDialog = false;
    isEditMode = false;
    isEditProductMode = false;
    selectedCategory: CategoryData | null = null;
    categoryProducts: ProductData[] = [];
    loadingProducts = false;

    categoryForm = {
        id: null as number | null,
        name: '',
        description: '',
        allowStoreToStoreTransfer: true
    };
    
    productsWithoutCategory: ProductData[] = [];
    selectedProductsWithoutCategory: ProductData[] = [];
    loadingProductsWithoutCategory = false;
    
    // Products dialog state
    showOnlyWithoutCategory = true; // Checkbox state - default to true (show only without category)
    availableProductsForSelection: ProductData[] = [];
    selectedProductsToAdd: ProductData[] = [];
    loadingAvailableProducts = false;

    productForm = {
        id: null as number | null,
        codeBarre: '',
        name: '',
        description: ''
    };

    ngOnInit() {
        // Initial load will be triggered by lazy load
    }

    loadCategoriesDataLazy(event: TableLazyLoadEvent) {
        this.loading = true;
        const page = event.first! / event.rows!;
        const size = event.rows!;

        // Get sort info
        if (event.sortField) {
            // Handle sortField which can be string or string[]
            this.currentSortField = Array.isArray(event.sortField) ? event.sortField[0] : event.sortField;
            this.currentSortOrder = event.sortOrder || 1;
        }

        // Get filter info
        if (event.filters) {
            this.tableFilters = event.filters;
        }

        const sortParam = `${this.currentSortField},${this.currentSortOrder === 1 ? 'asc' : 'desc'}`;
        const searchTerm = this.globalSearch?.trim() || undefined;

        const filters: any = {};
        if (event.filters) {
            Object.keys(event.filters).forEach(key => {
                const filterValue = (event.filters![key] as any)?.value;
                if (filterValue) {
                    filters[key] = filterValue;
                }
            });
        }

        const filterParams = Object.keys(filters).length > 0 && !searchTerm ? filters : undefined;

        this.inventoryService.getCategories(page, size, sortParam, searchTerm, filterParams).subscribe({
            next: (response) => {
                if (response && response.content) {
                    this.categoriesData = response.content;
                    this.totalRecords = response.totalElements || 0;
                } else if (Array.isArray(response)) {
                    this.categoriesData = response;
                    this.totalRecords = response.length;
                } else {
                    this.categoriesData = [];
                    this.totalRecords = 0;
                }
                this.loading = false;
            },
            error: (error) => {
                console.error('Error loading categories data:', error);
                this.loading = false;
                this.categoriesData = [];
                this.totalRecords = 0;
            }
        });
    }

    onSort(event: any) {
        this.currentSortField = event.field;
        this.currentSortOrder = event.order;
    }

    onFilter(event: any) {
        this.tableFilters = event.filters;
    }

    onGlobalSearch(event: any) {
        const lazyEvent: TableLazyLoadEvent = {
            first: 0,
            rows: this.pageSize,
            sortField: this.currentSortField,
            sortOrder: this.currentSortOrder,
            filters: this.tableFilters
        };
        this.loadCategoriesDataLazy(lazyEvent);
    }

    openAddDialog() {
        this.isEditMode = false;
        this.resetCategoryForm();
        this.selectedCategory = null; // Clear selected category for create mode
        this.showOnlyWithoutCategory = true; // Default to showing only products without category
        this.selectedProductsToAdd = [];
        this.loadAvailableProducts();
        this.showCategoryDialog = true;
    }

    openEditDialog(category: CategoryData) {
        this.isEditMode = true;
        this.selectedCategory = category; // Set selected category for edit mode
        this.categoryForm = {
            id: category.id,
            name: category.name,
            description: category.description || '',
            allowStoreToStoreTransfer: category.allowStoreToStoreTransfer !== false
        };
        this.selectedProductsWithoutCategory = [];
        this.showOnlyWithoutCategory = true; // Default to showing only products without category
        this.selectedProductsToAdd = [];
        this.loadProductsWithoutCategory();
        this.loadAvailableProducts(); // Load available products for selection
        this.showCategoryDialog = true;
    }

    saveCategory() {
        if (!this.categoryForm.name || this.categoryForm.name.trim() === '') {
            return;
        }

        const categoryData = {
            name: this.categoryForm.name.trim(),
            description: this.categoryForm.description?.trim() || undefined,
            allowStoreToStoreTransfer: this.categoryForm.allowStoreToStoreTransfer !== false
        };

        const operation = this.isEditMode && this.categoryForm.id
            ? this.inventoryService.updateCategory(this.categoryForm.id, categoryData)
            : this.inventoryService.createCategory(categoryData);

        operation.subscribe({
            next: (savedCategory) => {
                // If editing and products are selected, assign them to the category
                if (this.isEditMode && this.categoryForm.id && this.selectedProductsWithoutCategory.length > 0) {
                    this.assignProductsToCategory(this.categoryForm.id, this.selectedProductsWithoutCategory);
                } else {
                    this.messageService.add({ severity: 'success', summary: 'Success', detail: `Category ${this.isEditMode ? 'updated' : 'created'} successfully` });
                    this.showCategoryDialog = false;
                    this.loadCategoriesDataLazy({ first: 0, rows: this.pageSize, sortField: this.currentSortField, sortOrder: this.currentSortOrder, filters: this.tableFilters } as TableLazyLoadEvent);
                }
            },
            error: (error) => {
                this.messageService.add({ severity: 'error', summary: 'Error', detail: error.error?.error?.message || 'Failed to save category' });
            }
        });
    }
    
    loadProductsWithoutCategory() {
        this.loadingProductsWithoutCategory = true;
        // Get all products and filter those without category
        this.inventoryService.getProducts(0, 10000, undefined, undefined, undefined).subscribe({
            next: (response) => {
                let allProducts: ProductData[] = [];
                if (response && response.content) {
                    allProducts = response.content;
                } else if (Array.isArray(response)) {
                    allProducts = response;
                }
                // Filter products without category
                this.productsWithoutCategory = allProducts.filter(p => !p.category || !p.category.id);
                this.loadingProductsWithoutCategory = false;
            },
            error: (error) => {
                console.error('Error loading products without category:', error);
                this.productsWithoutCategory = [];
                this.loadingProductsWithoutCategory = false;
            }
        });
    }
    
    assignProductsToCategory(categoryId: number, products: ProductData[]) {
        // Update each selected product to assign it to the category
        const updateObservables = products.map(product => 
            this.inventoryService.updateProduct(product.id, {
                category: { id: categoryId }
            })
        );
        
        forkJoin(updateObservables).subscribe({
            next: () => {
                this.messageService.add({ 
                    severity: 'success', 
                    summary: 'Success', 
                    detail: `${products.length} product(s) added to category successfully` 
                });
                // Clear selection
                this.selectedProductsToAdd = [];
                // Reload category products and available products
                this.loadCategoryProducts(categoryId);
                this.loadAvailableProducts();
            },
            error: (error) => {
                this.messageService.add({ 
                    severity: 'error', 
                    summary: 'Error', 
                    detail: error.error?.error?.message || 'Failed to add products to category' 
                });
                console.error('Error assigning products to category:', error);
            }
        });
    }

    deleteCategory(category: CategoryData) {
        this.confirmationService.confirm({
            message: `Are you sure you want to delete "${category.name}"?`,
            header: 'Confirm Delete',
            icon: 'pi pi-exclamation-triangle',
            accept: () => {
                this.inventoryService.deleteCategory(category.id).subscribe({
                    next: () => {
                        this.messageService.add({ severity: 'success', summary: 'Success', detail: 'Category deleted successfully' });
                        this.loadCategoriesDataLazy({ first: 0, rows: this.pageSize, sortField: this.currentSortField, sortOrder: this.currentSortOrder, filters: this.tableFilters } as TableLazyLoadEvent);
                    },
                    error: (error) => {
                        this.messageService.add({ severity: 'error', summary: 'Error', detail: error.error?.error?.message || 'Failed to delete category' });
                    }
                });
            }
        });
    }

    openProductsDialog(category: CategoryData) {
        this.selectedCategory = category;
        this.showOnlyWithoutCategory = true; // Reset to default
        this.selectedProductsToAdd = [];
        this.loadCategoryProducts(category.id);
        this.loadAvailableProducts();
        this.showProductsDialog = true;
    }
    
    onFilterChange() {
        this.loadAvailableProducts();
        // Clear selection when filter changes
        this.selectedProductsToAdd = [];
    }
    
    loadAvailableProducts() {
        this.loadingAvailableProducts = true;
        this.inventoryService.getProducts(0, 10000, undefined, undefined, undefined).subscribe({
            next: (response) => {
                let allProducts: ProductData[] = [];
                if (response && response.content) {
                    allProducts = response.content;
                } else if (Array.isArray(response)) {
                    allProducts = response;
                }
                
                // Exclude products already in this category (only in edit mode)
                let filteredProducts = allProducts;
                if (this.isEditMode && this.selectedCategory && this.selectedCategory.id && this.categoryProducts) {
                    const categoryProductIds = this.categoryProducts.map(p => p.id);
                    filteredProducts = allProducts.filter(p => !categoryProductIds.includes(p.id));
                }
                
                if (this.showOnlyWithoutCategory) {
                    // Filter products without category
                    this.availableProductsForSelection = filteredProducts.filter(p => !p.category || !p.category.id);
                } else {
                    // Show all products (excluding those already in this category if editing)
                    this.availableProductsForSelection = filteredProducts;
                }
                this.loadingAvailableProducts = false;
            },
            error: (error) => {
                console.error('Error loading available products:', error);
                this.availableProductsForSelection = [];
                this.loadingAvailableProducts = false;
            }
        });
    }
    
    addSelectedProductsToCategory() {
        if (!this.selectedProductsToAdd || this.selectedProductsToAdd.length === 0) {
            return;
        }
        
        // For edit mode: category already exists
        if (this.isEditMode && this.selectedCategory && this.selectedCategory.id) {
            this.assignProductsToCategory(this.selectedCategory.id, this.selectedProductsToAdd);
        } else if (!this.isEditMode) {
            // For create mode: save category first, then add products
            if (!this.categoryForm.name || this.categoryForm.name.trim() === '') {
                this.messageService.add({ severity: 'warn', summary: 'Warning', detail: 'Please enter a category name first' });
                return;
            }
            
            const categoryData = {
                name: this.categoryForm.name.trim(),
                description: this.categoryForm.description?.trim() || undefined,
                allowStoreToStoreTransfer: this.categoryForm.allowStoreToStoreTransfer !== false
            };
            
            this.inventoryService.createCategory(categoryData).subscribe({
                next: (savedCategory) => {
                    // Assign selected products to the new category
                    this.assignProductsToCategory(savedCategory.id, this.selectedProductsToAdd);
                },
                error: (error) => {
                    this.messageService.add({ severity: 'error', summary: 'Error', detail: error.error?.error?.message || 'Failed to create category' });
                }
            });
        }
    }

    loadCategoryProducts(categoryId: number) {
        this.loadingProducts = true;
        this.inventoryService.getProducts(0, 1000, undefined, undefined, { categoryId }).subscribe({
            next: (response) => {
                if (response && response.content) {
                    this.categoryProducts = response.content;
                } else if (Array.isArray(response)) {
                    this.categoryProducts = response;
                } else {
                    this.categoryProducts = [];
                }
                this.loadingProducts = false;
            },
            error: (error) => {
                console.error('Error loading category products:', error);
                this.categoryProducts = [];
                this.loadingProducts = false;
            }
        });
    }

    openAddProductDialog() {
        this.isEditProductMode = false;
        this.resetProductForm();
        this.showProductDialog = true;
    }

    openEditProductDialog(product: ProductData) {
        this.isEditProductMode = true;
        this.productForm = {
            id: product.id,
            codeBarre: product.codeBarre,
            name: product.name,
            description: product.description || ''
        };
        this.showProductDialog = true;
    }

    saveProduct() {
        if (!this.productForm.name || this.productForm.name.trim() === '' || !this.productForm.codeBarre || this.productForm.codeBarre.trim() === '') {
            return;
        }

        if (!this.selectedCategory) {
            return;
        }

        const productData: any = {
            codeBarre: this.productForm.codeBarre.trim(),
            name: this.productForm.name.trim(),
            description: this.productForm.description?.trim() || undefined,
            category: { id: this.selectedCategory.id }
        };

        if (this.isEditProductMode && this.productForm.id) {
            // Update product
            this.inventoryService.updateProduct(this.productForm.id, {
                name: productData.name,
                description: productData.description,
                category: productData.category
            }).subscribe({
                next: () => {
                    this.messageService.add({ severity: 'success', summary: 'Success', detail: 'Product updated successfully' });
                    this.showProductDialog = false;
                    this.loadCategoryProducts(this.selectedCategory!.id);
                },
                error: (error) => {
                    this.messageService.add({ severity: 'error', summary: 'Error', detail: error.error?.error?.message || 'Failed to update product' });
                }
            });
        } else {
            // Create product
            this.inventoryService.createProduct(productData).subscribe({
                next: () => {
                    this.messageService.add({ severity: 'success', summary: 'Success', detail: 'Product created successfully' });
                    this.showProductDialog = false;
                    this.loadCategoryProducts(this.selectedCategory!.id);
                },
                error: (error) => {
                    this.messageService.add({ severity: 'error', summary: 'Error', detail: error.error?.error?.message || 'Failed to create product' });
                }
            });
        }
    }

    removeProductFromCategory(product: ProductData) {
        this.confirmationService.confirm({
            message: `Are you sure you want to remove "${product.name}" from this category?`,
            header: 'Confirm Remove',
            icon: 'pi pi-exclamation-triangle',
            accept: () => {
                this.inventoryService.updateProduct(product.id, { category: null }).subscribe({
                    next: () => {
                        this.messageService.add({ severity: 'success', summary: 'Success', detail: 'Product removed from category' });
                        this.loadCategoryProducts(this.selectedCategory!.id);
                    },
                    error: (error) => {
                        this.messageService.add({ severity: 'error', summary: 'Error', detail: error.error?.error?.message || 'Failed to remove product' });
                    }
                });
            }
        });
    }

    resetCategoryForm() {
        this.categoryForm = {
            id: null,
            name: '',
            description: '',
            allowStoreToStoreTransfer: true
        };
        this.selectedProductsWithoutCategory = [];
        this.productsWithoutCategory = [];
        this.selectedProductsToAdd = [];
        this.availableProductsForSelection = [];
        this.showOnlyWithoutCategory = true;
        this.selectedCategory = null;
        this.isEditMode = false;
    }

    resetProductForm() {
        this.productForm = {
            id: null,
            codeBarre: '',
            name: '',
            description: ''
        };
        this.isEditProductMode = false;
    }

    resetProductsForm() {
        this.selectedCategory = null;
        this.categoryProducts = [];
        this.selectedProductsToAdd = [];
        this.availableProductsForSelection = [];
        this.showOnlyWithoutCategory = true;
    }
}
