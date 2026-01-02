package com.hcl.testmate.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;

@Configuration
public class JiraConfig {

    private static final Logger log = LoggerFactory.getLogger(JiraConfig.class);

    @Value("${jira.url:}")
    private String jiraUrl;

    @Value("${jira.username:}")
    private String jiraUsername;

    @Value("${jira.password:}")
    private String jiraPassword;

    // Simple configuration check
    public boolean isConfigured() {
        boolean configured = jiraUrl != null && !jiraUrl.trim().isEmpty() && 
                           jiraUsername != null && !jiraUsername.trim().isEmpty() &&
                           jiraPassword != null && !jiraPassword.trim().isEmpty();
        
        if (!configured) {
            log.warn("JIRA integration is disabled or not configured");
        }
        
        return configured;
    }

    public String getJiraUrl() {
        return jiraUrl;
    }

    public String getJiraUsername() {
        return jiraUsername;
    }

    public String getJiraPassword() {
        return jiraPassword;
    }
}
