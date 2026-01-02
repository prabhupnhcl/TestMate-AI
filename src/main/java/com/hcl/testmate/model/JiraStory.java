package com.hcl.testmate.model;

import java.util.List;

public class JiraStory {
    private String issueKey;
    private String summary;
    private String description;
    private String userStory;
    private List<String> acceptanceCriteria;
    private List<String> businessRules;
    private String priority;
    private String status;
    private String assignee;
    private String reporter;
    private String createdDate;
    private String project;
    // Additional metadata
    private String issueType;
    private String storyPoints;
    private String sprint;
    private List<String> labels;
    private List<String> components;

    public JiraStory() {}

    public JiraStory(String issueKey, String summary, String description, String userStory, List<String> acceptanceCriteria, List<String> businessRules, String priority, String status, String assignee, String reporter, String createdDate, String project, String issueType, String storyPoints, String sprint, List<String> labels, List<String> components) {
        this.issueKey = issueKey;
        this.summary = summary;
        this.description = description;
        this.userStory = userStory;
        this.acceptanceCriteria = acceptanceCriteria;
        this.businessRules = businessRules;
        this.priority = priority;
        this.status = status;
        this.assignee = assignee;
        this.reporter = reporter;
        this.createdDate = createdDate;
        this.project = project;
        this.issueType = issueType;
        this.storyPoints = storyPoints;
        this.sprint = sprint;
        this.labels = labels;
        this.components = components;
    }

    // Getters and setters for all fields
    public String getIssueKey() { return issueKey; }
    public void setIssueKey(String issueKey) { this.issueKey = issueKey; }
    public String getSummary() { return summary; }
    public void setSummary(String summary) { this.summary = summary; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public String getUserStory() { return userStory; }
    public void setUserStory(String userStory) { this.userStory = userStory; }
    public List<String> getAcceptanceCriteria() { return acceptanceCriteria; }
    public void setAcceptanceCriteria(List<String> acceptanceCriteria) { this.acceptanceCriteria = acceptanceCriteria; }
    public List<String> getBusinessRules() { return businessRules; }
    public void setBusinessRules(List<String> businessRules) { this.businessRules = businessRules; }
    public String getPriority() { return priority; }
    public void setPriority(String priority) { this.priority = priority; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public String getAssignee() { return assignee; }
    public void setAssignee(String assignee) { this.assignee = assignee; }
    public String getReporter() { return reporter; }
    public void setReporter(String reporter) { this.reporter = reporter; }
    public String getCreatedDate() { return createdDate; }
    public void setCreatedDate(String createdDate) { this.createdDate = createdDate; }
    public String getProject() { return project; }
    public void setProject(String project) { this.project = project; }
    public String getIssueType() { return issueType; }
    public void setIssueType(String issueType) { this.issueType = issueType; }
    public String getStoryPoints() { return storyPoints; }
    public void setStoryPoints(String storyPoints) { this.storyPoints = storyPoints; }
    public String getSprint() { return sprint; }
    public void setSprint(String sprint) { this.sprint = sprint; }
    public List<String> getLabels() { return labels; }
    public void setLabels(List<String> labels) { this.labels = labels; }
    public List<String> getComponents() { return components; }
    public void setComponents(List<String> components) { this.components = components; }

    public static Builder builder() {
        return new Builder();
    }

    public static class Builder {
        private String issueKey;
        private String summary;
        private String description;
        private String userStory;
        private List<String> acceptanceCriteria;
        private List<String> businessRules;
        private String priority;
        private String status;
        private String assignee;
        private String reporter;
        private String createdDate;
        private String project;
        private String issueType;
        private String storyPoints;
        private String sprint;
        private List<String> labels;
        private List<String> components;

        public Builder issueKey(String issueKey) { this.issueKey = issueKey; return this; }
        public Builder summary(String summary) { this.summary = summary; return this; }
        public Builder description(String description) { this.description = description; return this; }
        public Builder userStory(String userStory) { this.userStory = userStory; return this; }
        public Builder acceptanceCriteria(List<String> acceptanceCriteria) { this.acceptanceCriteria = acceptanceCriteria; return this; }
        public Builder businessRules(List<String> businessRules) { this.businessRules = businessRules; return this; }
        public Builder priority(String priority) { this.priority = priority; return this; }
        public Builder status(String status) { this.status = status; return this; }
        public Builder assignee(String assignee) { this.assignee = assignee; return this; }
        public Builder reporter(String reporter) { this.reporter = reporter; return this; }
        public Builder createdDate(String createdDate) { this.createdDate = createdDate; return this; }
        public Builder project(String project) { this.project = project; return this; }
        public Builder issueType(String issueType) { this.issueType = issueType; return this; }
        public Builder storyPoints(String storyPoints) { this.storyPoints = storyPoints; return this; }
        public Builder sprint(String sprint) { this.sprint = sprint; return this; }
        public Builder labels(List<String> labels) { this.labels = labels; return this; }
        public Builder components(List<String> components) { this.components = components; return this; }
        public JiraStory build() {
            return new JiraStory(issueKey, summary, description, userStory, acceptanceCriteria, businessRules, priority, status, assignee, reporter, createdDate, project, issueType, storyPoints, sprint, labels, components);
        }
    }
}
