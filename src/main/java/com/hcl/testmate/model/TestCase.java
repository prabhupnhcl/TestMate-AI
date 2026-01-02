package com.hcl.testmate.model;

/**
 * Model representing a single test case
 */
public class TestCase {
    private String testCaseId;
    private String testScenario;
    private String preconditions;
    private String testSteps;
    private String expectedResult;
    private String priority;
    private String testType; // Positive, Negative, Validation, Error

    public TestCase() {}

    public TestCase(String testCaseId, String testScenario, String preconditions, String testSteps, String expectedResult, String priority, String testType) {
        this.testCaseId = testCaseId;
        this.testScenario = testScenario;
        this.preconditions = preconditions;
        this.testSteps = testSteps;
        this.expectedResult = expectedResult;
        this.priority = priority;
        this.testType = testType;
    }

    public static Builder builder() {
        return new Builder();
    }

    public static class Builder {
        private String testCaseId;
        private String testScenario;
        private String preconditions;
        private String testSteps;
        private String expectedResult;
        private String priority;
        private String testType;

        public Builder testCaseId(String testCaseId) { this.testCaseId = testCaseId; return this; }
        public Builder testScenario(String testScenario) { this.testScenario = testScenario; return this; }
        public Builder preconditions(String preconditions) { this.preconditions = preconditions; return this; }
        public Builder testSteps(String testSteps) { this.testSteps = testSteps; return this; }
        public Builder expectedResult(String expectedResult) { this.expectedResult = expectedResult; return this; }
        public Builder priority(String priority) { this.priority = priority; return this; }
        public Builder testType(String testType) { this.testType = testType; return this; }
        public TestCase build() {
            return new TestCase(testCaseId, testScenario, preconditions, testSteps, expectedResult, priority, testType);
        }
    }

    public String getTestCaseId() { return testCaseId; }
    public String getTestScenario() { return testScenario; }
    public String getPreconditions() { return preconditions; }
    public String getTestSteps() { return testSteps; }
    public String getExpectedResult() { return expectedResult; }
    public String getPriority() { return priority; }
    public String getTestType() { return testType; }

    public void setTestCaseId(String testCaseId) { this.testCaseId = testCaseId; }
    public void setTestScenario(String testScenario) { this.testScenario = testScenario; }
    public void setPreconditions(String preconditions) { this.preconditions = preconditions; }
    public void setTestSteps(String testSteps) { this.testSteps = testSteps; }
    public void setExpectedResult(String expectedResult) { this.expectedResult = expectedResult; }
    public void setPriority(String priority) { this.priority = priority; }
    public void setTestType(String testType) { this.testType = testType; }
}
