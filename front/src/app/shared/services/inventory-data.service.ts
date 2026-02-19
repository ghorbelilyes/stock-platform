import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map, catchError, throwError, of } from 'rxjs';
import { Store, Stock, Sale, ColumnMapping, FileMappingConfig, BACKEND_COLUMNS } from '../models/inventory.models';
import { API_CONFIG } from '../config/api.config';

interface ApiResponse<T> {
    success: boolean;
    data: T;
    message: string;
    error?: {
        code: string;
        message: string;
        details: string[];
    };
}

interface ParseHeadersResponse {
    headers: string[];
    rowCount: number;
}

interface RequiredColumnsResponse {
    fileType: string;
    requiredColumns: string[];
}

interface ValidationResult {
    valid: boolean;
    errors: string[];
    rowCount?: number;
    validRows?: number;
    invalidRows?: number;
}

interface ImportResult {
    fileUploadId: number;
    fileName: string;
    fileType: string;
    uploadedAt: string;
    valid: boolean;
    rowsProcessed: number;
    rowsInserted: number;
    rowsFailed: number;
    errors: string[];
}

interface StockConsistencyValidationResult {
    valid: boolean;
    errors: string[];
    message?: string;
    newSalesRecords?: number;
    updateSalesRecords?: number;
    newTransferRecords?: number;
    updateTransferRecords?: number;
    updateStockRecords?: number;
    newSalesDetails?: string[];
    updateSalesDetails?: string[];
    newTransferDetails?: string[];
    updateTransferDetails?: string[];
}

export interface BulkImportResult {
    success: boolean;
    message: string;
    timestamp: string;
    results: {
        stock?: ImportResult;
        sales?: ImportResult;
        transfer?: ImportResult;
    };
    globalErrors: string[];
}

@Injectable({
    providedIn: 'root'
})
export class InventoryDataService {
    private http = inject(HttpClient);
    private apiUrl = API_CONFIG.baseUrl;

    private uploadedFiles: {
        stores?: { name: string; uploadedAt: string; valid: boolean; errors?: string[]; columnMapping?: FileMappingConfig };
        stocks?: { name: string; uploadedAt: string; valid: boolean; errors?: string[]; columnMapping?: FileMappingConfig };
        sales?: { name: string; uploadedAt: string; valid: boolean; errors?: string[]; columnMapping?: FileMappingConfig };
        transfers?: { name: string; uploadedAt: string; valid: boolean; errors?: string[]; columnMapping?: FileMappingConfig };
        products?: { name: string; uploadedAt: string; valid: boolean; errors?: string[]; columnMapping?: FileMappingConfig };
    } = {};

    // Get all stores with pagination, sorting, filtering, and search
    getStores(
        page: number = 0,
        size: number = 20,
        sort?: string,
        search?: string,
        filters?: {
            name?: string;
            serialNumber?: string;
            city?: string;
            type?: string;
        }
    ): Observable<any> {
        let params = new HttpParams()
            .set('page', page.toString())
            .set('size', size.toString());

        if (sort) {
            params = params.set('sort', sort);
        }

        if (search) {
            params = params.set('search', search);
        }

        if (filters) {
            if (filters.name) {
                params = params.set('name', filters.name);
            }
            if (filters.serialNumber) {
                params = params.set('serialNumber', filters.serialNumber);
            }
            if (filters.city) {
                params = params.set('city', filters.city);
            }
            if (filters.type) {
                params = params.set('type', filters.type);
            }
        }

        return this.http.get<ApiResponse<any>>(`${this.apiUrl}${API_CONFIG.endpoints.stores}`, { params })
            .pipe(
                map(response => response.data),
                catchError(error => {
                    console.error('Error fetching stores:', error);
                    return throwError(() => error);
                })
            );
    }

    // Get stocks with pagination, sorting, filtering, and search
    getStocks(
        page: number = 0,
        size: number = 20,
        sort?: string,
        search?: string,
        filters?: {
            storeName?: string;
            productName?: string;
            city?: string;
            type?: string;
        }
    ): Observable<any> {
        let params = new HttpParams()
            .set('page', page.toString())
            .set('size', size.toString());

        if (sort) {
            params = params.set('sort', sort);
        }

        if (search) {
            params = params.set('search', search);
        }

        if (filters) {
            if (filters.storeName) {
                params = params.set('storeName', filters.storeName);
            }
            if (filters.productName) {
                params = params.set('productName', filters.productName);
            }
            if (filters.city) {
                params = params.set('city', filters.city);
            }
            if (filters.type) {
                params = params.set('type', filters.type);
            }
        }

        return this.http.get<ApiResponse<any>>(`${this.apiUrl}${API_CONFIG.endpoints.stocks}`, { params })
            .pipe(
                map(response => response.data),
                catchError(error => {
                    console.error('Error fetching stocks:', error);
                    return throwError(() => error);
                })
            );
    }

    /** Get transfers where the given store is source or destination and product matches. Used for stock row expansion. */
    getTransfersByStoreAndProduct(storeId: number, productId: number): Observable<any[]> {
        const params = new HttpParams()
            .set('storeId', storeId.toString())
            .set('productId', productId.toString());
        return this.http.get<ApiResponse<any[]>>(`${this.apiUrl}${API_CONFIG.endpoints.transfers}/by-store-and-product`, { params })
            .pipe(
                map(response => (response?.data != null && Array.isArray(response.data)) ? response.data : []),
                catchError(error => {
                    console.error('Error fetching transfers by store and product:', error);
                    return throwError(() => error);
                })
            );
    }

    // Get sales with pagination, sorting, filtering, and search
    getSales(
        page: number = 0,
        size: number = 20,
        sort?: string,
        search?: string,
        filters?: {
            storeName?: string;
            productName?: string;
            city?: string;
            startDate?: string;
            endDate?: string;
        }
    ): Observable<any> {
        let params = new HttpParams()
            .set('page', page.toString())
            .set('size', size.toString());

        if (sort) {
            params = params.set('sort', sort);
        }

        if (search) {
            params = params.set('search', search);
        }

        if (filters) {
            if (filters.storeName) {
                params = params.set('storeName', filters.storeName);
            }
            if (filters.productName) {
                params = params.set('productName', filters.productName);
            }
            if (filters.city) {
                params = params.set('city', filters.city);
            }
            if (filters.startDate) {
                params = params.set('startDate', filters.startDate);
            }
            if (filters.endDate) {
                params = params.set('endDate', filters.endDate);
            }
        }

        return this.http.get<ApiResponse<any>>(`${this.apiUrl}${API_CONFIG.endpoints.sales}`, { params })
            .pipe(
                map(response => response.data),
                catchError(error => {
                    console.error('Error fetching sales:', error);
                    return throwError(() => error);
                })
            );
    }

    // Get all products with pagination, sorting, filtering, and search
    getProducts(
        page: number = 0,
        size: number = 20,
        sort?: string,
        search?: string,
        filters?: {
            name?: string;
            codeBarre?: string;
            description?: string;
            categoryId?: number;
        }
    ): Observable<any> {
        let params = new HttpParams()
            .set('page', page.toString())
            .set('size', size.toString());

        if (sort) {
            params = params.set('sort', sort);
        }

        if (search) {
            params = params.set('search', search);
        }

        if (filters) {
            if (filters.name) {
                params = params.set('name', filters.name);
            }
            if (filters.codeBarre) {
                params = params.set('codeBarre', filters.codeBarre);
            }
            if (filters.description) {
                params = params.set('description', filters.description);
            }
            if (filters.categoryId) {
                params = params.set('categoryId', filters.categoryId.toString());
            }
        }

        return this.http.get<ApiResponse<any>>(`${this.apiUrl}${API_CONFIG.endpoints.products}`, { params })
            .pipe(
                map(response => response.data),
                catchError(error => {
                    console.error('Error fetching products:', error);
                    return throwError(() => error);
                })
            );
    }

    // Get all categories with pagination, sorting, filtering, and search
    getCategories(
        page: number = 0,
        size: number = 20,
        sort?: string,
        search?: string,
        filters?: {
            name?: string;
            description?: string;
        }
    ): Observable<any> {
        let params = new HttpParams()
            .set('page', page.toString())
            .set('size', size.toString());

        if (sort) {
            params = params.set('sort', sort);
        }

        if (search) {
            params = params.set('search', search);
        }

        if (filters) {
            if (filters.name) {
                params = params.set('name', filters.name);
            }
            if (filters.description) {
                params = params.set('description', filters.description);
            }
        }

        return this.http.get<ApiResponse<any>>(`${this.apiUrl}${API_CONFIG.endpoints.categories}`, { params })
            .pipe(
                map(response => response.data),
                catchError(error => {
                    console.error('Error fetching categories:', error);
                    return throwError(() => error);
                })
            );
    }

    // Get category by ID
    getCategoryById(id: number): Observable<any> {
        return this.http.get<ApiResponse<any>>(`${this.apiUrl}${API_CONFIG.endpoints.categories}/${id}`)
            .pipe(
                map(response => response.data),
                catchError(error => {
                    console.error('Error fetching category:', error);
                    return throwError(() => error);
                })
            );
    }

    // Create category
    createCategory(category: { name: string; description?: string; allowStoreToStoreTransfer?: boolean }): Observable<any> {
        return this.http.post<ApiResponse<any>>(`${this.apiUrl}${API_CONFIG.endpoints.categories}`, category)
            .pipe(
                map(response => response.data),
                catchError(error => {
                    console.error('Error creating category:', error);
                    return throwError(() => error);
                })
            );
    }

    // Update category
    updateCategory(id: number, category: { name: string; description?: string; allowStoreToStoreTransfer?: boolean }): Observable<any> {
        return this.http.put<ApiResponse<any>>(`${this.apiUrl}${API_CONFIG.endpoints.categories}/${id}`, category)
            .pipe(
                map(response => response.data),
                catchError(error => {
                    console.error('Error updating category:', error);
                    return throwError(() => error);
                })
            );
    }

    // Delete category
    deleteCategory(id: number): Observable<any> {
        return this.http.delete<ApiResponse<any>>(`${this.apiUrl}${API_CONFIG.endpoints.categories}/${id}`)
            .pipe(
                map(response => response.data),
                catchError(error => {
                    console.error('Error deleting category:', error);
                    return throwError(() => error);
                })
            );
    }

    // Create product
    createProduct(product: { id?: number; codeBarre: string; name: string; description?: string; category?: { id: number } }): Observable<any> {
        return this.http.post<ApiResponse<any>>(`${this.apiUrl}${API_CONFIG.endpoints.products}`, product)
            .pipe(
                map(response => response.data),
                catchError(error => {
                    console.error('Error creating product:', error);
                    return throwError(() => error);
                })
            );
    }

    // Update product
    updateProduct(id: number, product: { name?: string; description?: string; category?: { id: number } | null }): Observable<any> {
        return this.http.put<ApiResponse<any>>(`${this.apiUrl}${API_CONFIG.endpoints.products}/${id}`, product)
            .pipe(
                map(response => response.data),
                catchError(error => {
                    console.error('Error updating product:', error);
                    return throwError(() => error);
                })
            );
    }

    // Delete product
    deleteProduct(id: number): Observable<any> {
        return this.http.delete<ApiResponse<any>>(`${this.apiUrl}${API_CONFIG.endpoints.products}/${id}`)
            .pipe(
                map(response => response.data),
                catchError(error => {
                    console.error('Error deleting product:', error);
                    return throwError(() => error);
                })
            );
    }

    setUploadedFilesState(files: {
        stores?: { name: string; uploadedAt: string; valid: boolean; errors?: string[]; columnMapping?: FileMappingConfig };
        stocks?: { name: string; uploadedAt: string; valid: boolean; errors?: string[]; columnMapping?: FileMappingConfig };
        sales?: { name: string; uploadedAt: string; valid: boolean; errors?: string[]; columnMapping?: FileMappingConfig };
        transfers?: { name: string; uploadedAt: string; valid: boolean; errors?: string[]; columnMapping?: FileMappingConfig };
        products?: { name: string; uploadedAt: string; valid: boolean; errors?: string[]; columnMapping?: FileMappingConfig };
    }): void {
        this.uploadedFiles = files;
    }

    getUploadedFilesState() {
        return { ...this.uploadedFiles };
    }

    // Parse CSV headers using backend API
    async parseCSVHeaders(file: File): Promise<string[]> {
        const formData = new FormData();
        formData.append('file', file);

        try {
            const response = await this.http.post<ApiResponse<ParseHeadersResponse>>(
                `${this.apiUrl}${API_CONFIG.endpoints.parseHeaders}`,
                formData
            ).toPromise();

            if (response?.success && response.data) {
                return response.data.headers;
            } else {
                throw new Error(response?.error?.message || 'Failed to parse headers');
            }
        } catch (error: any) {
            console.error('Error parsing CSV headers:', error);
            // Fallback to client-side parsing if API fails
            return this.parseCSVHeadersClientSide(file);
        }
    }

    // Client-side fallback for parsing headers
    private parseCSVHeadersClientSide(file: File): Promise<string[]> {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e: any) => {
                try {
                    const text = e.target.result as string;
                    const lines = text.split('\n');
                    if (lines.length > 0) {
                        const headers = lines[0]
                            .split(/[,;]/)
                            .map(h => h.trim().replace(/^["']|["']$/g, ''));
                        resolve(headers);
                    } else {
                        reject(new Error('Empty file'));
                    }
                } catch (error) {
                    reject(error);
                }
            };
            reader.onerror = () => reject(new Error('Failed to read file'));
            reader.readAsText(file);
        });
    }

    // Get required columns from backend
    getRequiredColumns(fileType: 'stock' | 'sales' | 'transfer' | 'store' | 'product'): Observable<string[]> {
        const fileTypeUpper = fileType.toUpperCase();
        return this.http.get<ApiResponse<RequiredColumnsResponse>>(
            `${this.apiUrl}${API_CONFIG.endpoints.requiredColumns}/${fileTypeUpper}`
        ).pipe(
            map(response => {
                if (response.success && response.data) {
                    return response.data.requiredColumns;
                }
                // Fallback to local constant
                return [...BACKEND_COLUMNS[fileType]];
            }),
            catchError(error => {
                console.error('Error fetching required columns:', error);
                // Fallback to local constant
                return of([...BACKEND_COLUMNS[fileType]]);
            })
        );
    }

    // Validate file with column mapping
    validateFile(file: File, fileType: 'stock' | 'sales' | 'transfer' | 'store' | 'product', columnMapping: FileMappingConfig): Observable<ValidationResult> {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('fileType', fileType.toUpperCase());

        // Convert fileType in columnMapping to uppercase for backend enum
        const columnMappingForBackend = {
            ...columnMapping,
            fileType: columnMapping.fileType.toUpperCase()
        };
        formData.append('columnMapping', JSON.stringify(columnMappingForBackend));

        return this.http.post<ApiResponse<ValidationResult>>(
            `${this.apiUrl}${API_CONFIG.endpoints.validateFile}`,
            formData
        ).pipe(
            map(response => {
                if (response.success && response.data) {
                    return response.data;
                }
                return { valid: false, errors: [response.error?.message || 'Validation failed'] };
            }),
            catchError(error => {
                console.error('Error validating file:', error);
                return throwError(() => ({
                    valid: false,
                    errors: [error.error?.error?.message || 'Validation error occurred']
                }));
            })
        );
    }

    // Upload and import file
    uploadFile(file: File, fileType: 'stock' | 'sales' | 'transfer' | 'store' | 'product', columnMapping: FileMappingConfig): Observable<ImportResult> {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('fileType', fileType.toUpperCase());

        // Convert fileType in columnMapping to uppercase for backend enum
        const columnMappingForBackend = {
            ...columnMapping,
            fileType: columnMapping.fileType.toUpperCase()
        };
        formData.append('columnMapping', JSON.stringify(columnMappingForBackend));

        return this.http.post<ApiResponse<ImportResult>>(
            `${this.apiUrl}${API_CONFIG.endpoints.uploadFile}`,
            formData
        ).pipe(
            map(response => {
                if (response.success && response.data) {
                    return response.data;
                }
                throw new Error(response.error?.message || 'Upload failed');
            }),
            catchError(error => {
                console.error('Error uploading file:', error);
                return throwError(() => error);
            })
        );
    }

    // Validate stock consistency with sales and transfers
    validateStockConsistency(
        stockFile: File,
        salesFile: File,
        transferFile: File,
        stockMapping: FileMappingConfig,
        salesMapping: FileMappingConfig,
        transferMapping: FileMappingConfig
    ): Observable<StockConsistencyValidationResult> {
        const formData = new FormData();
        formData.append('stockFile', stockFile);
        formData.append('salesFile', salesFile);
        formData.append('transferFile', transferFile);

        // Convert fileType in columnMapping to uppercase for backend enum
        const stockMappingForBackend = {
            ...stockMapping,
            fileType: stockMapping.fileType.toUpperCase()
        };
        const salesMappingForBackend = {
            ...salesMapping,
            fileType: salesMapping.fileType.toUpperCase()
        };
        const transferMappingForBackend = {
            ...transferMapping,
            fileType: transferMapping.fileType.toUpperCase()
        };

        formData.append('stockMapping', JSON.stringify(stockMappingForBackend));
        formData.append('salesMapping', JSON.stringify(salesMappingForBackend));
        formData.append('transferMapping', JSON.stringify(transferMappingForBackend));

        return this.http.post<ApiResponse<StockConsistencyValidationResult>>(
            `${this.apiUrl}${API_CONFIG.endpoints.validateStockConsistency}`,
            formData
        ).pipe(
            map(response => {
                if (response.success && response.data) {
                    return response.data;
                }
                return {
                    valid: false,
                    errors: [response.error?.message || 'Validation failed'],
                    message: 'Validation failed'
                };
            }),
            catchError(error => {
                console.error('Error validating stock consistency:', error);

                // If it's a 400 error with validation data, return that data instead of throwing
                if (error.status === 400 && error.error?.data) {
                    return of(error.error.data as StockConsistencyValidationResult);
                }

                return throwError(() => ({
                    valid: false,
                    errors: [error.error?.error?.message || 'Validation error occurred'],
                    message: 'Validation error occurred'
                }));
            })
        );
    }

    // Check consistency of current database data
    checkDatabaseConsistency(date?: string): Observable<StockConsistencyValidationResult> {
        let url = `${this.apiUrl}${API_CONFIG.endpoints.checkDatabaseConsistency}`;
        if (date) {
            url += `?date=${date}`;
        }

        return this.http.get<ApiResponse<StockConsistencyValidationResult>>(url).pipe(
            map(response => {
                if (response.success && response.data) {
                    return response.data;
                }
                return {
                    valid: false,
                    errors: [response.error?.message || 'Check failed'],
                    message: 'Database consistency check failed'
                };
            }),
            catchError(error => {
                console.error('Error checking database consistency:', error);

                // If it's a 400 error with validation data, return that data instead of throwing
                if (error.status === 400 && error.error?.data) {
                    return of(error.error.data as StockConsistencyValidationResult);
                }

                return throwError(() => ({
                    valid: false,
                    errors: [error.error?.error?.message || 'Check error occurred'],
                    message: 'Database consistency check error occurred'
                }));
            })
        );
    }

    // Save column mapping configuration (local storage)
    saveColumnMapping(fileType: 'stock' | 'sales' | 'transfer' | 'store' | 'product', mapping: FileMappingConfig): void {
        const fileKey = fileType === 'stock' ? 'stocks' :
            fileType === 'sales' ? 'sales' :
                fileType === 'transfer' ? 'transfers' :
                    fileType === 'product' ? 'products' :
                        'stores';
        if (this.uploadedFiles[fileKey]) {
            this.uploadedFiles[fileKey]!.columnMapping = mapping;
        }
    }

    // Bulk upload multiple files
    bulkUpload(
        stockFile: File,
        salesFile: File,
        transferFile: File,
        stockMapping: FileMappingConfig,
        salesMapping: FileMappingConfig,
        transferMapping: FileMappingConfig
    ): Observable<BulkImportResult> {
        const formData = new FormData();
        formData.append('stockFile', stockFile);
        formData.append('salesFile', salesFile);
        formData.append('transferFile', transferFile);

        // Convert fileType in columnMapping to uppercase for backend enum
        const stockMappingForBackend = {
            ...stockMapping,
            fileType: stockMapping.fileType.toUpperCase()
        };
        const salesMappingForBackend = {
            ...salesMapping,
            fileType: salesMapping.fileType.toUpperCase()
        };
        const transferMappingForBackend = {
            ...transferMapping,
            fileType: transferMapping.fileType.toUpperCase()
        };

        formData.append('stockMapping', JSON.stringify(stockMappingForBackend));
        formData.append('salesMapping', JSON.stringify(salesMappingForBackend));
        formData.append('transferMapping', JSON.stringify(transferMappingForBackend));

        return this.http.post<ApiResponse<BulkImportResult>>(
            `${this.apiUrl}${API_CONFIG.endpoints.bulkUpload}`,
            formData
        ).pipe(
            map(response => {
                if (response.success && response.data) {
                    return response.data;
                }
                throw new Error(response.error?.message || 'Bulk upload failed');
            }),
            catchError(error => {
                console.error('Error in bulk upload:', error);
                // If it's a 400 error with bulk result data, return that data instead of throwing
                if (error.status === 400 && error.error?.data) {
                    return of(error.error.data as BulkImportResult);
                }
                return throwError(() => error);
            })
        );
    }
}
