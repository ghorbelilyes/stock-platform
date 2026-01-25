package com.inventory.orchestrator.controller;

import com.inventory.orchestrator.dto.ApiResponse;
import com.inventory.orchestrator.entity.Product;
import com.inventory.orchestrator.repository.ProductRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/products")
@CrossOrigin(origins = "*")
public class ProductController {
    
    private final ProductRepository productRepository;
    
    @Autowired
    public ProductController(ProductRepository productRepository) {
        this.productRepository = productRepository;
    }
    
    /**
     * Get products with pagination, sorting, filtering, and search
     * 
     * Query parameters:
     * - page: Page number (0-indexed, default: 0)
     * - size: Page size (default: 20)
     * - sort: Sort field and direction (e.g., "name,asc" or "id,desc", default: "id,asc")
     * - search: Global search term (searches name, codeBarre, description)
     * - name: Filter by name (exact match, case-insensitive)
     * - codeBarre: Filter by barcode (exact match, case-insensitive)
     * - description: Filter by description (contains, case-insensitive)
     * 
     * Example: GET /products?page=0&size=20&sort=name,asc&search=laptop
     */
    @GetMapping
    public ResponseEntity<ApiResponse<Page<Product>>> getAllProducts(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) String sort,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String name,
            @RequestParam(required = false) String codeBarre,
            @RequestParam(required = false) String description
    ) {
        // Validate page and size
        if (page < 0) page = 0;
        if (size < 1) size = 20;
        if (size > 100) size = 100; // Max page size
        
        // Parse sort parameter (format: "field,direction" or just "field")
        Sort sortObj = parseSortParameter(sort);
        Pageable pageable = PageRequest.of(page, size, sortObj);
        
        Page<Product> products;
        
        // Priority: search > individual filters > all products
        if (search != null && !search.trim().isEmpty()) {
            // Global search across multiple fields
            products = productRepository.searchProducts(search.trim(), pageable);
        } else if (name != null && !name.trim().isEmpty()) {
            // Filter by name
            products = productRepository.findByNameContainingIgnoreCase(name.trim(), pageable);
        } else if (codeBarre != null && !codeBarre.trim().isEmpty()) {
            // Filter by codeBarre
            products = productRepository.findByCodeBarreContainingIgnoreCase(codeBarre.trim(), pageable);
        } else if (description != null && !description.trim().isEmpty()) {
            // Filter by description
            products = productRepository.findByDescriptionContainingIgnoreCase(description.trim(), pageable);
        } else {
            // Get all products with pagination and sorting
            products = productRepository.findAll(pageable);
        }
        
        return ResponseEntity.ok(ApiResponse.success(products, "Products retrieved successfully"));
    }
    
    /**
     * Parse sort parameter into Sort object
     * Format: "field,direction" or just "field" (defaults to ASC)
     * Examples: "name,asc", "id,desc", "name"
     */
    private Sort parseSortParameter(String sort) {
        if (sort == null || sort.trim().isEmpty()) {
            return Sort.by(Sort.Direction.ASC, "id");
        }
        
        String[] parts = sort.split(",");
        String field = parts[0].trim();
        
        // Validate field name to prevent SQL injection
        if (!isValidSortField(field)) {
            field = "id";
        }
        
        if (parts.length > 1) {
            String direction = parts[1].trim().toLowerCase();
            if ("desc".equals(direction)) {
                return Sort.by(Sort.Direction.DESC, field);
            }
        }
        
        return Sort.by(Sort.Direction.ASC, field);
    }
    
    /**
     * Validate sort field to prevent SQL injection
     * Only allow alphanumeric characters and underscores
     */
    private boolean isValidSortField(String field) {
        if (field == null || field.isEmpty()) {
            return false;
        }
        // Only allow alphanumeric and underscore
        return field.matches("^[a-zA-Z0-9_]+$");
    }
    
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<Product>> getProductById(@PathVariable Long id) {
        return productRepository.findById(id)
            .map(product -> ResponseEntity.ok(ApiResponse.success(product, "Product retrieved successfully")))
            .orElse(ResponseEntity.notFound().build());
    }
}
