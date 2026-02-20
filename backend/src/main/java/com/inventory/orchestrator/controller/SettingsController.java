package com.inventory.orchestrator.controller;

import com.inventory.orchestrator.dto.ApiResponse;
import com.inventory.orchestrator.service.SettingsService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/settings")
@CrossOrigin(origins = "*")
public class SettingsController {

    private final SettingsService settingsService;

    public SettingsController(SettingsService settingsService) {
        this.settingsService = settingsService;
    }

    @GetMapping
    public ResponseEntity<ApiResponse<Map<String, String>>> getAllSettings() {
        return ResponseEntity
                .ok(ApiResponse.success(settingsService.getAllSettings(), "Settings retrieved successfully"));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<Void>> updateSettings(@RequestBody Map<String, String> settings) {
        settingsService.saveSettings(settings);
        return ResponseEntity.ok(ApiResponse.success(null, "Settings updated successfully"));
    }
}
