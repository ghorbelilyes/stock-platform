package com.inventory.orchestrator.ai;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.util.UriComponentsBuilder;

import java.util.List;
import java.util.Map;

/**
 * HTTP client for OpenAI / Azure OpenAI and Google Gemini chat APIs.
 * AI has READ access only; no stock or transfer modification.
 */
@Component
public class LlmClient {

    private static final Logger log = LoggerFactory.getLogger(LlmClient.class);

    @Value("${app.ai.llm.endpoint:}")
    private String endpoint;

    @Value("${app.ai.llm.api-key:}")
    private String apiKey;

    @Value("${app.ai.llm.model:gpt-3.5-turbo}")
    private String model;

    private final RestTemplate restTemplate = new RestTemplate();
    private final ObjectMapper objectMapper = new ObjectMapper();

    public boolean isConfigured() {
        return endpoint != null && !endpoint.isBlank() && apiKey != null && !apiKey.isBlank();
    }

    private boolean isGemini() {
        return endpoint != null && endpoint.contains("generativelanguage.googleapis.com");
    }

    /**
     * Send a chat prompt and return the assistant reply text.
     * Returns null if not configured or on error; no hallucinated data.
     * Supports OpenAI/Azure and Google Gemini (API key in query string).
     */
    public String chat(String systemPrompt, String userMessage) {
        if (!isConfigured()) {
            log.warn("LLM not configured: endpoint or api-key missing");
            return null;
        }
        try {
            if (isGemini()) {
                return chatGemini(systemPrompt, userMessage);
            }
            return chatOpenAI(systemPrompt, userMessage);
        } catch (Exception e) {
            log.error("LLM request failed: {}", e.getMessage());
            return null;
        }
    }

    private String chatOpenAI(String systemPrompt, String userMessage) throws Exception {
        Map<String, Object> body = Map.of(
                "model", model,
                "messages", List.of(
                        Map.of("role", "system", "content", systemPrompt != null ? systemPrompt : "You are an inventory analyst. Be concise and factual."),
                        Map.of("role", "user", "content", userMessage != null ? userMessage : "")
                ),
                "max_tokens", 1024,
                "temperature", 0.3
        );
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.set("Authorization", "Bearer " + apiKey);
        HttpEntity<String> entity = new HttpEntity<>(objectMapper.writeValueAsString(body), headers);
        ResponseEntity<String> response = restTemplate.exchange(endpoint, HttpMethod.POST, entity, String.class);
        if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
            JsonNode root = objectMapper.readTree(response.getBody());
            JsonNode choices = root.path("choices");
            if (choices.isArray() && choices.size() > 0) {
                String content = choices.get(0).path("message").path("content").asText("");
                log.debug("LLM response length={}", content.length());
                log.info("AI LLM: prompt length={}, response length={}", userMessage != null ? userMessage.length() : 0, content.length());
                return content.trim();
            }
        }
        return null;
    }

    private String chatGemini(String systemPrompt, String userMessage) throws Exception {
        String url = UriComponentsBuilder.fromHttpUrl(endpoint).queryParam("key", apiKey).toUriString();
        ObjectNode root = objectMapper.createObjectNode();
        String userText = userMessage != null ? userMessage : "";
        if (systemPrompt != null && !systemPrompt.isBlank()) {
            userText = systemPrompt + "\n\nUser: " + userText;
        }
        root.putArray("contents").addObject()
                .putArray("parts").addObject().put("text", userText);
        root.putObject("generationConfig")
                .put("maxOutputTokens", 1024)
                .put("temperature", 0.3);
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        HttpEntity<String> entity = new HttpEntity<>(objectMapper.writeValueAsString(root), headers);
        ResponseEntity<String> response = restTemplate.exchange(url, HttpMethod.POST, entity, String.class);
        if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
            JsonNode res = objectMapper.readTree(response.getBody());
            JsonNode candidates = res.path("candidates");
            if (candidates.isArray() && candidates.size() > 0) {
                JsonNode content = candidates.get(0).path("content").path("parts");
                if (content.isArray() && content.size() > 0) {
                    String text = content.get(0).path("text").asText("");
                    log.debug("LLM response length={}", text.length());
                    log.info("AI LLM (Gemini): prompt length={}, response length={}", userMessage != null ? userMessage.length() : 0, text.length());
                    return text.trim();
                }
            }
        }
        return null;
    }

    /**
     * Generate explanation text from context (e.g. stock analysis summary).
     * Returns fallback if LLM not configured.
     */
    public String explain(String contextSummary, String userQuestion) {
        String system = "You are an inventory analyst. Answer only from the provided context. Be concise. Do not invent numbers.";
        String user = "Context:\n" + (contextSummary != null ? contextSummary : "") + "\n\nUser question: " + (userQuestion != null ? userQuestion : "");
        String reply = chat(system, user);
        return reply != null ? reply : "Analysis is based on current stock levels and sales history. No external explanation available.";
    }
}
