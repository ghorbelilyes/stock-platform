package com.inventory.orchestrator.controller;

import com.inventory.orchestrator.dto.ApiResponse;
import com.inventory.orchestrator.entity.CategorySettings;
import com.inventory.orchestrator.service.SettingsService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
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

    @GetMapping("/categories")
    public ResponseEntity<ApiResponse<List<CategorySettings>>> getCategorySettings() {
        return ResponseEntity.ok(ApiResponse.success(settingsService.getAllCategorySettings(),
                "Category settings retrieved successfully"));
    }

    @PostMapping("/categories")
    public ResponseEntity<ApiResponse<CategorySettings>> updateCategorySettings(
            @RequestBody CategorySettings settings) {
        return ResponseEntity.ok(ApiResponse.success(settingsService.saveCategorySettings(settings),
                "Category settings updated successfully"));
    }

    @PostMapping("/categories/bulk")
    public ResponseEntity<ApiResponse<List<CategorySettings>>> updateCategorySettingsBulk(
            @RequestBody List<CategorySettings> settings) {
        return ResponseEntity.ok(ApiResponse.success(settingsService.saveCategorySettingsList(settings),
                "Category settings updated successfully"));
    }
}
