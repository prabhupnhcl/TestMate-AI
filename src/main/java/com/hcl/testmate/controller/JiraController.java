package com.hcl.testmate.controller;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.hcl.testmate.model.JiraCredentials;
import com.hcl.testmate.model.JiraFetchRequest;
import com.hcl.testmate.model.JiraStoriesRequest;
import com.hcl.testmate.model.JiraStory;
import com.hcl.testmate.model.JiraStoryRequest;
import com.hcl.testmate.model.TestCaseResponse;
import com.hcl.testmate.service.JiraService;
import com.hcl.testmate.service.TestCaseGeneratorService;

@RestController
@RequestMapping("/api/jira")

public class JiraController {
    private static final Logger log = LoggerFactory.getLogger(JiraController.class);
    private final JiraService jiraService;
    private final TestCaseGeneratorService testCaseGeneratorService;

    public JiraController(JiraService jiraService, TestCaseGeneratorService testCaseGeneratorService) {
        this.jiraService = jiraService;
        this.testCaseGeneratorService = testCaseGeneratorService;
    }

    /**
     * Validate that a JIRA issue exists and is accessible
     */
    @PostMapping("/validate-issue")
    public ResponseEntity<?> validateJiraIssue(@RequestBody JiraFetchRequest request) {
        try {
            log.info("Validating JIRA issue: {} for user: {}", request.getIssueKey(), request.getCredentials().getUsername());
            
            JiraStory story = jiraService.fetchStory(
                request.getCredentials().getJiraUrl(),
                request.getCredentials().getUsername(),
                request.getCredentials().getApiToken(),
                request.getIssueKey()
            );
            
            // Return basic issue info for validation
            return ResponseEntity.ok(Map.of(
                "valid", true,
                "issueKey", story.getIssueKey(),
                "summary", story.getSummary(),
                "status", story.getStatus(),
                "issueType", story.getIssueType()
            ));
        } catch (Exception e) {
            log.error("Error validating JIRA issue", e);
            return ResponseEntity.ok(Map.of(
                "valid", false,
                "error", e.getMessage()
            ));
        }
    }

    /**
     * Fetch a JIRA story using user-provided credentials
     */
    @PostMapping("/story")
    public ResponseEntity<?> fetchStory(@RequestBody JiraFetchRequest request) {
        try {
            log.info("Fetching JIRA story: {} for user: {}", request.getIssueKey(), request.getCredentials().getUsername());
            
            JiraStory story = jiraService.fetchStory(
                request.getCredentials().getJiraUrl(),
                request.getCredentials().getUsername(),
                request.getCredentials().getApiToken(),
                request.getIssueKey()
            );
            
            return ResponseEntity.ok(story);
        } catch (Exception e) {
            log.error("Error fetching JIRA story", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(new ErrorResponse("Failed to fetch JIRA story: " + e.getMessage()));
        }
    }

    /**
     * Fetch stories from JIRA projects using user-provided credentials
     */
    @PostMapping("/stories")
    public ResponseEntity<?> fetchStories(@RequestBody JiraStoriesRequest request) {
        try {
            log.info("Fetching stories from {} projects for user: {}", 
                request.getProjectKeys().size(), request.getCredentials().getUsername());
            
            List<JiraStory> stories = jiraService.fetchStoriesByProjects(
                request.getCredentials().getJiraUrl(),
                request.getCredentials().getUsername(),
                request.getCredentials().getApiToken(),
                request.getProjectKeys()
            );
            
            return ResponseEntity.ok(stories);
        } catch (Exception e) {
            log.error("Error fetching JIRA stories", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(new ErrorResponse("Failed to fetch JIRA stories: " + e.getMessage()));
        }
    }

    /**
     * Fetch JIRA story and generate test cases using user-provided credentials
     */
    @PostMapping("/generate")
    public ResponseEntity<?> generateFromJira(@RequestBody JiraFetchRequest request) {
        try {
            log.info("Starting test case generation for JIRA issue: {} (user: {})", request.getIssueKey(), request.getCredentials().getUsername());
            
            // Step 1: Fetch JIRA story
            log.debug("Step 1: Fetching JIRA story...");
            JiraStory jiraStory = jiraService.fetchStory(
                request.getCredentials().getJiraUrl(),
                request.getCredentials().getUsername(),
                request.getCredentials().getApiToken(),
                request.getIssueKey()
            );
            log.info("Successfully fetched JIRA story: {} - {}", jiraStory.getIssueKey(), jiraStory.getSummary());
            
            // Step 2: Convert to request format
            log.debug("Step 2: Converting to test case request format...");
            JiraStoryRequest storyRequest = convertToRequest(jiraStory);
            log.debug("Conversion complete. User story length: {}, AC length: {}, BR length: {}", 
                storyRequest.getUserStory() != null ? storyRequest.getUserStory().length() : 0,
                storyRequest.getAcceptanceCriteria() != null ? storyRequest.getAcceptanceCriteria().length() : 0,
                storyRequest.getBusinessRules() != null ? storyRequest.getBusinessRules().length() : 0);
            
            // Step 3: Generate test cases
            log.debug("Step 3: Calling test case generator service...");
            TestCaseResponse response = testCaseGeneratorService.generateTestCases(storyRequest);
            log.info("Test case generation completed. Generated {} test cases", 
                response.getTestCases() != null ? response.getTestCases().size() : 0);
            
            // Step 4: Add JIRA metadata
            log.debug("Step 4: Adding JIRA metadata to response...");
            response.setJiraIssueKey(request.getIssueKey());
            response.setJiraProject(jiraStory.getProject());
            response.setJiraSummary(jiraStory.getSummary());
            
            // Step 5: Add extracted content for coverage analysis
            log.debug("Step 5: Adding extracted content for coverage analysis...");
            TestCaseResponse.ExtractedContent extractedContent = 
                    TestCaseResponse.ExtractedContent.builder()
                            .userStory(storyRequest.getUserStory())
                            .acceptanceCriteria(storyRequest.getAcceptanceCriteria())
                            .businessRules(storyRequest.getBusinessRules())
                            .build();
            response.setExtractedContent(extractedContent);
            
            log.info("Successfully completed test case generation for {}", request.getIssueKey());
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            log.error("Error in test case generation process for issue {}: {}", request.getIssueKey(), e.getMessage(), e);
            
            String errorMessage = "Failed to generate test cases: " + e.getMessage();
            
            // Provide more specific error messages based on exception type
            if (e.getMessage() != null) {
                if (e.getMessage().contains("API key") || e.getMessage().contains("authentication")) {
                    errorMessage = "AI service authentication failed. Please check your API configuration.";
                } else if (e.getMessage().contains("quota") || e.getMessage().contains("rate limit")) {
                    errorMessage = "AI service quota exceeded. Please try again later.";
                } else if (e.getMessage().contains("timeout")) {
                    errorMessage = "AI service timeout. The request took too long. Please try again.";
                }
            }
            
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(new ErrorResponse(errorMessage));
        }
    }

    /**
     * Batch process multiple JIRA stories using user-provided credentials
     */
    @PostMapping("/generate/batch")
    public ResponseEntity<?> generateFromJiraBatch(@RequestBody JiraBatchGenerateRequest request) {
        try {
            log.info("Batch generating test cases from {} JIRA stories for user: {}", 
                request.getStories().size(), request.getCredentials().getUsername());
            
            List<BatchResult> results = new ArrayList<>();
            
            for (JiraStoryInfo storyInfo : request.getStories()) {
                try {
                    String issueKey = storyInfo.getKey();
                    log.info("Fetching JIRA story: {} for user: {}", issueKey, request.getCredentials().getUsername());
                    JiraStory jiraStory = jiraService.fetchStory(
                        request.getCredentials().getJiraUrl(),
                        request.getCredentials().getUsername(),
                        request.getCredentials().getApiToken(),
                        issueKey
                    );
                    
                    // Convert to request format
                    JiraStoryRequest storyRequest = convertToRequest(jiraStory);
                    
                    // Generate test cases
                    TestCaseResponse response = testCaseGeneratorService.generateTestCases(storyRequest);
                    
                    // Add JIRA metadata
                    response.setJiraIssueKey(issueKey);
                    response.setJiraProject(jiraStory.getProject());
                    response.setJiraSummary(jiraStory.getSummary());
                    
                    // Add extracted content for coverage analysis
                    TestCaseResponse.ExtractedContent extractedContent = 
                            TestCaseResponse.ExtractedContent.builder()
                                    .userStory(storyRequest.getUserStory())
                                    .acceptanceCriteria(storyRequest.getAcceptanceCriteria())
                                    .businessRules(storyRequest.getBusinessRules())
                                    .build();
                    response.setExtractedContent(extractedContent);
                    
                    results.add(new BatchResult(issueKey, true, null, response));
                    
                } catch (Exception e) {
                    log.error("Error processing JIRA story: {}", storyInfo.getKey(), e);
                    results.add(new BatchResult(storyInfo.getKey(), false, e.getMessage(), null));
                }
            }
            
            return ResponseEntity.ok(new BatchResponse(results));
            
        } catch (Exception e) {
            log.error("Error in batch processing", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(new ErrorResponse("Batch processing failed: " + e.getMessage()));
        }
    }

    /**
     * Validate JIRA connection using user-provided credentials
     */
    @PostMapping("/validate")
    public ResponseEntity<?> validateConnection(@RequestBody JiraCredentials credentials) {
        try {
            log.info("Validating JIRA connection for user: {}", credentials.getUsername());
            
            boolean isValid = jiraService.validateConnection(
                credentials.getJiraUrl(),
                credentials.getUsername(),
                credentials.getApiToken()
            );
            
            if (isValid) {
                return ResponseEntity.ok(new ValidationResponse(true, "Successfully connected to JIRA!"));
            } else {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(new ValidationResponse(false, "Failed to connect to JIRA. Please check your credentials and URL."));
            }
            
        } catch (Exception e) {
            log.error("Error validating JIRA connection for user {}: {}", credentials.getUsername(), e.getMessage());
            
            // Return detailed error message
            String errorMessage = e.getMessage();
            if (errorMessage == null || errorMessage.isEmpty()) {
                errorMessage = "Failed to connect to JIRA. Please check your credentials and URL.";
            }
            
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(new ValidationResponse(false, errorMessage));
        }
    }

    /**
     * Convert JiraStory to JiraStoryRequest format
     */
    private JiraStoryRequest convertToRequest(JiraStory jiraStory) {
        JiraStoryRequest request = new JiraStoryRequest();
        
        // Combine issue key and summary for user story
        String userStory = String.format("[%s] %s\n\n%s", 
            jiraStory.getIssueKey(),
            jiraStory.getSummary(),
            jiraStory.getUserStory() != null ? jiraStory.getUserStory() : "");
        
        request.setUserStory(userStory.trim());
        
        // Join acceptance criteria
        if (jiraStory.getAcceptanceCriteria() != null && !jiraStory.getAcceptanceCriteria().isEmpty()) {
            String joinedAC = String.join("\n", jiraStory.getAcceptanceCriteria());
            log.debug("Converting AC from JIRA: {} items, joined length: {}", 
                jiraStory.getAcceptanceCriteria().size(), joinedAC.length());
            request.setAcceptanceCriteria(joinedAC);
        } else {
            log.warn("No acceptance criteria found in JIRA story: {}", jiraStory.getIssueKey());
        }
        
        // Join and format business rules with proper numbering
        if (jiraStory.getBusinessRules() != null && !jiraStory.getBusinessRules().isEmpty()) {
            String formattedBusinessRules = formatBusinessRulesWithNumbers(jiraStory.getBusinessRules());
            request.setBusinessRules(formattedBusinessRules);
        }
        
        return request;
    }

    /**
     * Format business rules from JIRA with proper BR numbering
     * This ensures consistent formatting while preserving the original content
     */
    private String formatBusinessRulesWithNumbers(List<String> businessRules) {
        StringBuilder formattedRules = new StringBuilder();
        int ruleNumber = 1;
        
        for (String rule : businessRules) {
            if (rule == null || rule.trim().isEmpty()) {
                continue;
            }
            
            String cleanRule = rule.trim();
            
            // Skip obvious table headers, formatting artifacts, and very short content
            if (cleanRule.startsWith("|") || cleanRule.toLowerCase().contains("business rule no") 
                || cleanRule.toLowerCase().contains("description") || cleanRule.equals("---")
                || cleanRule.matches("^[\\s\\|\\-\\*]+$")
                || cleanRule.length() < 10) {
                continue;
            }
            
            // Check if rule already has BR numbering
            if (!cleanRule.matches(".*\\bBR\\d{3}\\b.*")) {
                // Add BR numbering if it doesn't exist
                formattedRules.append("BR").append(String.format("%03d", ruleNumber))
                             .append(" ").append(cleanRule).append("\n");
                ruleNumber++;
            } else {
                // Rule already has BR numbering, keep as is
                formattedRules.append(cleanRule).append("\n");
            }
        }
        
        return formattedRules.toString().trim();
    }

    // Request/Response classes

    public static class JiraStoryInfo {
        private String key;
        private String summary;
        public JiraStoryInfo() {}
        public JiraStoryInfo(String key, String summary) {
            this.key = key;
            this.summary = summary;
        }
        public String getKey() { return key; }
        public void setKey(String key) { this.key = key; }
        public String getSummary() { return summary; }
        public void setSummary(String summary) { this.summary = summary; }
    }

    public static class JiraBatchGenerateRequest {
        private JiraCredentials credentials;
        private List<JiraStoryInfo> stories;
        public JiraBatchGenerateRequest() {}
        public JiraBatchGenerateRequest(JiraCredentials credentials, List<JiraStoryInfo> stories) {
            this.credentials = credentials;
            this.stories = stories;
        }
        public JiraCredentials getCredentials() { return credentials; }
        public void setCredentials(JiraCredentials credentials) { this.credentials = credentials; }
        public List<JiraStoryInfo> getStories() { return stories; }
        public void setStories(List<JiraStoryInfo> stories) { this.stories = stories; }
    }

    public static class ErrorResponse {
        private String message;
        public ErrorResponse() {}
        public ErrorResponse(String message) { this.message = message; }
        public String getMessage() { return message; }
        public void setMessage(String message) { this.message = message; }
    }


    public static class ValidationResponse {
        private boolean connected;
        private String message;
        public ValidationResponse() {}
        public ValidationResponse(boolean connected, String message) {
            this.connected = connected;
            this.message = message;
        }
        public boolean isConnected() { return connected; }
        public void setConnected(boolean connected) { this.connected = connected; }
        public String getMessage() { return message; }
        public void setMessage(String message) { this.message = message; }
    }


    public static class BatchResult {
        private String issueKey;
        private boolean success;
        private String error;
        private TestCaseResponse response;
        public BatchResult() {}
        public BatchResult(String issueKey, boolean success, String error, TestCaseResponse response) {
            this.issueKey = issueKey;
            this.success = success;
            this.error = error;
            this.response = response;
        }
        public String getIssueKey() { return issueKey; }
        public void setIssueKey(String issueKey) { this.issueKey = issueKey; }
        public boolean isSuccess() { return success; }
        public void setSuccess(boolean success) { this.success = success; }
        public String getError() { return error; }
        public void setError(String error) { this.error = error; }
        public TestCaseResponse getResponse() { return response; }
        public void setResponse(TestCaseResponse response) { this.response = response; }
    }


    public static class BatchResponse {
        private List<BatchResult> results;
        public BatchResponse() {}
        public BatchResponse(List<BatchResult> results) { this.results = results; }
        public List<BatchResult> getResults() { return results; }
        public void setResults(List<BatchResult> results) { this.results = results; }
    }
}
