import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TableModule, TableLazyLoadEvent } from 'primeng/table';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { TextareaModule } from 'primeng/textarea';
import { SelectModule } from 'primeng/select';
import { ToastModule } from 'primeng/toast';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ConfirmationService, MessageService } from 'primeng/api';
import { InventoryDataService } from '../../../shared/services/inventory-data.service';

interface ProductData {
    id: number;
    codeBarre: string;
    name: string;
    description?: string;
    category?: { id: number; name: string };
}

interface CategoryData {
    id: number;
    name: string;
    description?: string;
}

@Component({
    selector: 'app-products',
    standalone: true,
    imports: [
        CommonModule, FormsModule, TableModule, InputTextModule, ButtonModule,
        DialogModule, TextareaModule, SelectModule, ToastModule, ConfirmDialogModule
    ],
    providers: [MessageService, ConfirmationService],
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
                            <h1 class="text-surface-900 dark:text-surface-0 text-3xl font-semibold mb-2">Products</h1>
                            <p class="text-muted-color">Manage all products in your inventory system with pagination, sorting, filtering, and search.</p>
                        </div>
                        <button 
                            pButton 
                            label="Add Product" 
                            icon="pi pi-plus" 
                            class="p-button-primary"
                            (click)="openAddDialog()">
                        </button>
                    </div>
                    
                    <p-table 
                        [value]="productsData" 
                        [paginator]="true" 
                        [rows]="pageSize"
                        [totalRecords]="totalRecords"
                        [lazy]="true"
                        (onLazyLoad)="loadProductsDataLazy($event)"
                        [globalFilterFields]="['name', 'codeBarre', 'description']" 
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
                                        placeholder="Search by Name, Barcode, or Description" 
                                        class="w-full"
                                    />
                                </span>
                            </div>
                        </ng-template>
                        <ng-template pTemplate="header">
                            <tr>
                                <th [pSortableColumn]="'codeBarre'">
                                    <div class="flex items-center justify-between gap-2">
                                        <div class="flex items-center gap-2">
                                            <span>Barcode</span>
                                            <p-sortIcon [field]="'codeBarre'"></p-sortIcon>
                                        </div>
                                        <p-columnFilter type="text" field="codeBarre" display="menu" [showMatchModes]="false" matchMode="contains"></p-columnFilter>
                                    </div>
                                </th>
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
                                <th>Category</th>
                                <th>Actions</th>
                            </tr>
                        </ng-template>
                        <ng-template pTemplate="emptymessage">
                            <tr>
                                <td colspan="5" class="text-center py-8 text-muted-color">
                                    <div *ngIf="!loading">
                                        <p class="mb-2">No products found.</p>
                                        <p class="text-sm" *ngIf="globalSearch">Try adjusting your search query.</p>
                                    </div>
                                </td>
                            </tr>
                        </ng-template>
                        <ng-template pTemplate="body" let-product>
                            <tr>
                                <td>{{ product.codeBarre }}</td>
                                <td>{{ product.name }}</td>
                                <td>{{ product.description || 'N/A' }}</td>
                                <td>{{ product.category?.name || 'N/A' }}</td>
                                <td>
                                    <div class="flex gap-2">
                                        <button 
                                            pButton 
                                            icon="pi pi-pencil" 
                                            class="p-button-sm p-button-text"
                                            (click)="openEditDialog(product)"
                                            title="Edit">
                                        </button>
                                        <button 
                                            pButton 
                                            icon="pi pi-trash" 
                                            class="p-button-sm p-button-text p-button-danger"
                                            (click)="deleteProduct(product)"
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

        <!-- Product Dialog -->
        <p-dialog 
            [(visible)]="showProductDialog" 
            [header]="isEditMode ? 'Edit Product' : 'Add Product'"
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
                            [disabled]="isEditMode"
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
                    <div>
                        <label for="productCategory" class="block mb-2 font-medium">Category</label>
                        <p-select 
                            id="productCategory"
                            [(ngModel)]="productForm.categoryId" 
                            name="productCategory"
                            [options]="categories"
                            optionLabel="name"
                            optionValue="id"
                            placeholder="Select a category"
                            [showClear]="true"
                            appendTo="body"
                            class="w-full">
                        </p-select>
                    </div>
                    <div class="flex justify-end gap-2 mt-4">
                        <button 
                            pButton 
                            type="button"
                            label="Cancel" 
                            class="p-button-secondary"
                            (click)="showProductDialog = false">
                        </button>
                        <button 
                            pButton 
                            type="submit"
                            label="Save" 
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
export class ProductsComponent implements OnInit {
    private inventoryService = inject(InventoryDataService);
    private messageService = inject(MessageService);
    private confirmationService = inject(ConfirmationService);
    
    productsData: ProductData[] = [];
    loading = false;
    totalRecords = 0;
    pageSize = 20;
    
    // Search and sort state
    globalSearch: string = '';
    currentSortField: string = 'id';
    currentSortOrder: number = 1; // 1 for ASC, -1 for DESC
    tableFilters: { [key: string]: any } = {};

    // Dialog state
    showProductDialog = false;
    isEditMode = false;
    categories: CategoryData[] = [];
    loadingCategories = false;

    productForm = {
        id: null as number | null,
        codeBarre: '',
        name: '',
        description: '',
        categoryId: null as number | null
    };

    ngOnInit() {
        // Initial load will be triggered by lazy load
        this.loadCategories();
    }

    loadCategories() {
        this.loadingCategories = true;
        this.inventoryService.getCategories(0, 1000, undefined, undefined, undefined).subscribe({
            next: (response) => {
                if (response && response.content) {
                    this.categories = response.content;
                } else if (Array.isArray(response)) {
                    this.categories = response;
                } else {
                    this.categories = [];
                }
                this.loadingCategories = false;
            },
            error: (error) => {
                console.error('Error loading categories:', error);
                this.categories = [];
                this.loadingCategories = false;
            }
        });
    }

    openAddDialog() {
        this.isEditMode = false;
        this.resetProductForm();
        this.showProductDialog = true;
    }

    openEditDialog(product: ProductData) {
        this.isEditMode = true;
        this.productForm = {
            id: product.id,
            codeBarre: product.codeBarre,
            name: product.name,
            description: product.description || '',
            categoryId: product.category?.id || null
        };
        this.showProductDialog = true;
    }

    saveProduct() {
        if (!this.productForm.name || this.productForm.name.trim() === '' || !this.productForm.codeBarre || this.productForm.codeBarre.trim() === '') {
            return;
        }

        const productData: any = {
            codeBarre: this.productForm.codeBarre.trim(),
            name: this.productForm.name.trim(),
            description: this.productForm.description?.trim() || undefined,
            category: this.productForm.categoryId ? { id: this.productForm.categoryId } : null
        };

        if (this.isEditMode && this.productForm.id) {
            // Update product
            this.inventoryService.updateProduct(this.productForm.id, {
                name: productData.name,
                description: productData.description,
                category: productData.category
            }).subscribe({
                next: () => {
                    this.messageService.add({ severity: 'success', summary: 'Success', detail: 'Product updated successfully' });
                    this.showProductDialog = false;
                    this.loadProductsDataLazy({ first: 0, rows: this.pageSize, sortField: this.currentSortField, sortOrder: this.currentSortOrder, filters: this.tableFilters } as TableLazyLoadEvent);
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
                    this.loadProductsDataLazy({ first: 0, rows: this.pageSize, sortField: this.currentSortField, sortOrder: this.currentSortOrder, filters: this.tableFilters } as TableLazyLoadEvent);
                },
                error: (error) => {
                    this.messageService.add({ severity: 'error', summary: 'Error', detail: error.error?.error?.message || 'Failed to create product' });
                }
            });
        }
    }

    deleteProduct(product: ProductData) {
        this.confirmationService.confirm({
            message: `Are you sure you want to delete "${product.name}"?`,
            header: 'Confirm Delete',
            icon: 'pi pi-exclamation-triangle',
            accept: () => {
                this.inventoryService.deleteProduct(product.id).subscribe({
                    next: () => {
                        this.messageService.add({ severity: 'success', summary: 'Success', detail: 'Product deleted successfully' });
                        this.loadProductsDataLazy({ first: 0, rows: this.pageSize, sortField: this.currentSortField, sortOrder: this.currentSortOrder, filters: this.tableFilters } as TableLazyLoadEvent);
                    },
                    error: (error) => {
                        this.messageService.add({ severity: 'error', summary: 'Error', detail: error.error?.error?.message || 'Failed to delete product' });
                    }
                });
            }
        });
    }

    resetProductForm() {
        this.productForm = {
            id: null,
            codeBarre: '',
            name: '',
            description: '',
            categoryId: null
        };
        this.isEditMode = false;
    }

    loadProductsDataLazy(event: TableLazyLoadEvent) {
        this.loading = true;
        const page = event.first && event.rows ? Math.floor(event.first / event.rows) : 0;
        const size = event.rows || this.pageSize;
        
        this.pageSize = size;

        // Build sort parameter
        let sortParam: string | undefined;
        if (event.sortField) {
            const sortField = Array.isArray(event.sortField) ? event.sortField[0] : event.sortField;
            const sortOrder = event.sortOrder === 1 ? 'asc' : 'desc';
            sortParam = `${sortField},${sortOrder}`;
            this.currentSortField = sortField;
            this.currentSortOrder = event.sortOrder || 1;
        } else {
            sortParam = `${this.currentSortField},${this.currentSortOrder === 1 ? 'asc' : 'desc'}`;
        }

        // Build filters from column filters
        const filters: { name?: string; codeBarre?: string; description?: string } = {};
        if (event.filters) {
            // Update table filters state
            this.tableFilters = { ...event.filters };
            
            // Extract filter values
            const nameFilter = event.filters['name'];
            const codeBarreFilter = event.filters['codeBarre'];
            const descriptionFilter = event.filters['description'];
            
            // Handle single filter object or array
            if (nameFilter) {
                const filterValue = Array.isArray(nameFilter) ? nameFilter[0] : nameFilter;
                if (filterValue && filterValue.value !== null && filterValue.value !== undefined && filterValue.value !== '') {
                    filters.name = String(filterValue.value).trim();
                }
            }
            if (codeBarreFilter) {
                const filterValue = Array.isArray(codeBarreFilter) ? codeBarreFilter[0] : codeBarreFilter;
                if (filterValue && filterValue.value !== null && filterValue.value !== undefined && filterValue.value !== '') {
                    filters.codeBarre = String(filterValue.value).trim();
                }
            }
            if (descriptionFilter) {
                const filterValue = Array.isArray(descriptionFilter) ? descriptionFilter[0] : descriptionFilter;
                if (filterValue && filterValue.value !== null && filterValue.value !== undefined && filterValue.value !== '') {
                    filters.description = String(filterValue.value).trim();
                }
            }
        }

        // Use global search if provided, otherwise use filters
        const searchTerm = this.globalSearch?.trim() || undefined;
        const filterParams = Object.keys(filters).length > 0 && !searchTerm ? filters : undefined;

        this.inventoryService.getProducts(page, size, sortParam, searchTerm, filterParams).subscribe({
            next: (response) => {
                if (response && response.content) {
                    this.productsData = response.content.map((product: any) => ({
                        id: product.id,
                        codeBarre: product.codeBarre,
                        name: product.name,
                        description: product.description,
                        category: product.category
                    }));
                    this.totalRecords = response.totalElements || 0;
                } else if (Array.isArray(response)) {
                    this.productsData = response.map((product: any) => ({
                        id: product.id,
                        codeBarre: product.codeBarre,
                        name: product.name,
                        description: product.description,
                        category: product.category
                    }));
                    this.totalRecords = response.length;
                } else {
                    this.productsData = [];
                    this.totalRecords = 0;
                }
                this.loading = false;
            },
            error: (error) => {
                console.error('Error loading products data:', error);
                this.loading = false;
                this.productsData = [];
                this.totalRecords = 0;
            }
        });
    }

    onGlobalSearch(event: any) {
        // Reset to first page when searching, but preserve column filters
        const lazyEvent: TableLazyLoadEvent = {
            first: 0,
            rows: this.pageSize,
            sortField: this.currentSortField,
            sortOrder: this.currentSortOrder,
            filters: this.tableFilters
        };
        this.loadProductsDataLazy(lazyEvent);
    }

    onSort(event: any) {
        this.currentSortField = event.field;
        this.currentSortOrder = event.order;
        // Reload with new sort
        const lazyEvent: TableLazyLoadEvent = {
            first: 0,
            rows: this.pageSize,
            sortField: event.field,
            sortOrder: event.order,
            filters: this.tableFilters
        };
        this.loadProductsDataLazy(lazyEvent);
    }

    onFilter(event: any) {
        // When filters change, trigger lazy load
        const lazyEvent: TableLazyLoadEvent = {
            first: 0,
            rows: this.pageSize,
            sortField: this.currentSortField,
            sortOrder: this.currentSortOrder,
            filters: event.filters || {}
        };
        this.loadProductsDataLazy(lazyEvent);
    }
}
