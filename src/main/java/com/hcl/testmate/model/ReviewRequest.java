package com.hcl.testmate.model;

public class ReviewRequest {
    private String reviewerName;
    private String creatorEmail;
    private String status; // approved, changes-requested, rejected
    private String comments;
    private int testCaseCount;

    public ReviewRequest() {}

    public ReviewRequest(String reviewerName, String creatorEmail, String status, String comments, int testCaseCount) {
        this.reviewerName = reviewerName;
        this.creatorEmail = creatorEmail;
        this.status = status;
        this.comments = comments;
        this.testCaseCount = testCaseCount;
    }

    public String getReviewerName() { return reviewerName; }
    public void setReviewerName(String reviewerName) { this.reviewerName = reviewerName; }
    public String getCreatorEmail() { return creatorEmail; }
    public void setCreatorEmail(String creatorEmail) { this.creatorEmail = creatorEmail; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public String getComments() { return comments; }
    public void setComments(String comments) { this.comments = comments; }
    public int getTestCaseCount() { return testCaseCount; }
    public void setTestCaseCount(int testCaseCount) { this.testCaseCount = testCaseCount; }
}
