import { Injectable } from '@angular/core';
import { TransferSuggestion, Transfer, TransferStatus } from '../models/inventory.models';
import { InventoryDataService } from './inventory-data.service';
import { Stock } from '../models/inventory.models';

// TODO: Replace with backend API calls
// MOCK DATA UNTIL BACKEND READY
@Injectable({
    providedIn: 'root'
})
export class TransferService {
    private suggestions: TransferSuggestion[] = [];
    private transfers: Transfer[] = [];

    constructor(private inventoryService: InventoryDataService) {
        this.generateMockSuggestions();
    }

    // MOCK DATA UNTIL BACKEND READY
    private generateMockSuggestions(): void {
        const stores = this.inventoryService.getStores();
        const stocks = this.inventoryService.getStocks();
        const storeStocks = new Map<string, Stock[]>();

        stocks.forEach(stock => {
            if (!storeStocks.has(stock.storeId)) {
                storeStocks.set(stock.storeId, []);
            }
            storeStocks.get(stock.storeId)!.push(stock);
        });

        // Generate suggestions based on stock levels
        stores.forEach(fromStore => {
            if (fromStore.type === 'warehouse') return;

            const fromStocks = storeStocks.get(fromStore.id) || [];
            fromStocks.forEach(stock => {
                const available = stock.onHand - stock.reserved;
                if (available > stock.safetyStock + stock.reorderPoint + 50) {
                    // Surplus detected - find stores that need it
                    stores.forEach(toStore => {
                        if (toStore.id === fromStore.id || toStore.type === 'warehouse') return;
                        const toStock = storeStocks.get(toStore.id)?.find(s => s.sku === stock.sku);
                        if (toStock && (toStock.onHand - toStock.reserved) < toStock.reorderPoint) {
                            const surplus = available - (stock.safetyStock + stock.reorderPoint);
                            const need = toStock.reorderPoint - (toStock.onHand - toStock.reserved);
                            const qty = Math.min(surplus, need, 100);

                            if (qty > 10) {
                                const confidence = Math.floor(Math.random() * 20) + 75; // 75-95%
                                this.suggestions.push({
                                    id: `suggestion-${this.suggestions.length + 1}`,
                                    fromStoreId: fromStore.id,
                                    fromStoreName: fromStore.name,
                                    toStoreId: toStore.id,
                                    toStoreName: toStore.name,
                                    sku: stock.sku,
                                    productName: `Product ${stock.sku}`,
                                    quantity: qty,
                                    priority: confidence > 85 ? 'high' : confidence > 75 ? 'medium' : 'low',
                                    reason: `Low stock at ${toStore.name} (${toStock.onHand - toStock.reserved} units)`,
                                    confidence,
                                    createdAt: new Date().toISOString()
                                });
                            }
                        }
                    });
                }
            });
        });
    }

    // TODO: Replace with HttpClient GET call
    getSuggestions(): TransferSuggestion[] {
        return [...this.suggestions];
    }

    // TODO: Replace with HttpClient POST call
    approveSuggestion(suggestionId: string, quantity?: number): Transfer {
        const suggestion = this.suggestions.find(s => s.id === suggestionId);
        if (!suggestion) {
            throw new Error('Suggestion not found');
        }

        const transfer: Transfer = {
            id: `transfer-${this.transfers.length + 1}`,
            createdAt: new Date().toISOString(),
            status: 'approved',
            items: [{
                sku: suggestion.sku,
                productName: suggestion.productName,
                quantity: quantity || suggestion.quantity
            }],
            sourceStoreId: suggestion.fromStoreId,
            sourceStoreName: suggestion.fromStoreName,
            destinationStoreId: suggestion.toStoreId,
            destinationStoreName: suggestion.toStoreName,
            etaDays: 2,
            estimatedCost: (quantity || suggestion.quantity) * 5 // Mock cost
        };

        this.transfers.push(transfer);
        return transfer;
    }

    // TODO: Replace with HttpClient GET call
    getTransfers(): Transfer[] {
        return [...this.transfers];
    }

    // TODO: Replace with HttpClient PUT call
    updateTransferStatus(transferId: string, status: TransferStatus): void {
        const transfer = this.transfers.find(t => t.id === transferId);
        if (transfer) {
            transfer.status = status;
        }
    }
}
