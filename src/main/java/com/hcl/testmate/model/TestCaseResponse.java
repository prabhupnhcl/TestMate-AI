package com.hcl.testmate.model;

import java.util.List;

/**
 * Response model containing generated test cases and CSV data
 */
public class TestCaseResponse {
    private List<TestCase> testCases;
    private String csvContent;
    private int totalTestCases;
    private String message;
    private boolean success;
    private ExtractedContent extractedContent;
    private String jiraIssueKey;
    private String jiraProject;
    private String jiraSummary;

    public TestCaseResponse() {}

    public TestCaseResponse(List<TestCase> testCases, String csvContent, int totalTestCases, String message, boolean success) {
        this.testCases = testCases;
        this.csvContent = csvContent;
        this.totalTestCases = totalTestCases;
        this.message = message;
        this.success = success;
    }

    public static Builder builder() { return new Builder(); }

    public static class Builder {
        private List<TestCase> testCases;
        private String csvContent;
        private int totalTestCases;
        private String message;
        private boolean success;
        private ExtractedContent extractedContent;
        private String jiraIssueKey;
        private String jiraProject;
        private String jiraSummary;

        public Builder testCases(List<TestCase> testCases) { this.testCases = testCases; return this; }
        public Builder csvContent(String csvContent) { this.csvContent = csvContent; return this; }
        public Builder totalTestCases(int totalTestCases) { this.totalTestCases = totalTestCases; return this; }
        public Builder message(String message) { this.message = message; return this; }
        public Builder success(boolean success) { this.success = success; return this; }
        public Builder extractedContent(ExtractedContent extractedContent) { this.extractedContent = extractedContent; return this; }
        public Builder jiraIssueKey(String jiraIssueKey) { this.jiraIssueKey = jiraIssueKey; return this; }
        public Builder jiraProject(String jiraProject) { this.jiraProject = jiraProject; return this; }
        public Builder jiraSummary(String jiraSummary) { this.jiraSummary = jiraSummary; return this; }
        public TestCaseResponse build() {
            TestCaseResponse resp = new TestCaseResponse(testCases, csvContent, totalTestCases, message, success);
            resp.setExtractedContent(extractedContent);
            resp.setJiraIssueKey(jiraIssueKey);
            resp.setJiraProject(jiraProject);
            resp.setJiraSummary(jiraSummary);
            return resp;
        }
    }

    public List<TestCase> getTestCases() { return testCases; }
    public String getCsvContent() { return csvContent; }
    public int getTotalTestCases() { return totalTestCases; }
    public String getMessage() { return message; }
    public boolean isSuccess() { return success; }
    public ExtractedContent getExtractedContent() { return extractedContent; }
    public String getJiraIssueKey() { return jiraIssueKey; }
    public String getJiraProject() { return jiraProject; }
    public String getJiraSummary() { return jiraSummary; }

    public void setTestCases(List<TestCase> testCases) { this.testCases = testCases; }
    public void setCsvContent(String csvContent) { this.csvContent = csvContent; }
    public void setTotalTestCases(int totalTestCases) { this.totalTestCases = totalTestCases; }
    public void setMessage(String message) { this.message = message; }
    public void setSuccess(boolean success) { this.success = success; }
    public void setExtractedContent(ExtractedContent extractedContent) { this.extractedContent = extractedContent; }
    public void setJiraIssueKey(String jiraIssueKey) { this.jiraIssueKey = jiraIssueKey; }
    public void setJiraProject(String jiraProject) { this.jiraProject = jiraProject; }
    public void setJiraSummary(String jiraSummary) { this.jiraSummary = jiraSummary; }

    public static class ExtractedContent {
        private String userStory;
        private String acceptanceCriteria;
        private String businessRules;

        public ExtractedContent() {}
        public ExtractedContent(String userStory, String acceptanceCriteria, String businessRules) {
            this.userStory = userStory;
            this.acceptanceCriteria = acceptanceCriteria;
            this.businessRules = businessRules;
        }
        public static Builder builder() { return new Builder(); }
        public static class Builder {
            private String userStory;
            private String acceptanceCriteria;
            private String businessRules;
            public Builder userStory(String userStory) { this.userStory = userStory; return this; }
            public Builder acceptanceCriteria(String acceptanceCriteria) { this.acceptanceCriteria = acceptanceCriteria; return this; }
            public Builder businessRules(String businessRules) { this.businessRules = businessRules; return this; }
            public ExtractedContent build() { return new ExtractedContent(userStory, acceptanceCriteria, businessRules); }
        }
        public String getUserStory() { return userStory; }
        public String getAcceptanceCriteria() { return acceptanceCriteria; }
        public String getBusinessRules() { return businessRules; }
        public void setUserStory(String userStory) { this.userStory = userStory; }
        public void setAcceptanceCriteria(String acceptanceCriteria) { this.acceptanceCriteria = acceptanceCriteria; }
        public void setBusinessRules(String businessRules) { this.businessRules = businessRules; }
    }
}
