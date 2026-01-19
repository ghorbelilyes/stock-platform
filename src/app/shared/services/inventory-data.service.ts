import { Injectable } from '@angular/core';
import { Store, Stock, Sale } from '../models/inventory.models';

// TODO: Replace with backend API call
// MOCK DATA UNTIL BACKEND READY
@Injectable({
    providedIn: 'root'
})
export class InventoryDataService {
    private stores: Store[] = [];
    private stocks: Stock[] = [];
    private sales: Sale[] = [];
    private uploadedFiles: {
        stores?: { name: string; uploadedAt: string; valid: boolean; errors?: string[] };
        stocks?: { name: string; uploadedAt: string; valid: boolean; errors?: string[] };
        sales?: { name: string; uploadedAt: string; valid: boolean; errors?: string[] };
    } = {};

    constructor() {
        this.initializeMockData();
    }

    // MOCK DATA UNTIL BACKEND READY
    private initializeMockData(): void {
        // Seed 6 stores (4 stores + 2 warehouses)
        this.stores = [
            { id: 'store-1', name: 'Downtown Store', city: 'New York', type: 'store', leadTimeDays: 2 },
            { id: 'store-2', name: 'Northside Store', city: 'Chicago', type: 'store', leadTimeDays: 3 },
            { id: 'store-3', name: 'Westside Store', city: 'Los Angeles', type: 'store', leadTimeDays: 2 },
            { id: 'store-4', name: 'Uptown Store', city: 'Miami', type: 'store', leadTimeDays: 4 },
            { id: 'warehouse-1', name: 'East Warehouse', city: 'Newark', type: 'warehouse', leadTimeDays: 1 },
            { id: 'warehouse-2', name: 'Central Warehouse', city: 'Dallas', type: 'warehouse', leadTimeDays: 1 }
        ];

        // Seed 50 SKUs with realistic stock data
        const skus = [
            'SKU-001', 'SKU-002', 'SKU-003', 'SKU-004', 'SKU-005',
            'SKU-006', 'SKU-007', 'SKU-008', 'SKU-009', 'SKU-010',
            'SKU-011', 'SKU-012', 'SKU-013', 'SKU-014', 'SKU-015',
            'SKU-016', 'SKU-017', 'SKU-018', 'SKU-019', 'SKU-020',
            'SKU-021', 'SKU-022', 'SKU-023', 'SKU-024', 'SKU-025',
            'SKU-026', 'SKU-027', 'SKU-028', 'SKU-029', 'SKU-030',
            'SKU-031', 'SKU-032', 'SKU-033', 'SKU-034', 'SKU-035',
            'SKU-036', 'SKU-037', 'SKU-038', 'SKU-039', 'SKU-040',
            'SKU-041', 'SKU-042', 'SKU-043', 'SKU-044', 'SKU-045',
            'SKU-046', 'SKU-047', 'SKU-048', 'SKU-049', 'SKU-050'
        ];

        this.stocks = [];
        this.stores.forEach(store => {
            skus.forEach(sku => {
                const onHand = Math.floor(Math.random() * 200) + 10;
                const reorderPoint = Math.floor(onHand * 0.3);
                const safetyStock = Math.floor(onHand * 0.2);
                this.stocks.push({
                    storeId: store.id,
                    sku,
                    onHand,
                    reserved: Math.floor(Math.random() * 20),
                    reorderPoint,
                    safetyStock
                });
            });
        });

        // Seed sales data for last 6 months
        const today = new Date();
        for (let month = 0; month < 6; month++) {
            const date = new Date(today.getFullYear(), today.getMonth() - month, 1);
            this.stores.forEach(store => {
                if (store.type === 'store') {
                    skus.slice(0, 30).forEach(sku => {
                        for (let day = 0; day < 30; day++) {
                            if (Math.random() > 0.7) { // 30% chance of sale per day
                                this.sales.push({
                                    storeId: store.id,
                                    sku,
                                    date: new Date(date.getFullYear(), date.getMonth(), day).toISOString(),
                                    qtySold: Math.floor(Math.random() * 5) + 1,
                                    price: Math.floor(Math.random() * 100) + 10
                                });
                            }
                        }
                    });
                }
            });
        }
    }

    // TODO: Replace with HttpClient GET call
    getStores(): Store[] {
        return [...this.stores];
    }

    // TODO: Replace with HttpClient GET call
    getStocks(): Stock[] {
        return [...this.stocks];
    }

    // TODO: Replace with HttpClient GET call
    getSales(): Sale[] {
        return [...this.sales];
    }

    // TODO: Replace with HttpClient POST call
    setUploadedFilesState(files: {
        stores?: { name: string; uploadedAt: string; valid: boolean; errors?: string[] };
        stocks?: { name: string; uploadedAt: string; valid: boolean; errors?: string[] };
        sales?: { name: string; uploadedAt: string; valid: boolean; errors?: string[] };
    }): void {
        this.uploadedFiles = files;
    }

    getUploadedFilesState() {
        return { ...this.uploadedFiles };
    }

    // TODO: Replace with backend validation
    validateFilesMock(fileType: 'stores' | 'stocks' | 'sales', file: File): Promise<{ valid: boolean; errors?: string[] }> {
        return new Promise((resolve) => {
            setTimeout(() => {
                const errors: string[] = [];
                
                // Check file extension
                const fileName = file.name.toLowerCase();
                if (!fileName.endsWith('.csv')) {
                    errors.push(`Invalid file type, allowed file types: .CSV`);
                    resolve({ valid: false, errors });
                    return;
                }
                
                // Mock validation - 90% success rate for valid CSV files
                if (Math.random() > 0.1) {
                    resolve({ valid: true });
                } else {
                    errors.push('Missing required column: store_id', 'Invalid date format in row 15');
                    resolve({
                        valid: false,
                        errors
                    });
                }
            }, 1000);
        });
    }
}
