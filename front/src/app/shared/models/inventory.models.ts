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

export type StatusPillType = 'ok' | 'low' | 'out' | 'high' | 'medium' | 'low-priority' | 'overstock' | 'rejected';

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

export interface CreateTransferSuggestionRequest {
    fromStoreId: number;
    toStoreId: number;
    productId: number;
    quantity: number;
    priority: string;
    reason: string;
    confidence: number;
}

export type TransferStatus =
    | 'proposed'
    | 'approved'
    | 'picked'
    | 'in_transit'
    | 'received'
    | 'closed'
    | 'rejected';

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

// Column Mapping Models
export interface ColumnMapping {
    fileColumn: string;      // Column name in uploaded file
    backendColumn: string;  // Column name in backend
    required: boolean;        // Is this column required?
}

export interface FileMappingConfig {
    fileType: 'stock' | 'sales' | 'transfer' | 'store' | 'product';
    mappings: ColumnMapping[];
}

// Backend column definitions
export const BACKEND_COLUMNS = {
    stock: ['id_store', 'id_product', 'quantity'],
    sales: ['id_store', 'id_product', 'quantity'],
    transfer: ['date', 'id_store_sent', 'id_store_receive', 'id_product', 'reason', 'quantity'],
    store: ['serial_number', 'name', 'city', 'type'],
    product: ['code_barre', 'name', 'description']
} as const;
