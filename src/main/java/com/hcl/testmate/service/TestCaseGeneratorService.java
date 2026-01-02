package com.hcl.testmate.service;

import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.hcl.testmate.model.JiraStoryRequest;
import com.hcl.testmate.model.TestCase;
import com.hcl.testmate.model.TestCaseResponse;

/**
 * Core service for generating test cases from JIRA stories
 */
@Service
public class TestCaseGeneratorService {
    private static final Logger log = LoggerFactory.getLogger(TestCaseGeneratorService.class);

    private final HclCafeAiService aiService;
    private final CsvGeneratorService csvGeneratorService;
    private final AnalyticsService analyticsService;
    private final ObjectMapper objectMapper;

    public TestCaseGeneratorService(HclCafeAiService aiService, CsvGeneratorService csvGeneratorService, 
                                   AnalyticsService analyticsService, ObjectMapper objectMapper) {
        this.aiService = aiService;
        this.csvGeneratorService = csvGeneratorService;
        this.analyticsService = analyticsService;
        this.objectMapper = objectMapper;
    }

    public TestCaseResponse generateTestCases(JiraStoryRequest request) {
        try {
            log.info("Starting test case generation process");
            log.debug("Input data - User Story: {}, AC: {}, BR: {}", 
                request.getUserStory() != null ? "Present (" + request.getUserStory().length() + " chars)" : "Not provided",
                request.getAcceptanceCriteria() != null ? "Present (" + request.getAcceptanceCriteria().length() + " chars)" : "Not provided",
                request.getBusinessRules() != null ? "Present (" + request.getBusinessRules().length() + " chars)" : "Not provided");

            // Step 1: Validate the story (relaxed: log warning but do not block)
            log.debug("Step 1: Validating story content...");
            String validationResult = validateStory(request);
            if (!validationResult.equals("VALID")) {
                log.warn("Validation did not pass: {}. Proceeding to generate test cases anyway.", validationResult);
            } else {
                log.debug("Story validation passed");
            }

            // Step 2: Generate test cases using AI
            log.debug("Step 2: Generating test cases with AI service...");
            List<TestCase> testCases = new ArrayList<>();
            
            try {
                testCases = generateTestCasesWithAi(request);
                log.info("AI service returned {} test cases", testCases != null ? testCases.size() : 0);
            } catch (Exception e) {
                log.warn("AI service failed, falling back to template-based generation: {}", e.getMessage());
                testCases = generateFallbackTestCases(request);
                log.info("Fallback generation returned {} test cases", testCases.size());
            }
            
            // Ensure we have at least some test cases
            if (testCases == null || testCases.isEmpty()) {
                log.warn("No test cases generated, creating default test cases");
                testCases = generateDefaultTestCases(request);
            }

            // Step 3: Remove duplicates
            log.debug("Step 3: Removing duplicate test cases...");
            List<TestCase> uniqueTestCases = removeDuplicates(testCases);
            log.debug("After deduplication: {} unique test cases", uniqueTestCases.size());
            testCases = removeDuplicates(testCases);

            // Step 4: Generate CSV
            log.debug("Step 4: Generating CSV content...");
            String csvContent = csvGeneratorService.generateCsv(testCases);
            log.debug("CSV content generated successfully (length: {} chars)", csvContent != null ? csvContent.length() : 0);

            log.info("Successfully generated {} test cases", testCases.size());
            
            // Track analytics
            try {
                String userIdentifier = "user@sarb.co.za"; // In real app, get from security context
                String storyType = "manual";
                analyticsService.trackTestCaseGeneration(testCases.size(), userIdentifier, storyType);
                log.debug("Analytics tracked for {} test cases", testCases.size());
            } catch (Exception e) {
                log.warn("Failed to track analytics: {}", e.getMessage());
            }
            
            log.debug("Step 5: Creating response object...");
            TestCaseResponse response = TestCaseResponse.builder()
                    .success(true)
                    .testCases(testCases)
                    .csvContent(csvContent)
                    .totalTestCases(testCases.size())
                    .message("Successfully generated " + testCases.size() + " test cases")
                    .build();
                    
            return response;

        } catch (Exception e) {
            log.error("Error generating test cases", e);
            return TestCaseResponse.builder()
                    .success(false)
                    .message("Error generating test cases: " + e.getMessage())
                    .testCases(new ArrayList<>())
                    .totalTestCases(0)
                    .build();
        }
    }

    private String validateStory(JiraStoryRequest request) {
        try {
            String systemMessage = buildValidationSystemMessage();
            String userMessage = buildValidationUserMessage(request);

            String response = aiService.sendChatRequest(userMessage, systemMessage);

            // Check if validation passed
            if (response.contains("VALID") || response.contains("valid")) {
                return "VALID";
            } else {
                return response;
            }
        } catch (Exception e) {
            log.error("Error validating story", e);
            return "Error during validation: " + e.getMessage();
        }
    }

    private List<TestCase> generateTestCasesWithAi(JiraStoryRequest request) throws Exception {
        log.info("Generating test cases using AI service...");
        
        String systemMessage = buildTestCaseGenerationSystemMessage();
        String userMessage = buildTestCaseGenerationUserMessage(request);
        
        log.debug("System message length: {} chars", systemMessage.length());
        log.debug("User message length: {} chars", userMessage.length());
        log.debug("User message content: {}", userMessage);
        
        try {
            log.info("Sending request to AI service...");
            String response = aiService.sendChatRequest(userMessage, systemMessage);
            log.info("AI service response received (length: {} chars)", response != null ? response.length() : 0);
            log.debug("AI service response: {}", response);
            
            if (response == null || response.trim().isEmpty()) {
                throw new RuntimeException("AI service returned empty response");
            }
            
            List<TestCase> testCases = parseTestCasesFromResponse(response);
            log.info("Successfully parsed {} test cases from AI response", testCases.size());
            return testCases;
            
        } catch (Exception e) {
            log.error("Failed to generate test cases with AI service", e);
            throw new RuntimeException("AI service error: " + e.getMessage(), e);
        }
    }

    private String buildValidationSystemMessage() {
        return """
            You are a Senior QA Engineer reviewing JIRA stories for completeness.
            
            Your task is to validate if the provided JIRA story has:
            1. Clear User Story
            2. Well-defined Acceptance Criteria
            3. Business Rules (if applicable)
            
            If any critical information is missing or ambiguous, respond with specific questions to clarify.
            If everything is clear and complete, respond with exactly: "VALID"
            
            Be strict in your validation - if acceptance criteria are vague or missing, ask for clarification.
            """;
    }

    private String buildValidationUserMessage(JiraStoryRequest request) {
        StringBuilder message = new StringBuilder();
        message.append("User Story: ").append(request.getUserStory()).append("\n");
        if (request.getAcceptanceCriteria() != null && !request.getAcceptanceCriteria().isEmpty()) {
            message.append("Acceptance Criteria: ").append(request.getAcceptanceCriteria()).append("\n");
        }
        if (request.getBusinessRules() != null && !request.getBusinessRules().isEmpty()) {
            message.append("Business Rules: ").append(request.getBusinessRules()).append("\n");
        }
        if (request.getAssumptions() != null && !request.getAssumptions().isEmpty()) {
            message.append("Assumptions: ").append(request.getAssumptions()).append("\n");
        }
        if (request.getConstraints() != null && !request.getConstraints().isEmpty()) {
            message.append("Constraints: ").append(request.getConstraints()).append("\n");
        }
        if (request.getAdditionalNotes() != null && !request.getAdditionalNotes().isEmpty()) {
            message.append("Additional Notes: ").append(request.getAdditionalNotes()).append("\n");
        }
        return message.toString();
    }

    private String buildTestCaseGenerationSystemMessage() {
        return """
            You are an expert QA Test Case Generator. Generate focused, essential test cases based on the provided user story, acceptance criteria, and business rules.
            
            INSTRUCTIONS:
            1. Analyze the user story, acceptance criteria, and business rules to understand the core functionality
            2. Generate ONLY the most critical and essential test cases - prioritize quality over quantity
            3. Focus on key positive scenarios and important negative/edge cases
            4. Test case IDs should follow format: TC-001, TC-002, etc.
            5. Limit to maximum 8 test cases total to avoid over-generation
            6. Include only high-priority scenarios that cover the main business value
            7. Avoid redundant or trivial test cases
            
            RESPONSE FORMAT - Return ONLY a valid JSON array:
            [
              {
                "testCaseId": "TC-001",
                "testScenario": "Descriptive test scenario for core functionality",
                "preconditions": "Required setup conditions",
                "testSteps": "1. Step one\n2. Step two\n3. Step three",
                "expectedResult": "Expected outcome of the test",
                "priority": "High",
                "testType": "Positive"
              }
            ]
            
            GUIDELINES:
            - Return ONLY the JSON array, no additional text
            - Generate fewer, high-value test cases rather than many trivial ones
            - Focus on core business functionality and critical paths
            - Include both positive and negative scenarios only for essential cases
            - Ensure test cases are practical and cover key requirements
            - Maximum 8 test cases - prioritize the most important scenarios
            """;
    }

    private String buildTestCaseGenerationUserMessage(JiraStoryRequest request) {
        StringBuilder message = new StringBuilder();
        message.append("Please generate focused, essential test cases for the following requirements. Focus on quality over quantity - maximum 8 test cases:\n\n");
        
        message.append("**User Story:**\n").append(request.getUserStory()).append("\n\n");
        
        if (request.getAcceptanceCriteria() != null && !request.getAcceptanceCriteria().isEmpty()) {
            message.append("**Acceptance Criteria:**\n").append(request.getAcceptanceCriteria()).append("\n\n");
        }
        
        if (request.getBusinessRules() != null && !request.getBusinessRules().isEmpty()) {
            message.append("**Business Rules:**\n");
            message.append(request.getBusinessRules()).append("\n\n");
        }
        
        if (request.getAssumptions() != null && !request.getAssumptions().isEmpty()) {
            message.append("**Assumptions:**\n").append(request.getAssumptions()).append("\n\n");
        }
        if (request.getConstraints() != null && !request.getConstraints().isEmpty()) {
            message.append("**Constraints:**\n").append(request.getConstraints()).append("\n\n");
        }
        if (request.getAdditionalNotes() != null && !request.getAdditionalNotes().isEmpty()) {
            message.append("**Additional Notes:**\n").append(request.getAdditionalNotes()).append("\n\n");
        }
        
        message.append("Generate only the most critical test cases that cover core functionality and essential edge cases. Prioritize quality and business value over comprehensive coverage.");
        return message.toString();
    }

    private List<TestCase> parseTestCasesFromResponse(String response) {
        try {
            log.info("Parsing test cases from AI response...");
            List<TestCase> testCases = new ArrayList<>();

            // Extract JSON array from response
            String jsonArray = extractJsonArray(response);
            log.debug("Extracted JSON array: {}", jsonArray);
            
            if (jsonArray == null || jsonArray.trim().isEmpty()) {
                log.warn("No JSON array found in response");
                return testCases; // Return empty list
            }

            // Parse JSON
            JsonNode rootNode = objectMapper.readTree(jsonArray);
            log.debug("Parsed JSON root node type: {}", rootNode.getNodeType());

            if (rootNode.isArray()) {
                log.info("Processing {} test case nodes from JSON array", rootNode.size());
                for (int i = 0; i < rootNode.size(); i++) {
                    JsonNode node = rootNode.get(i);
                    log.debug("Processing test case node {}: {}", i, node.toString());
                    
                    try {
                        // Safely extract values with null checks
                        String testCaseId = getJsonValue(node, "testCaseId", "TC" + String.format("%03d", i + 1));
                        String testScenario = getJsonValue(node, "testScenario", "Test scenario not provided");
                        String preconditions = getJsonValue(node, "preconditions", "No preconditions specified");
                        String testSteps = getJsonValue(node, "testSteps", "Test steps not provided");
                        String expectedResult = getJsonValue(node, "expectedResult", "Expected result not provided");
                        String priority = getJsonValue(node, "priority", "Medium");
                        String testType = getJsonValue(node, "testType", "Functional");
                        
                        TestCase testCase = TestCase.builder()
                                .testCaseId(testCaseId)
                                .testScenario(testScenario)
                                .preconditions(preconditions)
                                .testSteps(testSteps)
                                .expectedResult(expectedResult)
                                .priority(priority)
                                .testType(testType)
                                .build();
                        testCases.add(testCase);
                        log.debug("Successfully created test case: {}", testCaseId);
                    } catch (Exception e) {
                        log.warn("Failed to parse test case node {}: {}", i, e.getMessage());
                        // Continue with other test cases
                    }
                }
            } else {
                log.warn("Root node is not an array, attempting to parse as single object");
                // Try to parse as a single test case object
                if (rootNode.isObject()) {
                    // Handle single test case object
                    log.warn("Response contains single object instead of array - this might indicate an AI service issue");
                }
            }

            log.info("Successfully parsed {} test cases from response", testCases.size());
            return testCases;
        } catch (Exception e) {
            log.error("Error parsing test cases from response: {}", response, e);
            throw new RuntimeException("Failed to parse test cases: " + e.getMessage(), e);
        }
    }
    
    private String getJsonValue(JsonNode node, String fieldName, String defaultValue) {
        if (node.hasNonNull(fieldName)) {
            String value = node.get(fieldName).asText();
            return (value != null && !value.trim().isEmpty()) ? value : defaultValue;
        }
        return defaultValue;
    }

    private String extractJsonArray(String response) {
        log.debug("Extracting JSON array from AI response...");
        
        // First, check if the response already starts with JSON array
        String trimmedResponse = response.trim();
        if (trimmedResponse.startsWith("[") && trimmedResponse.endsWith("]")) {
            log.debug("Response already starts and ends with JSON array brackets");
            return trimmedResponse;
        }
        
        // Try to find JSON array in the response - multiple patterns
        Pattern[] patterns = {
            // Standard JSON array (no capturing group)
            Pattern.compile("(\\[\\s*\\{.*?\\}\\s*\\])", Pattern.DOTALL),
            // JSON array with complex content (greedy matching)
            Pattern.compile("(\\[(?:[^\\[\\]]|\\{[^}]*\\})*\\])", Pattern.DOTALL),
            // JSON array within code blocks
            Pattern.compile("```(?:json)?\\s*\\n?(\\[.*?\\])\\s*\\n?```", Pattern.DOTALL),
            // JSON array within triple backticks
            Pattern.compile("`{3}[^`]*?\\n?(\\[.*?\\])[^`]*?`{3}", Pattern.DOTALL),
            // JSON array with newlines and spaces - more flexible
            Pattern.compile("(\\[[\\s\\S]*?\\])", Pattern.DOTALL)
        };
        
        for (int i = 0; i < patterns.length; i++) {
            Pattern pattern = patterns[i];
            Matcher matcher = pattern.matcher(response);
            if (matcher.find()) {
                String jsonArray = matcher.group(1);  // All patterns now have group 1
                log.debug("Found JSON array using pattern {}: {}", i, jsonArray.substring(0, Math.min(200, jsonArray.length())));
                return jsonArray;
            }
        }
        
        // If no JSON array found, check if the AI didn't follow instructions
        log.warn("No JSON array found in AI response. AI may not have followed JSON format instructions.");
        log.debug("Full AI response: {}", response);
        
        return null;
    }

    private List<TestCase> removeDuplicates(List<TestCase> testCases) {
        Set<String> seen = new HashSet<>();
        List<TestCase> unique = new ArrayList<>();
        for (TestCase testCase : testCases) {
            String key = testCase.getTestScenario().toLowerCase().trim();
            if (!seen.contains(key)) {
                seen.add(key);
                unique.add(testCase);
            }
        }
        return unique;
    }

    /**
     * Generate fallback test cases when AI service fails - focus on business rules
     */
    private List<TestCase> generateFallbackTestCases(JiraStoryRequest request) {
        log.info("Generating restrictive fallback test cases focused on numbered business rules");
        List<TestCase> testCases = new ArrayList<>();
        int testCaseCounter = 1;
        
        // Generate test cases ONLY for explicitly numbered business rules
        if (request.getBusinessRules() != null && !request.getBusinessRules().isEmpty()) {
            String[] businessRules = extractNumberedBusinessRules(request.getBusinessRules());
            
            // If no numbered rules found, try to extract meaningful rules from JIRA format
            if (businessRules.length == 0) {
                log.info("No numbered business rules found, attempting to extract from JIRA format");
                List<String> jiraRules = extractJiraBusinessRules(request.getBusinessRules());
                if (!jiraRules.isEmpty()) {
                    businessRules = jiraRules.toArray(new String[0]);
                    log.info("Extracted {} business rules from JIRA format", businessRules.length);
                }
            }
            
            // Limit to maximum 5 numbered business rules to prevent over-generation
            int maxRules = Math.min(businessRules.length, 5);
            
            for (int i = 0; i < maxRules; i++) {
                String rule = businessRules[i].trim();
                if (rule.isEmpty() || rule.length() < 10) continue;
                
                // Extract BR number from the rule
                String brNumber = extractBRNumber(rule);
                
                // Generate positive test case for numbered business rule
                TestCase positiveTestCase = TestCase.builder()
                        .testCaseId(String.format("TC-%s", brNumber))
                        .testScenario("Validate Business Rule " + brNumber + " - Positive Scenario")
                        .preconditions("User has required permissions and access to the system")
                        .testSteps(buildRestrictiveTestSteps(rule, brNumber, true))
                        .expectedResult("Business rule " + brNumber + " is correctly enforced")
                        .priority("High")
                        .testType("Positive")
                        .build();
                testCases.add(positiveTestCase);
                
                // Generate negative test case ONLY for validation/format rules
                if (isValidationRule(rule)) {
                    TestCase negativeTestCase = TestCase.builder()
                            .testCaseId(String.format("TC-%s-NEG", brNumber))
                            .testScenario("Validate Business Rule " + brNumber + " - Negative Scenario")
                            .preconditions("User has required permissions and access to the system")
                            .testSteps(buildRestrictiveTestSteps(rule, brNumber, false))
                            .expectedResult("Business rule " + brNumber + " prevents invalid operation with appropriate error")
                            .priority("Medium")
                            .testType("Negative")
                            .build();
                    testCases.add(negativeTestCase);
                }
                
                testCaseCounter++;
            }
        }
        
        // Generate additional test cases for acceptance criteria if available
        if (request.getAcceptanceCriteria() != null && !request.getAcceptanceCriteria().isEmpty()) {
            String[] acceptanceCriteria = request.getAcceptanceCriteria().split("\\n|\\.");
            
            for (String criteria : acceptanceCriteria) {
                criteria = criteria.trim();
                if (criteria.isEmpty() || criteria.length() < 10) continue;
                
                TestCase criteriaTestCase = TestCase.builder()
                        .testCaseId(String.format("TC-AC%02d", testCaseCounter))
                        .testScenario("Validate Acceptance Criteria: " + 
                            (criteria.length() > 80 ? criteria.substring(0, 80) + "..." : criteria))
                        .preconditions("User has required permissions and access to the system")
                        .testSteps(buildAcceptanceCriteriaTestSteps(criteria))
                        .expectedResult("System fully satisfies the acceptance criteria: " + criteria)
                        .priority("Medium")
                        .testType("Functional")
                        .build();
                testCases.add(criteriaTestCase);
                
                testCaseCounter++;
            }
        }
        
        // If no business rules or acceptance criteria, generate basic test cases
        if (testCases.isEmpty()) {
            testCases.addAll(generateDefaultTestCases(request));
        }
        
        log.info("Generated {} business rule-focused fallback test cases", testCases.size());
        return testCases;
    }
    
    private String buildBusinessRuleTestSteps(String rule, boolean isPositiveTest) {
        StringBuilder steps = new StringBuilder();
        String contextArea = extractContextArea(rule);
        
        steps.append("1. Navigate to the ").append(contextArea).append(" in the application\n");
        
        if (isPositiveTest) {
            steps.append("2. Enter valid test data that COMPLIES with the business rule: ").append(rule).append("\n");
            steps.append("3. Perform the required action (submit, save, validate, etc.)\n");
            steps.append("4. Verify that the system accepts the data and processes it correctly\n");
            steps.append("5. Check that no validation errors are displayed\n");
            steps.append("6. Confirm the business rule validation is enforced correctly");
        } else {
            steps.append("2. Enter INVALID test data that VIOLATES the business rule: ").append(rule).append("\n");
            steps.append("3. Attempt to perform the required action (submit, save, validate, etc.)\n");
            steps.append("4. Verify that the system rejects the invalid data\n");
            steps.append("5. Check that appropriate validation error messages are displayed\n");
            steps.append("6. Confirm the system prevents processing of invalid data");
        }
        
        return steps.toString();
    }
    
    private String buildAcceptanceCriteriaTestSteps(String criteria) {
        StringBuilder steps = new StringBuilder();
        steps.append("1. Set up the system state as required for: ").append(criteria).append("\n");
        steps.append("2. Execute the specific functionality related to the acceptance criteria\n");
        steps.append("3. Verify that the system behavior matches the expected criteria\n");
        steps.append("4. Check all relevant outputs and system responses\n");
        steps.append("5. Confirm the acceptance criteria is fully satisfied");
        return steps.toString();
    }
    
    /**
     * Extract business rules from JIRA format
     */
    private List<String> extractJiraBusinessRules(String businessRulesText) {
        List<String> extractedRules = new ArrayList<>();
        String[] lines = businessRulesText.split("\n");
        int ruleNumber = 1;
        
        for (String line : lines) {
            line = line.trim();
            
            // Skip empty lines, headers, and table formatting
            if (line.isEmpty() || line.startsWith("|") || line.contains("---") || 
                line.toLowerCase().contains("business rule no") || 
                line.toLowerCase().contains("description") ||
                line.matches("^[\\s\\|\\-\\*]+$") ||
                line.length() < 5) {
                continue;
            }
            
            // Clean up common JIRA artifacts
            line = line.replaceAll("\\*([^\\*]*)\\*", "$1"); // Remove *text*
            line = line.replaceAll("^[\\-\\*\\s]+", ""); // Remove leading dashes/stars
            
            // Format as numbered business rule if not already numbered
            if (!line.matches(".*\\bBR\\d{3}\\b.*")) {
                String formattedRule = String.format("BR%03d %s", ruleNumber, line);
                extractedRules.add(formattedRule);
                ruleNumber++;
            } else {
                extractedRules.add(line);
            }
        }
        
        log.info("Extracted {} business rules from JIRA format", extractedRules.size());
        return extractedRules;
    }

    private String[] extractNumberedBusinessRules(String businessRulesText) {
        List<String> numberedRules = new ArrayList<>();
        
        // Split by lines and look for BR followed by numbers
        String[] lines = businessRulesText.split("\n");
        
        for (String line : lines) {
            line = line.trim();
            // Look for patterns like BR001, BR1, BR 001, etc.
            if (line.matches(".*BR\\s*\\d+.*") && line.length() > 15) {
                numberedRules.add(line);
            }
        }
        
        // If no numbered rules found, try alternative patterns
        if (numberedRules.isEmpty()) {
            for (String line : lines) {
                line = line.trim();
                // Look for "Business Rule No" or numbered lists
                if ((line.contains("Business Rule") || line.matches("^\\d+\\..*")) && line.length() > 15) {
                    numberedRules.add(line);
                }
            }
        }
        
        log.info("Extracted {} numbered business rules from {} total lines", numberedRules.size(), lines.length);
        return numberedRules.toArray(new String[0]);
    }
    
    private String extractBRNumber(String rule) {
        // Extract BR number from patterns like BR001, BR1, etc.
        if (rule.matches(".*BR\\s*(\\d+).*")) {
            java.util.regex.Pattern pattern = java.util.regex.Pattern.compile("BR\\s*(\\d+)");
            java.util.regex.Matcher matcher = pattern.matcher(rule);
            if (matcher.find()) {
                return "BR" + String.format("%02d", Integer.parseInt(matcher.group(1)));
            }
        }
        
        // Extract from numbered lists like "1. ", "2. ", etc.
        if (rule.matches("^\\d+\\..*")) {
            java.util.regex.Pattern pattern = java.util.regex.Pattern.compile("^(\\d+)\\.");
            java.util.regex.Matcher matcher = pattern.matcher(rule);
            if (matcher.find()) {
                return "BR" + String.format("%02d", Integer.parseInt(matcher.group(1)));
            }
        }
        
        return "BR01"; // Default fallback
    }
    
    private boolean isValidationRule(String rule) {
        String lowerRule = rule.toLowerCase();
        return lowerRule.contains("format") || 
               lowerRule.contains("validate") || 
               lowerRule.contains("required") || 
               lowerRule.contains("number") ||
               lowerRule.contains("pattern") ||
               lowerRule.contains("length");
    }
    
    private String buildRestrictiveTestSteps(String rule, String brNumber, boolean isPositiveTest) {
        StringBuilder steps = new StringBuilder();
        
        steps.append("1. Access the relevant system functionality\n");
        
        if (isPositiveTest) {
            steps.append("2. Enter data that complies with ").append(brNumber).append("\n");
            steps.append("3. Execute the required business operation\n");
            steps.append("4. Verify that ").append(brNumber).append(" is correctly enforced");
        } else {
            steps.append("2. Enter data that violates ").append(brNumber).append("\n");
            steps.append("3. Attempt to execute the business operation\n");
            steps.append("4. Verify that ").append(brNumber).append(" prevents the invalid operation");
        }
        
        return steps.toString();
    }
    
    private String extractContextArea(String text) {
        // Extract key terms that might indicate what screen/form this relates to
        if (text.toLowerCase().contains("submission") || text.toLowerCase().contains("submit")) {
            return "submission form";
        } else if (text.toLowerCase().contains("format") || text.toLowerCase().contains("number")) {
            return "data entry field";
        } else if (text.toLowerCase().contains("save") || text.toLowerCase().contains("draft")) {
            return "save functionality screen";
        } else if (text.toLowerCase().contains("treasury") || text.toLowerCase().contains("outsourcing")) {
            return "treasury outsourcing screen";
        } else {
            return "relevant application screen";
        }
    }
    
    private List<TestCase> generateDefaultTestCases(JiraStoryRequest request) {
        List<TestCase> defaultCases = new ArrayList<>();
        String storyTitle = request.getUserStory() != null ? request.getUserStory() : "JIRA Story";
        
        // Generate basic positive test case
        defaultCases.add(TestCase.builder()
                .testCaseId("TC001")
                .testScenario("Verify " + extractMainAction(storyTitle) + " with valid data")
                .preconditions("User is logged in and has necessary permissions")
                .testSteps("1. Navigate to the form/page\n2. Enter valid data in all required fields\n3. Submit the form")
                .expectedResult("Operation completes successfully with confirmation message")
                .priority("High")
                .testType("Positive")
                .build());
        
        // Generate basic negative test case
        defaultCases.add(TestCase.builder()
                .testCaseId("TC002")
                .testScenario("Verify " + extractMainAction(storyTitle) + " with invalid/empty data")
                .preconditions("User is logged in and has necessary permissions")
                .testSteps("1. Navigate to the form/page\n2. Leave required fields empty or enter invalid data\n3. Attempt to submit")
                .expectedResult("Appropriate error messages are displayed and submission is prevented")
                .priority("High")
                .testType("Negative")
                .build());
        
        return defaultCases;
    }
    /**
     * Extract main action from user story for test case generation
     */
    private String extractMainAction(String userStory) {
        if (userStory == null) return "operation";
        
        String lower = userStory.toLowerCase();
        if (lower.contains("submit")) return "submission";
        if (lower.contains("create")) return "creation";
        if (lower.contains("edit")) return "editing";
        if (lower.contains("delete")) return "deletion";
        if (lower.contains("save")) return "save operation";
        if (lower.contains("update")) return "update";
        
        return "operation";
    }

    public String handleChatQuery(String userQuery) {
        log.info("Handling chat query");

        try {
            String systemPrompt = """
                You are TestMate AI, a helpful QA assistant. You help users with:
                
                1. Questions about test case generation and QA best practices
                2. Writing better JIRA stories and acceptance criteria
                3. Understanding testing strategies (positive, negative, validation, error scenarios)
                4. Test coverage and scenario suggestions
                5. General QA and software testing guidance
                
                Provide clear, concise, and helpful answers. If the question is about test cases
                that were just generated, acknowledge the context. Be friendly and professional.
                
                Keep responses focused and practical. Use bullet points when listing items.
                """;
            String response = aiService.sendChatMessage(systemPrompt, userQuery);

            return response;

        } catch (Exception e) {
            log.error("Error handling chat query", e);
            return "I apologize, but I encountered an error processing your question. Please try asking in a different way.";
        }
    }
}
// Removed duplicate method and extraneous code after class
