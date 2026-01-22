package com.inventory.orchestrator.controller;

import com.inventory.orchestrator.dto.ApiResponse;
import com.inventory.orchestrator.entity.Product;
import com.inventory.orchestrator.repository.ProductRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/products")
@CrossOrigin(origins = "*")
public class ProductController {
    
    private final ProductRepository productRepository;
    
    @Autowired
    public ProductController(ProductRepository productRepository) {
        this.productRepository = productRepository;
    }
    
    @GetMapping
    public ResponseEntity<ApiResponse<List<Product>>> getAllProducts() {
        List<Product> products = productRepository.findAll();
        return ResponseEntity.ok(ApiResponse.success(products, "Products retrieved successfully"));
    }
    
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<Product>> getProductById(@PathVariable Long id) {
        return productRepository.findById(id)
            .map(product -> ResponseEntity.ok(ApiResponse.success(product, "Product retrieved successfully")))
            .orElse(ResponseEntity.notFound().build());
    }
}
