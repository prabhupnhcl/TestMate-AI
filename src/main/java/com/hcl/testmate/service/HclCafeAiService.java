package com.hcl.testmate.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.hcl.testmate.config.HclCafeAiConfig;
import com.hcl.testmate.model.HclCafeAiModels.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.ArrayList;
import java.util.List;

/**
 * Service for interacting with HCL Cafe AI API
 */
@Service

public class HclCafeAiService {
    private static final Logger log = LoggerFactory.getLogger(HclCafeAiService.class);
    private final HclCafeAiConfig config;
    private final ObjectMapper objectMapper;
    private final HttpClient httpClient = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(30))
            .build();

    public HclCafeAiService(HclCafeAiConfig config, ObjectMapper objectMapper) {
        this.config = config;
        this.objectMapper = objectMapper;
    }
    
    /**
     * Send a chat request to HCL Cafe AI API
     */
    public String sendChatRequest(String userMessage) throws Exception {
        return sendChatRequest(userMessage, null);
    }
    
    /**
     * Send a chat request with system message
     */
    public String sendChatRequest(String userMessage, String systemMessage) throws Exception {
        List<Message> messages = new ArrayList<>();
        
        // Add system message if provided
        if (systemMessage != null && !systemMessage.isEmpty()) {
            messages.add(Message.builder()
                    .role("system")
                    .content(systemMessage)
                    .build());
        }
        
        // Add user message
        messages.add(Message.builder()
                .role("user")
                .content(userMessage)
                .build());
        
        // Create request
        ChatRequest chatRequest = ChatRequest.builder()
                .model(config.getModel())
                .messages(messages)
                .maxTokens(config.getMaxTokens())
                .temperature(config.getTemperature())
                .build();
        
        String requestBody = objectMapper.writeValueAsString(chatRequest);
        log.debug("Sending request to HCL Cafe AI: {}", requestBody);
        
        // Build HTTP request
        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(config.getEndpointUrl()))
                .header("Content-Type", "application/json")
                .header("api-key", config.getApiKey())
                .POST(HttpRequest.BodyPublishers.ofString(requestBody))
                .timeout(Duration.ofSeconds(60))
                .build();
        
        // Send request
        HttpResponse<String> response = httpClient.send(request, 
                HttpResponse.BodyHandlers.ofString());
        
        log.debug("Received response: {}", response.body());
        
        if (response.statusCode() != 200) {
            throw new RuntimeException("API request failed with status: " + 
                    response.statusCode() + ", body: " + response.body());
        }
        
        // Parse response
        ChatResponse chatResponse = objectMapper.readValue(response.body(), ChatResponse.class);
        
        if (chatResponse.getChoices() == null || chatResponse.getChoices().isEmpty()) {
            throw new RuntimeException("No response from AI");
        }
        
        return chatResponse.getChoices().get(0).getMessage().getContent();
    }
    
    /**
     * Send a simple chat message for Q&A
     */
    public String sendChatMessage(String systemPrompt, String userMessage) throws Exception {
        return sendChatRequest(userMessage, systemPrompt);
    }
}
