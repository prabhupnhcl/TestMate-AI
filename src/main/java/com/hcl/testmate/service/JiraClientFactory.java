package com.hcl.testmate.service;

import java.net.URI;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

/**
 * Factory service to create JIRA REST clients with user-specific credentials.
 * Each user can provide their own JIRA URL, username, and API token.
 */
@Service
public class JiraClientFactory {

    private static final Logger log = LoggerFactory.getLogger(JiraClientFactory.class);
    
    // Cache for HTTP-based connections (simplified approach)
    private final Map<String, String> connectionCache = new ConcurrentHashMap<>();

    public String createClient(String jiraUrl, String username, String password) {
        String key = username + "@" + jiraUrl;
        log.info("Creating JIRA client with URI: {} for user: {}", jiraUrl, username);
        
        // Simple validation approach - store credentials for HTTP client usage
        connectionCache.put(key, jiraUrl);
        return key;
    }

    public boolean isValidConnection(String connectionKey) {
        return connectionCache.containsKey(connectionKey);
    }

    public String getJiraUrl(String connectionKey) {
        return connectionCache.get(connectionKey);
    }
}
