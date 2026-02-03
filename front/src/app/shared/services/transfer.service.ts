import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map, catchError, throwError } from 'rxjs';
import { TransferSuggestion, Transfer, TransferStatus } from '../models/inventory.models';
import { InventoryDataService } from './inventory-data.service';
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

@Injectable({
    providedIn: 'root'
})
export class TransferService {
    private http = inject(HttpClient);
    private inventoryService = inject(InventoryDataService);
    private apiUrl = API_CONFIG.baseUrl;

    // Get transfer suggestions (mock for now - AI service not implemented)
    getSuggestions(): TransferSuggestion[] {
        // TODO: Implement AI service endpoint when available
        // For now, return empty array or generate from stock data
        return [];
    }

    // Get transfers with pagination, sorting, search, and filters
    getTransfers(
        page: number = 0,
        size: number = 20,
        sort?: string,
        search?: string,
        filters?: {
            storeSent?: number;
            storeReceive?: number;
            productId?: number;
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
            if (filters.storeSent) {
                params = params.set('storeSent', filters.storeSent.toString());
            }
            if (filters.storeReceive) {
                params = params.set('storeReceive', filters.storeReceive.toString());
            }
            if (filters.productId) {
                params = params.set('productId', filters.productId.toString());
            }
            if (filters.startDate) {
                params = params.set('startDate', filters.startDate);
            }
            if (filters.endDate) {
                params = params.set('endDate', filters.endDate);
            }
        }

        return this.http.get<ApiResponse<any>>(`${this.apiUrl}${API_CONFIG.endpoints.transfers}`, { params })
            .pipe(
                map(response => {
                    if (response.success && response.data) {
                        if (response.data.content) {
                            return {
                                ...response.data,
                                content: response.data.content.map((t: any) => this.transformTransfer(t))
                            };
                        }
                        if (Array.isArray(response.data)) {
                            return response.data.map((t: any) => this.transformTransfer(t));
                        }
                    }
                    return response.data || [];
                }),
                catchError(error => {
                    console.error('Error fetching transfers:', error);
                    return throwError(() => error);
                })
            );
    }

    // Transform backend transfer to frontend format
    private transformTransfer(backendTransfer: any): Transfer {
        return {
            id: backendTransfer.id?.toString() || '',
            createdAt: backendTransfer.date || new Date().toISOString(),
            status: 'approved' as TransferStatus, // Default status
            items: [{
                sku: backendTransfer.idProduct?.toString() || '',
                productName: `Product ${backendTransfer.idProduct}`,
                quantity: backendTransfer.quantity || 0
            }],
            sourceStoreId: backendTransfer.idStoreSent?.toString() || '',
            sourceStoreName: `Store ${backendTransfer.idStoreSent}`,
            destinationStoreId: backendTransfer.idStoreReceive?.toString() || '',
            destinationStoreName: `Store ${backendTransfer.idStoreReceive}`,
            etaDays: 2, // Default ETA
            notes: backendTransfer.reason
        };
    }

    // Approve transfer suggestion (create new transfer)
    approveSuggestion(suggestionId: string, quantity?: number): Observable<Transfer> {
        // TODO: Implement when backend endpoint is available
        // For now, return mock transfer
        const mockTransfer: Transfer = {
            id: `transfer-${Date.now()}`,
            createdAt: new Date().toISOString(),
            status: 'approved',
            items: [{
                sku: '',
                productName: '',
                quantity: quantity || 0
            }],
            sourceStoreId: '',
            sourceStoreName: '',
            destinationStoreId: '',
            destinationStoreName: '',
            etaDays: 2
        };
        
        return new Observable(observer => {
            observer.next(mockTransfer);
            observer.complete();
        });
    }

    // Update transfer status
    updateTransferStatus(transferId: string, status: TransferStatus): Observable<void> {
        // TODO: Implement when backend endpoint is available
        return new Observable(observer => {
            observer.next();
            observer.complete();
        });
    }
}
