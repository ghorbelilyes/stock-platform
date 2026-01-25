package com.inventory.orchestrator.controller;

import com.inventory.orchestrator.dto.ApiResponse;
import com.inventory.orchestrator.entity.Transfer;
import com.inventory.orchestrator.repository.TransferRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/transfers")
@CrossOrigin(origins = "*")
public class TransferController {
    
    private final TransferRepository transferRepository;
    
    @Autowired
    public TransferController(TransferRepository transferRepository) {
        this.transferRepository = transferRepository;
    }
    
    @GetMapping
    public ResponseEntity<ApiResponse<List<Transfer>>> getAllTransfers(
        @RequestParam(required = false) Long storeSent,
        @RequestParam(required = false) Long storeReceive,
        @RequestParam(required = false) Long productId,
        @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
        @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate
    ) {
        List<Transfer> transfers;
        
        if (storeSent != null && storeReceive != null) {
            transfers = transferRepository.findByStoreInvolved(storeSent, storeReceive);
        } else if (storeSent != null) {
            transfers = transferRepository.findByIdStoreSent(storeSent);
        } else if (storeReceive != null) {
            transfers = transferRepository.findByIdStoreReceive(storeReceive);
        } else if (productId != null) {
            transfers = transferRepository.findByIdProduct(productId);
        } else if (startDate != null && endDate != null) {
            transfers = transferRepository.findByDateBetween(startDate, endDate);
        } else {
            transfers = transferRepository.findAll();
        }
        
        return ResponseEntity.ok(ApiResponse.success(transfers, "Transfers retrieved successfully"));
    }
}
