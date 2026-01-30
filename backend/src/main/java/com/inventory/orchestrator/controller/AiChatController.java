package com.inventory.orchestrator.controller;

import com.inventory.orchestrator.ai.AiOrchestratorService;
import com.inventory.orchestrator.dto.ApiResponse;
import com.inventory.orchestrator.dto.ai.AiChatRequest;
import com.inventory.orchestrator.dto.ai.AiChatResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/ai")
@CrossOrigin(origins = "*")
@Tag(name = "AI Chat", description = "AI Agent chat and transfer proposals")
public class AiChatController {

    private static final Logger log = LoggerFactory.getLogger(AiChatController.class);

    private final AiOrchestratorService aiOrchestratorService;

    public AiChatController(AiOrchestratorService aiOrchestratorService) {
        this.aiOrchestratorService = aiOrchestratorService;
    }

    @PostMapping("/chat")
    @Operation(summary = "Send message to AI Agent", description = "Returns summary, analysis, and optional transfer proposals. No stock is modified.")
    public ResponseEntity<ApiResponse<AiChatResponse>> chat(@Valid @RequestBody AiChatRequest request) {
        log.info("AI chat request: message length={}", request.getMessage() != null ? request.getMessage().length() : 0);
        AiChatResponse response = aiOrchestratorService.process(request.getMessage());
        return ResponseEntity.ok(ApiResponse.success(response, "OK"));
    }
}
