// Detect if running locally (development) or in Docker (production)
const isLocalDev = window.location.origin.includes('localhost:4200') || 
                   window.location.origin.includes('127.0.0.1:4200');

export const API_CONFIG = {
    // Use absolute URL for local dev, relative path for Docker (nginx proxy)
    baseUrl: isLocalDev ? 'http://localhost:8080/api' : window.location.origin + '/api',
    endpoints: {
        // File operations
        parseHeaders: '/files/parse-headers',
        requiredColumns: '/files/required-columns',
        validateFile: '/files/validate',
        uploadFile: '/files/upload',
        validateStockConsistency: '/files/validate-consistency',
        checkDatabaseConsistency: '/files/check-database-consistency',
        
        // Data retrieval
        stores: '/stores',
        products: '/products',
        stocks: '/stocks',
        sales: '/sales',
        transfers: '/transfers',
        transferSuggestions: '/transfers/suggestions',
        transferSuggestionsApprove: '/transfers/suggestions/approve',
        categories: '/categories'
    }
};
