package com.inventory.orchestrator.service;

import com.inventory.orchestrator.entity.AppSettings;
import com.inventory.orchestrator.entity.CategorySettings;
import com.inventory.orchestrator.repository.AppSettingsRepository;
import com.inventory.orchestrator.repository.CategorySettingsRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Service
public class SettingsService {

    private final AppSettingsRepository appSettingsRepository;
    private final CategorySettingsRepository categorySettingsRepository;

    private static final Map<String, String> DEFAULTS = new HashMap<>();

    static {
        DEFAULTS.put("sales.lookback.enabled", "true");
        DEFAULTS.put("sales.lookback.days", "14");
        DEFAULTS.put("transfer.autoApprove.enabled", "false");
        DEFAULTS.put("transfer.autoApprove.threshold", "85");
        DEFAULTS.put("confidence.minAccept", "50");
        DEFAULTS.put("confidence.minApprove", "70");
        DEFAULTS.put("confidence.minAutoApprove", "90");
        DEFAULTS.put("quantity.min", "5");
        DEFAULTS.put("quantity.max", "300");
        DEFAULTS.put("stock.safety.enabled", "true");
        DEFAULTS.put("stock.safety.days", "5");
        DEFAULTS.put("stock.safety.minQty", "3");
        DEFAULTS.put("agent.mode", "BALANCED");
        DEFAULTS.put("maxSuggestions", "50");
    }

    public SettingsService(AppSettingsRepository appSettingsRepository,
            CategorySettingsRepository categorySettingsRepository) {
        this.appSettingsRepository = appSettingsRepository;
        this.categorySettingsRepository = categorySettingsRepository;
    }

    public String getString(String key) {
        return appSettingsRepository.findByKey(key)
                .map(AppSettings::getValue)
                .orElse(DEFAULTS.getOrDefault(key, ""));
    }

    public int getInt(String key) {
        String val = getString(key);
        try {
            return Integer.parseInt(val);
        } catch (NumberFormatException e) {
            String def = DEFAULTS.get(key);
            return def != null ? Integer.parseInt(def) : 0;
        }
    }

    public boolean getBoolean(String key) {
        return Boolean.parseBoolean(getString(key));
    }

    public Map<String, String> getAllSettings() {
        Map<String, String> result = new HashMap<>(DEFAULTS);
        List<AppSettings> settings = appSettingsRepository.findAll();
        for (AppSettings s : settings) {
            result.put(s.getKey(), s.getValue());
        }
        return result;
    }

    @Transactional
    public void saveSetting(String key, String value) {
        Optional<AppSettings> existing = appSettingsRepository.findByKey(key);
        AppSettings setting = existing.orElse(new AppSettings());
        setting.setKey(key);
        setting.setValue(value);
        setting.setUpdatedAt(LocalDateTime.now());
        appSettingsRepository.save(setting);
    }

    @Transactional
    public void saveSettings(Map<String, String> settings) {
        for (Map.Entry<String, String> entry : settings.entrySet()) {
            saveSetting(entry.getKey(), entry.getValue());
        }
    }

    public List<CategorySettings> getAllCategorySettings() {
        return categorySettingsRepository.findAll();
    }

    public Optional<CategorySettings> getCategorySettings(Long categoryId) {
        return categorySettingsRepository.findByCategoryId(categoryId);
    }

    @Transactional
    public CategorySettings saveCategorySettings(CategorySettings settings) {
        return categorySettingsRepository.save(settings);
    }

    @Transactional
    public List<CategorySettings> saveCategorySettingsList(List<CategorySettings> settingsList) {
        return categorySettingsRepository.saveAll(settingsList);
    }
}
