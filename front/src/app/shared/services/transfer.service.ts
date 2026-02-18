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

    // Get transfer suggestions from backend (computed from stock levels)
    getSuggestions(): Observable<TransferSuggestion[]> {
        return this.http.get<ApiResponse<TransferSuggestion[]>>(`${this.apiUrl}${API_CONFIG.endpoints.transferSuggestions}`).pipe(
            map(response => {
                if (response.success && Array.isArray(response.data)) {
                    return response.data.map((s: any) => this.mapSuggestion(s));
                }
                return [];
            }),
            catchError(error => {
                console.error('Error fetching transfer suggestions:', error);
                return throwError(() => error);
            })
        );
    }

    private mapSuggestion(s: any): TransferSuggestion {
        return {
            id: s.id || '',
            fromStoreId: String(s.fromStoreId ?? ''),
            fromStoreName: s.fromStoreName || '',
            toStoreId: String(s.toStoreId ?? ''),
            toStoreName: s.toStoreName || '',
            sku: s.sku || '',
            productName: s.productName || '',
            quantity: s.quantity ?? 0,
            priority: (s.priority === 'high' || s.priority === 'medium' || s.priority === 'low') ? s.priority : 'low',
            reason: s.reason || '',
            confidence: s.confidence ?? 0,
            createdAt: s.createdAt || new Date().toISOString()
        };
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
            status?: string;
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
            if (filters.status) {
                params = params.set('status', filters.status);
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

    // Transform backend transfer to frontend format (backend may send TransferView with store/product names)
    private transformTransfer(backendTransfer: any): Transfer {
        const status = backendTransfer.status as TransferStatus;
        const validStatus: TransferStatus[] = ['proposed', 'approved', 'picked', 'in_transit', 'received', 'closed', 'rejected'];
        return {
            id: backendTransfer.id?.toString() || '',
            createdAt: backendTransfer.date || new Date().toISOString(),
            status: status && validStatus.includes(status) ? status : 'approved',
            items: [{
                sku: backendTransfer.idProduct?.toString() || '',
                productName: backendTransfer.productName ?? `Product ${backendTransfer.idProduct ?? ''}`,
                quantity: backendTransfer.quantity || 0
            }],
            sourceStoreId: backendTransfer.idStoreSent?.toString() || '',
            sourceStoreName: backendTransfer.sourceStoreName ?? `Store ${backendTransfer.idStoreSent ?? ''}`,
            destinationStoreId: backendTransfer.idStoreReceive?.toString() || '',
            destinationStoreName: backendTransfer.destinationStoreName ?? `Store ${backendTransfer.idStoreReceive ?? ''}`,
            etaDays: 2, // Default ETA
            notes: backendTransfer.reason
        };
    }

    // Approve transfer suggestion (create new transfer via backend)
    approveSuggestion(suggestionId: string, quantity?: number): Observable<Transfer> {
        const body: any = { suggestionId };
        if (quantity != null && quantity > 0) {
            body.quantity = quantity;
        }
        return this.http.post<ApiResponse<any>>(`${this.apiUrl}${API_CONFIG.endpoints.transferSuggestionsApprove}`, body).pipe(
            map(response => {
                if (response.success && response.data) {
                    return this.transformTransfer(response.data);
                }
                throw new Error(response.message || 'Failed to create transfer');
            }),
            catchError(error => {
                console.error('Error approving suggestion:', error);
                return throwError(() => error);
            })
        );
    }

    // Reject/dismiss transfer suggestion (with optional note)
    rejectSuggestion(suggestionId: string, note?: string): Observable<Transfer> {
        const body: { suggestionId: string; note?: string } = { suggestionId };
        if (note != null && note.trim()) {
            body.note = note.trim();
        }
        return this.http.post<ApiResponse<any>>(`${this.apiUrl}${API_CONFIG.endpoints.transferSuggestionsReject}`, body).pipe(
            map(response => {
                if (response.success && response.data) {
                    return this.transformTransfer(response.data);
                }
                throw new Error(response.message || 'Failed to reject suggestion');
            }),
            catchError(error => {
                console.error('Error rejecting suggestion:', error);
                return throwError(() => error);
            })
        );
    }

    // Create a manual transfer suggestion
    createSuggestion(request: any): Observable<TransferSuggestion> {
        return this.http.post<ApiResponse<TransferSuggestion>>(`${this.apiUrl}${API_CONFIG.endpoints.transferSuggestions}`, request).pipe(
            map(response => {
                if (response.success && response.data) {
                    return this.mapSuggestion(response.data);
                }
                throw new Error(response.message || 'Failed to create suggestion');
            }),
            catchError(error => {
                console.error('Error creating suggestion:', error);
                return throwError(() => error);
            })
        );
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
