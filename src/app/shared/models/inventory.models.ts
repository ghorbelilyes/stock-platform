// MOCK DATA MODELS - TODO: Replace with backend API models

export interface Store {
    id: string;
    name: string;
    city: string;
    type: 'store' | 'warehouse';
    leadTimeDays: number;
}

export interface Stock {
    storeId: string;
    sku: string;
    onHand: number;
    reserved: number;
    reorderPoint: number;
    safetyStock: number;
}

export interface Sale {
    storeId: string;
    sku: string;
    date: string; // ISO date string
    qtySold: number;
    price: number;
}

export interface TransferSuggestion {
    id: string;
    fromStoreId: string;
    fromStoreName: string;
    toStoreId: string;
    toStoreName: string;
    sku: string;
    productName: string;
    quantity: number;
    priority: 'high' | 'medium' | 'low';
    reason: string;
    confidence: number; // 0-100
    createdAt: string;
}

export interface TransferItem {
    sku: string;
    productName: string;
    quantity: number;
    unitCost?: number;
}

export type TransferStatus = 
    | 'proposed' 
    | 'approved' 
    | 'picked' 
    | 'in_transit' 
    | 'received' 
    | 'closed';

export interface Transfer {
    id: string;
    createdAt: string;
    status: TransferStatus;
    items: TransferItem[];
    sourceStoreId: string;
    sourceStoreName: string;
    destinationStoreId: string;
    destinationStoreName: string;
    etaDays: number;
    estimatedCost?: number;
    notes?: string;
}

export interface KPIData {
    storesMonitored: number;
    totalProducts: number;
    transfersInProgress: number;
    stockoutRiskAlerts: number;
}
