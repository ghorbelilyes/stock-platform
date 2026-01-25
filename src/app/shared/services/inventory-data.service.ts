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
}
