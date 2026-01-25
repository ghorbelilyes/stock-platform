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

    // Get all transfers with optional filters
    getTransfers(storeSent?: number, storeReceive?: number, productId?: number, startDate?: string, endDate?: string): Observable<Transfer[]> {
        let params = new HttpParams();
        
        if (storeSent) {
            params = params.set('storeSent', storeSent.toString());
        }
        if (storeReceive) {
            params = params.set('storeReceive', storeReceive.toString());
        }
        if (productId) {
            params = params.set('productId', productId.toString());
        }
        if (startDate) {
            params = params.set('startDate', startDate);
        }
        if (endDate) {
            params = params.set('endDate', endDate);
        }

        return this.http.get<ApiResponse<any[]>>(`${this.apiUrl}${API_CONFIG.endpoints.transfers}`, { params })
            .pipe(
                map(response => {
                    if (response.success && response.data) {
                        // Transform backend transfer format to frontend format
                        return response.data.map((t: any) => this.transformTransfer(t));
                    }
                    return [];
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
