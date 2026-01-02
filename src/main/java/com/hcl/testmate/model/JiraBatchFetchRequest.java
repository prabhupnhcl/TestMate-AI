package com.hcl.testmate.model;

import java.util.List;

public class JiraBatchFetchRequest {
    private JiraCredentials credentials;
    private List<String> issueKeys;

    public JiraBatchFetchRequest() {}

    public JiraBatchFetchRequest(JiraCredentials credentials, List<String> issueKeys) {
        this.credentials = credentials;
        this.issueKeys = issueKeys;
    }

    public JiraCredentials getCredentials() {
        return credentials;
    }

    public void setCredentials(JiraCredentials credentials) {
        this.credentials = credentials;
    }

    public List<String> getIssueKeys() {
        return issueKeys;
    }

    public void setIssueKeys(List<String> issueKeys) {
        this.issueKeys = issueKeys;
    }
}
