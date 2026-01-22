export const API_CONFIG = {
    baseUrl: 'http://localhost:8080/api',
    endpoints: {
        // File operations
        parseHeaders: '/files/parse-headers',
        requiredColumns: '/files/required-columns',
        validateFile: '/files/validate',
        uploadFile: '/files/upload',
        
        // Data retrieval
        products: '/products',
        stocks: '/stocks',
        sales: '/sales',
        transfers: '/transfers'
    }
};
