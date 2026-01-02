package com.hcl.testmate.config;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

/**
 * Configuration properties for HCL Cafe AI API
 */
@Configuration
@ConfigurationProperties(prefix = "hcl.cafe.ai")
public class HclCafeAiConfig {
    private String apiKey;
    private String baseUrl;
    private String deploymentName;
    private String apiVersion;
    private String model;
    private Integer maxTokens;
    private Double temperature;

    public HclCafeAiConfig() {}

    public String getApiKey() { return apiKey; }
    public void setApiKey(String apiKey) { this.apiKey = apiKey; }
    public String getBaseUrl() { return baseUrl; }
    public void setBaseUrl(String baseUrl) { this.baseUrl = baseUrl; }
    public String getDeploymentName() { return deploymentName; }
    public void setDeploymentName(String deploymentName) { this.deploymentName = deploymentName; }
    public String getApiVersion() { return apiVersion; }
    public void setApiVersion(String apiVersion) { this.apiVersion = apiVersion; }
    public String getModel() { return model; }
    public void setModel(String model) { this.model = model; }
    public Integer getMaxTokens() { return maxTokens; }
    public void setMaxTokens(Integer maxTokens) { this.maxTokens = maxTokens; }
    public Double getTemperature() { return temperature; }
    public void setTemperature(Double temperature) { this.temperature = temperature; }

    /**
     * Get the complete API endpoint URL
     */
    public String getEndpointUrl() {
        return String.format("%s/%s/chat/completions?api-version=%s", 
            baseUrl, deploymentName, apiVersion);
    }
}
