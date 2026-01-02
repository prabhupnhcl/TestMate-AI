package com.hcl.testmate.model;

import java.util.List;

public class JiraStoriesRequest {
    private JiraCredentials credentials;
    private List<String> projectKeys;

    public JiraStoriesRequest() {}

    public JiraStoriesRequest(JiraCredentials credentials, List<String> projectKeys) {
        this.credentials = credentials;
        this.projectKeys = projectKeys;
    }

    public JiraCredentials getCredentials() {
        return credentials;
    }

    public void setCredentials(JiraCredentials credentials) {
        this.credentials = credentials;
    }

    public List<String> getProjectKeys() {
        return projectKeys;
    }

    public void setProjectKeys(List<String> projectKeys) {
        this.projectKeys = projectKeys;
    }
}
