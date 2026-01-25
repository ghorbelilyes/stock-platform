export const API_CONFIG = {
    // Use relative path for Docker (nginx proxy) or absolute for local dev
    baseUrl: window.location.origin + '/api',
    endpoints: {
        // File operations
        parseHeaders: '/files/parse-headers',
        requiredColumns: '/files/required-columns',
        validateFile: '/files/validate',
        uploadFile: '/files/upload',
        
        // Data retrieval
        stores: '/stores',
        products: '/products',
        stocks: '/stocks',
        sales: '/sales',
        transfers: '/transfers'
    }
};
