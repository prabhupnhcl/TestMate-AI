package com.hcl.testmate.model;

/**
 * User's JIRA credentials for API access
 */
public class JiraCredentials {
    private String jiraUrl;
    private String username;
    private String apiToken;

    public JiraCredentials() {}

    public JiraCredentials(String jiraUrl, String username, String apiToken) {
        this.jiraUrl = jiraUrl;
        this.username = username;
        this.apiToken = apiToken;
    }

    public String getJiraUrl() { return jiraUrl; }
    public void setJiraUrl(String jiraUrl) { this.jiraUrl = jiraUrl; }
    public String getUsername() { return username; }
    public void setUsername(String username) { this.username = username; }
    public String getApiToken() { return apiToken; }
    public void setApiToken(String apiToken) { this.apiToken = apiToken; }
}
