package com.inventory.orchestrator.controller;

import com.inventory.orchestrator.dto.ApiResponse;
import com.inventory.orchestrator.dto.ai.TransferProposalView;
import com.inventory.orchestrator.entity.Transfer;
import com.inventory.orchestrator.entity.TransferProposalStatus;
import com.inventory.orchestrator.service.TransferProposalService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/transfer-proposals")
@CrossOrigin(origins = "*")
@Tag(name = "Transfer Proposals", description = "AI-generated transfer proposals; accept creates actual Transfer")
public class TransferProposalController {

    private final TransferProposalService transferProposalService;

    public TransferProposalController(TransferProposalService transferProposalService) {
        this.transferProposalService = transferProposalService;
    }

    @GetMapping
    @Operation(summary = "List all transfer proposals")
    public ResponseEntity<ApiResponse<List<TransferProposalView>>> list(
            @RequestParam(required = false) String status
    ) {
        List<TransferProposalView> list;
        if (status != null && !status.isBlank()) {
            try {
                TransferProposalStatus s = TransferProposalStatus.valueOf(status.trim().toUpperCase());
                list = transferProposalService.findByStatus(s).stream()
                        .map(transferProposalService::toView)
                        .collect(Collectors.toList());
            } catch (IllegalArgumentException e) {
                list = transferProposalService.findAllViews();
            }
        } else {
            list = transferProposalService.findAllViews();
        }
        return ResponseEntity.ok(ApiResponse.success(list, "Transfer proposals retrieved"));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get transfer proposal by ID")
    public ResponseEntity<ApiResponse<TransferProposalView>> getById(@PathVariable Long id) {
        return transferProposalService.findViewById(id)
                .map(v -> ResponseEntity.ok(ApiResponse.success(v, "OK")))
                .orElse(ResponseEntity.ok(ApiResponse.error("NOT_FOUND", "Proposal not found", List.of())));
    }

    @PostMapping("/{id}/accept")
    @Operation(summary = "Accept proposal and create Transfer", description = "Human approval. Creates actual Transfer and updates stock. Business rules enforced.")
    public ResponseEntity<ApiResponse<Transfer>> accept(@PathVariable Long id) {
        try {
            Transfer t = transferProposalService.accept(id);
            return ResponseEntity.ok(ApiResponse.success(t, "Proposal accepted; transfer created"));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.ok(ApiResponse.error("BAD_REQUEST", e.getMessage(), List.of()));
        } catch (IllegalStateException e) {
            return ResponseEntity.ok(ApiResponse.error("CONFLICT", e.getMessage(), List.of()));
        }
    }

    @PostMapping("/{id}/reject")
    @Operation(summary = "Reject proposal")
    public ResponseEntity<ApiResponse<Void>> reject(@PathVariable Long id) {
        try {
            transferProposalService.reject(id);
            return ResponseEntity.ok(ApiResponse.success(null, "Proposal rejected"));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.ok(ApiResponse.error("BAD_REQUEST", e.getMessage(), List.of()));
        } catch (IllegalStateException e) {
            return ResponseEntity.ok(ApiResponse.error("CONFLICT", e.getMessage(), List.of()));
        }
    }
}
