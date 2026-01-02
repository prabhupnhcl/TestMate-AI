package com.hcl.testmate.model;



import jakarta.validation.constraints.NotBlank;

/**
 * Request model for JIRA story input
 */
public class JiraStoryRequest {
    @NotBlank(message = "User story is required")
    private String userStory;
    private String acceptanceCriteria;
    private String businessRules;
    private String assumptions;
    private String constraints;
    private String additionalNotes;

    public JiraStoryRequest() {}

    public JiraStoryRequest(String userStory, String acceptanceCriteria, String businessRules, String assumptions, String constraints, String additionalNotes) {
        this.userStory = userStory;
        this.acceptanceCriteria = acceptanceCriteria;
        this.businessRules = businessRules;
        this.assumptions = assumptions;
        this.constraints = constraints;
        this.additionalNotes = additionalNotes;
    }

    public String getUserStory() {
        return userStory;
    }

    public void setUserStory(String userStory) {
        this.userStory = userStory;
    }

    public String getAcceptanceCriteria() {
        return acceptanceCriteria;
    }

    public void setAcceptanceCriteria(String acceptanceCriteria) {
        this.acceptanceCriteria = acceptanceCriteria;
    }

    public String getBusinessRules() {
        return businessRules;
    }

    public void setBusinessRules(String businessRules) {
        this.businessRules = businessRules;
    }

    public String getAssumptions() {
        return assumptions;
    }

    public void setAssumptions(String assumptions) {
        this.assumptions = assumptions;
    }

    public String getConstraints() {
        return constraints;
    }

    public void setConstraints(String constraints) {
        this.constraints = constraints;
    }

    public String getAdditionalNotes() {
        return additionalNotes;
    }

    public void setAdditionalNotes(String additionalNotes) {
        this.additionalNotes = additionalNotes;
    }

    public static Builder builder() {
        return new Builder();
    }

    public static class Builder {
        private String userStory;
        private String acceptanceCriteria;
        private String businessRules;
        private String assumptions;
        private String constraints;
        private String additionalNotes;

        public Builder userStory(String userStory) {
            this.userStory = userStory;
            return this;
        }

        public Builder acceptanceCriteria(String acceptanceCriteria) {
            this.acceptanceCriteria = acceptanceCriteria;
            return this;
        }

        public Builder businessRules(String businessRules) {
            this.businessRules = businessRules;
            return this;
        }

        public Builder assumptions(String assumptions) {
            this.assumptions = assumptions;
            return this;
        }

        public Builder constraints(String constraints) {
            this.constraints = constraints;
            return this;
        }

        public Builder additionalNotes(String additionalNotes) {
            this.additionalNotes = additionalNotes;
            return this;
        }

        public JiraStoryRequest build() {
            return new JiraStoryRequest(userStory, acceptanceCriteria, businessRules, assumptions, constraints, additionalNotes);
        }
    }
}
