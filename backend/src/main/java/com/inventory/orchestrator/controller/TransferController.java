package com.inventory.orchestrator.controller;

import com.inventory.orchestrator.dto.ApiResponse;
import com.inventory.orchestrator.dto.ApproveSuggestionRequest;
import com.inventory.orchestrator.dto.TransferSuggestionDTO;
import com.inventory.orchestrator.dto.TransferView;
import com.inventory.orchestrator.entity.Transfer;
import com.inventory.orchestrator.repository.TransferRepository;
import com.inventory.orchestrator.service.TransferSuggestionService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/transfers")
@CrossOrigin(origins = "*")
public class TransferController {
    
    private final TransferRepository transferRepository;
    private final TransferSuggestionService suggestionService;
    
    @Autowired
    public TransferController(TransferRepository transferRepository, TransferSuggestionService suggestionService) {
        this.transferRepository = transferRepository;
        this.suggestionService = suggestionService;
    }
    
    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
    public ResponseEntity<ApiResponse<Page<TransferView>>> getAllTransfers(
        @RequestParam(required = false) Long storeSent,
        @RequestParam(required = false) Long storeReceive,
        @RequestParam(required = false) Long productId,
        @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
        @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
        @RequestParam(required = false) String sort,
        @RequestParam(required = false) String search,
        @RequestParam(defaultValue = "0") int page,
        @RequestParam(defaultValue = "20") int size
    ) {
        if (page < 0) page = 0;
        if (size < 1) size = 20;
        if (size > 100) size = 100;
        
        Sort sortObj = parseSortParameter(sort);
        Pageable pageable = PageRequest.of(page, size, sortObj);
        
        // Convert LocalDate to LocalDateTime for query (start of day to end of day)
        // Use sentinel values when null to ensure parameters are always typed
        LocalDateTime startDateTime = (startDate != null) ? startDate.atStartOfDay() : LocalDateTime.of(1900, 1, 1, 0, 0);
        LocalDateTime endDateTime = (endDate != null) ? endDate.atTime(23, 59, 59) : LocalDateTime.of(9999, 12, 31, 23, 59, 59);
        
        Page<TransferView> transfers = transferRepository.findTransfersWithFiltersView(
            storeSent,
            storeReceive,
            productId,
            startDateTime,
            endDateTime,
            normalize(search),
            pageable
        );
        
        return ResponseEntity.ok(ApiResponse.success(transfers, "Transfers retrieved successfully"));
    }

    @GetMapping("/suggestions")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<List<TransferSuggestionDTO>>> getSuggestions() {
        List<TransferSuggestionDTO> suggestions = suggestionService.getSuggestions();
        return ResponseEntity.ok(ApiResponse.success(suggestions, "Transfer suggestions retrieved successfully"));
    }

    @PostMapping("/suggestions/approve")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Transfer>> approveSuggestion(@RequestBody ApproveSuggestionRequest request) {
        if (request == null || request.getSuggestionId() == null || request.getSuggestionId().isBlank()) {
            return ResponseEntity.badRequest()
                .body(ApiResponse.error("INVALID_REQUEST", "suggestionId is required", List.of()));
        }
        try {
            Transfer transfer = suggestionService.approveSuggestion(
                request.getSuggestionId().trim(),
                request.getQuantity()
            );
            return ResponseEntity.ok(ApiResponse.success(transfer, "Transfer created successfully"));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest()
                .body(ApiResponse.error("INVALID_SUGGESTION", e.getMessage(), List.of()));
        }
    }

    private Sort parseSortParameter(String sort) {
        if (sort == null || sort.trim().isEmpty()) {
            return Sort.by(Sort.Direction.DESC, "date");
        }
        
        String[] parts = sort.split(",");
        String field = parts[0].trim();
        
        if (!isValidSortField(field)) {
            field = "date";
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
    
    private String normalize(String value) {
        if (value == null) return null;
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed.toLowerCase();
    }
}
