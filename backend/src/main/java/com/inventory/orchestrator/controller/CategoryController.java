package com.inventory.orchestrator.controller;

import com.inventory.orchestrator.dto.ApiResponse;
import com.inventory.orchestrator.entity.Category;
import com.inventory.orchestrator.repository.CategoryRepository;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/categories")
@CrossOrigin(origins = "*")
@Tag(name = "Categories", description = "Category management APIs")
public class CategoryController {
    
    private final CategoryRepository categoryRepository;
    
    @Autowired
    public CategoryController(CategoryRepository categoryRepository) {
        this.categoryRepository = categoryRepository;
    }
    
    /**
     * Get categories with pagination, sorting, filtering, and search
     */
    @GetMapping
    @Operation(
        summary = "Get all categories",
        description = "Retrieve categories with pagination, sorting, filtering, and search support"
    )
    public ResponseEntity<ApiResponse<Page<Category>>> getAllCategories(
            @Parameter(description = "Page number (0-indexed)", example = "0") @RequestParam(defaultValue = "0") int page,
            @Parameter(description = "Page size", example = "20") @RequestParam(defaultValue = "20") int size,
            @Parameter(description = "Sort field and direction (e.g., 'name,asc')") @RequestParam(required = false) String sort,
            @Parameter(description = "Global search term") @RequestParam(required = false) String search,
            @Parameter(description = "Filter by name") @RequestParam(required = false) String name,
            @Parameter(description = "Filter by description") @RequestParam(required = false) String description
    ) {
        // Validate page and size
        if (page < 0) page = 0;
        if (size < 1) size = 20;
        if (size > 100) size = 100;
        
        // Parse sort parameter
        Sort sortObj = parseSortParameter(sort);
        Pageable pageable = PageRequest.of(page, size, sortObj);
        
        Page<Category> categories;
        
        // Priority: search > individual filters > all categories
        if (search != null && !search.trim().isEmpty()) {
            categories = categoryRepository.searchCategories(search.trim(), pageable);
        } else if (name != null && !name.trim().isEmpty()) {
            categories = categoryRepository.findByNameContainingIgnoreCase(name.trim(), pageable);
        } else if (description != null && !description.trim().isEmpty()) {
            categories = categoryRepository.findByDescriptionContainingIgnoreCase(description.trim(), pageable);
        } else {
            categories = categoryRepository.findAll(pageable);
        }
        
        return ResponseEntity.ok(ApiResponse.success(categories, "Categories retrieved successfully"));
    }
    
    @GetMapping("/{id}")
    @Operation(
        summary = "Get category by ID",
        description = "Retrieve a specific category by its ID"
    )
    public ResponseEntity<ApiResponse<Category>> getCategoryById(
            @Parameter(description = "Category ID", required = true) @PathVariable Long id
    ) {
        return categoryRepository.findById(id)
            .map(category -> ResponseEntity.ok(ApiResponse.success(category, "Category retrieved successfully")))
            .orElse(ResponseEntity.ok(ApiResponse.<Category>error("NOT_FOUND", "Category not found", java.util.Collections.emptyList())));
    }
    
    @PostMapping
    @Operation(
        summary = "Create a new category",
        description = "Create a new category with name and optional description"
    )
    public ResponseEntity<ApiResponse<Category>> createCategory(@RequestBody Category category) {
        // Validate required fields
        if (category.getName() == null || category.getName().trim().isEmpty()) {
            return ResponseEntity.badRequest()
                .body(ApiResponse.<Category>error("VALIDATION_ERROR", "Category name is required", java.util.Collections.emptyList()));
        }
        
        // Check if category with same name already exists
        if (categoryRepository.findByName(category.getName().trim()).isPresent()) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                .body(ApiResponse.<Category>error("DUPLICATE", "Category with this name already exists", java.util.Collections.emptyList()));
        }
        
        Category newCategory = new Category();
        newCategory.setName(category.getName().trim());
        newCategory.setDescription(category.getDescription() != null ? category.getDescription().trim() : null);
        
        Category savedCategory = categoryRepository.save(newCategory);
        return ResponseEntity.status(HttpStatus.CREATED)
            .body(ApiResponse.success(savedCategory, "Category created successfully"));
    }
    
    @PutMapping("/{id}")
    @Operation(
        summary = "Update a category",
        description = "Update an existing category by its ID"
    )
    public ResponseEntity<ApiResponse<Category>> updateCategory(
            @Parameter(description = "Category ID", required = true) @PathVariable Long id,
            @RequestBody Category category
    ) {
        return categoryRepository.findById(id)
            .map(existingCategory -> {
                // Validate required fields
                if (category.getName() == null || category.getName().trim().isEmpty()) {
                    return ResponseEntity.badRequest()
                        .body(ApiResponse.<Category>error("VALIDATION_ERROR", "Category name is required", java.util.Collections.emptyList()));
                }
                
                // Check if another category with same name exists (excluding current one)
                java.util.Optional<Category> categoryWithSameName = categoryRepository.findByName(category.getName().trim());
                if (categoryWithSameName.isPresent() && !categoryWithSameName.get().getId().equals(id)) {
                    return ResponseEntity.status(HttpStatus.CONFLICT)
                        .body(ApiResponse.<Category>error("DUPLICATE", "Category with this name already exists", java.util.Collections.emptyList()));
                }
                
                existingCategory.setName(category.getName().trim());
                existingCategory.setDescription(category.getDescription() != null ? category.getDescription().trim() : null);
                
                Category updatedCategory = categoryRepository.save(existingCategory);
                return ResponseEntity.ok(ApiResponse.success(updatedCategory, "Category updated successfully"));
            })
            .orElse(ResponseEntity.ok(ApiResponse.<Category>error("NOT_FOUND", "Category not found", java.util.Collections.emptyList())));
    }
    
    @DeleteMapping("/{id}")
    @Operation(
        summary = "Delete a category",
        description = "Delete a category by its ID. Note: This will fail if category has associated products."
    )
    public ResponseEntity<ApiResponse<Void>> deleteCategory(
            @Parameter(description = "Category ID", required = true) @PathVariable Long id
    ) {
        java.util.Optional<Category> categoryOpt = categoryRepository.findById(id);
        if (categoryOpt.isEmpty()) {
            return ResponseEntity.ok(ApiResponse.<Void>error("NOT_FOUND", "Category not found", java.util.Collections.emptyList()));
        }
        
        Category category = categoryOpt.get();
        // Check if category has products
        if (category.getProducts() != null && !category.getProducts().isEmpty()) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                .body(ApiResponse.<Void>error("CONFLICT", "Cannot delete category with associated products", java.util.Collections.emptyList()));
        }
        
        categoryRepository.delete(category);
        return ResponseEntity.ok(ApiResponse.success(null, "Category deleted successfully"));
    }
    
    @GetMapping("/{id}/products")
    @Operation(
        summary = "Get products by category",
        description = "Retrieve all products belonging to a specific category"
    )
    public ResponseEntity<ApiResponse<Category>> getCategoryWithProducts(
            @Parameter(description = "Category ID", required = true) @PathVariable Long id
    ) {
        return categoryRepository.findById(id)
            .map(category -> ResponseEntity.ok(ApiResponse.success(category, "Category with products retrieved successfully")))
            .orElse(ResponseEntity.ok(ApiResponse.<Category>error("NOT_FOUND", "Category not found", java.util.Collections.emptyList())));
    }
    
    private Sort parseSortParameter(String sort) {
        if (sort == null || sort.trim().isEmpty()) {
            return Sort.by(Sort.Direction.ASC, "id");
        }
        
        String[] parts = sort.split(",");
        String field = parts[0].trim();
        
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
    
    private boolean isValidSortField(String field) {
        if (field == null || field.isEmpty()) {
            return false;
        }
        return field.matches("^[a-zA-Z0-9_]+$");
    }
}
