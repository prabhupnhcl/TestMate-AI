package com.hcl.testmate.model;

public class JiraFetchRequest {
    private JiraCredentials credentials;
    private String issueKey;

    public JiraFetchRequest() {}

    public JiraFetchRequest(JiraCredentials credentials, String issueKey) {
        this.credentials = credentials;
        this.issueKey = issueKey;
    }

    public JiraCredentials getCredentials() {
        return credentials;
    }

    public void setCredentials(JiraCredentials credentials) {
        this.credentials = credentials;
    }

    public String getIssueKey() {
        return issueKey;
    }

    public void setIssueKey(String issueKey) {
        this.issueKey = issueKey;
    }
}
