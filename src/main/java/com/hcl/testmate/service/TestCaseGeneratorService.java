package com.hcl.testmate.service;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
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
    
    // Cache to store test cases by JIRA story key for consistency across modules
    private final Map<String, TestCaseResponse> testCaseCache = new HashMap<>();

    private final HclCafeAiService aiService;
    private final CsvGeneratorService csvGeneratorService;
    private final AnalyticsService analyticsService;
    private final WorkflowService workflowService;
    private final ObjectMapper objectMapper;

    public TestCaseGeneratorService(HclCafeAiService aiService, CsvGeneratorService csvGeneratorService, 
                                   AnalyticsService analyticsService, WorkflowService workflowService,
                                   ObjectMapper objectMapper) {
        this.aiService = aiService;
        this.csvGeneratorService = csvGeneratorService;
        this.analyticsService = analyticsService;
        this.workflowService = workflowService;
        this.objectMapper = objectMapper;
    }

    public TestCaseResponse generateTestCases(JiraStoryRequest request) {
        return generateTestCases(request, false);
    }
    
    /**
     * Generate test cases with option to bypass cache
     * @param request The JIRA story request
     * @param bypassCache If true, ignores cached results and generates fresh test cases
     * @return TestCaseResponse with generated test cases
     */
    public TestCaseResponse generateTestCases(JiraStoryRequest request, boolean bypassCache) {
        try {
            log.info("Starting test case generation process (bypass cache: {})", bypassCache);
            log.debug("Input data - User Story: {}, AC: {}, BR: {}", 
                request.getUserStory() != null ? "Present (" + request.getUserStory().length() + " chars)" : "Not provided",
                request.getAcceptanceCriteria() != null ? "Present (" + request.getAcceptanceCriteria().length() + " chars)" : "Not provided",
                request.getBusinessRules() != null ? "Present (" + request.getBusinessRules().length() + " chars)" : "Not provided");

            // Extract JIRA story key if present in user story
            String jiraKey = extractJiraKey(request.getUserStory());
            log.debug("Extracted JIRA key: {}", jiraKey);
            
            // Determine workflow type from JIRA key or user story content
            String workflowType = determineWorkflowType(jiraKey, request.getUserStory());
            log.info("Determined workflow type: {} for story: {}", 
                workflowType != null ? workflowType : "default (VS4)", 
                request.getUserStory() != null && request.getUserStory().length() > 50 
                    ? request.getUserStory().substring(0, 50) + "..." 
                    : request.getUserStory());
            
            // Check cache if JIRA key is found and cache is not bypassed
            if (!bypassCache && jiraKey != null && testCaseCache.containsKey(jiraKey)) {
                log.info("Found cached test cases for JIRA story: {}", jiraKey);
                TestCaseResponse cachedResponse = testCaseCache.get(jiraKey);
                // Return a copy to prevent modification of cached data
                TestCaseResponse response = TestCaseResponse.builder()
                    .success(cachedResponse.isSuccess())
                    .testCases(new ArrayList<>(cachedResponse.getTestCases()))
                    .csvContent(cachedResponse.getCsvContent())
                    .totalTestCases(cachedResponse.getTotalTestCases())
                    .message(cachedResponse.getMessage() + " (from cache)")
                    .jiraIssueKey(cachedResponse.getJiraIssueKey())
                    .jiraProject(cachedResponse.getJiraProject())
                    .jiraSummary(cachedResponse.getJiraSummary())
                    .extractedContent(cachedResponse.getExtractedContent())
                    .build();
                return response;
            }
            
            // If bypassing cache, clear it for this JIRA key
            if (bypassCache && jiraKey != null && testCaseCache.containsKey(jiraKey)) {
                log.info("Bypassing cache - clearing cached test cases for JIRA story: {}", jiraKey);
                testCaseCache.remove(jiraKey);
            }

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
                testCases = generateTestCasesWithAi(request, workflowType);
                log.info("AI service returned {} test cases", testCases != null ? testCases.size() : 0);
            } catch (Exception e) {
                log.warn("AI service failed, falling back to template-based generation: {}", e.getMessage());
                testCases = generateFallbackTestCases(request, workflowType);
                log.info("Fallback generation returned {} test cases", testCases.size());
            }
            
            // Ensure we have at least some test cases
            if (testCases == null || testCases.isEmpty()) {
                log.warn("No test cases generated, creating default test cases");
                testCases = generateDefaultTestCases(request, workflowType);
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
            
            // Cache the response if JIRA key is present and not bypassing cache
            if (!bypassCache && jiraKey != null) {
                log.info("Caching test cases for JIRA story: {}", jiraKey);
                testCaseCache.put(jiraKey, response);
            } else if (bypassCache && jiraKey != null) {
                log.debug("Not caching test cases for JIRA story {} (cache bypassed)", jiraKey);
            }
                    
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

    private List<TestCase> generateTestCasesWithAi(JiraStoryRequest request, String workflowType) throws Exception {
        log.info("Generating test cases using AI service with workflow type: {}", workflowType != null ? workflowType : "default");
        
        String systemMessage = buildTestCaseGenerationSystemMessage(workflowType);
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

    private String buildTestCaseGenerationSystemMessage(String workflowType) {
        StringBuilder systemMessage = new StringBuilder();
        
        systemMessage.append("""
            You are an expert QA Test Case Generator. Generate focused, essential test cases based on the provided user story, acceptance criteria, and business rules.
            
            🚨 CRITICAL RULE - ABSOLUTE PRIORITY - NO EXCEPTIONS:
            ═══════════════════════════════════════════════════════════════════════════════
            NEVER EVER include URLs, links, SharePoint paths, or file references in:
            • testScenario field
            • testSteps field
            • expectedResult field
            • preconditions field
            • Any other field
            
            If you see URLs like "https://", "http://", "sharepoint.com", "Documents/", etc. in the user story:
            → IGNORE THEM COMPLETELY
            → Extract ONLY the functional requirement or business purpose
            → Write test scenarios about the FUNCTIONALITY, not the documentation
            
            Example:
            ❌ WRONG: "Validate: https://hclo365-my.sharepoint.com/:x:/r/personal/..."
            ✅ CORRECT: "Verify user can access and validate the data report"
            
            ❌ WRONG: "See Documents/AD Data file for requirements"
            ✅ CORRECT: "Verify AD data validation functionality"
            ═══════════════════════════════════════════════════════════════════════════════
            """);
        
        // Add workflow context based on detected workflow type
        String effectiveWorkflowType = workflowType;
        
        // If workflowType is provided and available, use it; otherwise use default
        if (effectiveWorkflowType != null && workflowService.isWorkflowAvailable(effectiveWorkflowType)) {
            systemMessage.append("\n");
            systemMessage.append(String.format("IMPORTANT: %s Application Workflow Documentation is provided below. Use this workflow to generate accurate and context-aware test steps that align with the actual application behavior.\n\n", effectiveWorkflowType));
            systemMessage.append(String.format("**APPLICATION WORKFLOW (%s):**\n", effectiveWorkflowType));
            systemMessage.append(workflowService.getWorkflowContent(effectiveWorkflowType));
            systemMessage.append("\n\n");
            
            // Add workflow-specific instructions
            if ("VS2".equals(effectiveWorkflowType) || "VS4".equals(effectiveWorkflowType)) {
                systemMessage.append(String.format("""
                🚨 CRITICAL %s WORKFLOW REQUIREMENT:
                ═══════════════════════════════════════════════════════════════════════════════
                For %s workflow test cases, you MUST specify SSC (Self Service Channel) application in EVERY test case's preconditions and test steps.
                
                MANDATORY Login Step Format for ALL test cases:
                - Preconditions MUST include: "User has access to SSC (Self Service Channel) application"
                - First test step MUST be: "Login to SSC (Self Service Channel) application with valid credentials"
                - Never use generic "Login to application" - ALWAYS specify "SSC (Self Service Channel) application"
                
                Example Preconditions:
                ✅ CORRECT: "User has access to SSC (Self Service Channel) application and has necessary permissions"
                ❌ WRONG: "User has access to the application"
                
                Example First Step:
                ✅ CORRECT: "1. Login to SSC (Self Service Channel) application with valid credentials"
                ❌ WRONG: "1. Login to the application"
                ❌ WRONG: "1. Access the system"
                
                This is NON-NEGOTIABLE for %s workflow - every single test case must explicitly mention SSC (Self Service Channel) application.
                ═══════════════════════════════════════════════════════════════════════════════
                
                """, effectiveWorkflowType, effectiveWorkflowType, effectiveWorkflowType));
            }
            
            systemMessage.append("""
            When generating test steps:
            - CRITICAL: Extract specific entities from the user story (report names, screen names, field names, etc.) and use them in test steps
            - DO NOT use generic placeholders - if the user story mentions "Credit Risk Report", use "Credit Risk Report" NOT "Fit and Proper Report"
            - Use general terminology for actions: instead of "Select 1 declaration" or "Select 2 declaration", use "Select the declaration" or "Select a declaration"
            - Avoid numbering items unless specifically required by the user story
            - Reference the specific workflow steps and screens from the documentation
            - Ensure test steps follow the actual navigation and interaction patterns described
            - Use terminology and field names consistent with the workflow documentation
            - Consider workflow dependencies and prerequisites mentioned in the documentation
            - Adapt the workflow pattern to the specific entities mentioned in the user story
            
            """);
        } else if (workflowService.isWorkflowAvailable()) {
            // Fall back to default workflow
            systemMessage.append("""
            
            IMPORTANT: Application Workflow Documentation is provided below. Use this workflow to generate accurate and context-aware test steps that align with the actual application behavior.
            
            """);
            systemMessage.append("**APPLICATION WORKFLOW:**\n");
            systemMessage.append(workflowService.getWorkflowContent());
            systemMessage.append("\n\n");
            systemMessage.append("""
            When generating test steps:
            - CRITICAL: Extract specific entities from the user story (report names, screen names, field names, etc.) and use them in test steps
            - DO NOT use generic placeholders - if the user story mentions "Credit Risk Report", use "Credit Risk Report" NOT "Fit and Proper Report"
            - Use general terminology for actions: instead of "Select 1 declaration" or "Select 2 declaration", use "Select the declaration" or "Select a declaration"
            - Avoid numbering items unless specifically required by the user story
            - Reference the specific workflow steps and screens from the documentation
            - Ensure test steps follow the actual navigation and interaction patterns described
            - Use terminology and field names consistent with the workflow documentation
            - Consider workflow dependencies and prerequisites mentioned in the documentation
            - Adapt the workflow pattern to the specific entities mentioned in the user story
            
            """);
        }
        
        systemMessage.append("""
            INSTRUCTIONS:
            1. FIRST: Carefully read the user story and identify ALL specific entities (report names, screen names, functions, fields, etc.)
            2. USE these specific entities in your test steps - DO NOT substitute with generic examples from the workflow
            3. Analyze the user story, acceptance criteria, and business rules to understand the core functionality
            4. Generate ONLY the most critical and essential test cases - prioritize quality over quantity
            5. Focus on key positive scenarios and important negative/edge cases
            6. Test case IDs should follow format: TC-001, TC-002, etc.
            7. Limit to maximum 8 test cases total to avoid over-generation
            8. Include only high-priority scenarios that cover the main business value
            9. Avoid redundant or trivial test cases
            10. If application workflow is provided, use it as a TEMPLATE but replace generic examples with specific details from the user story
            
            🚨 CRITICAL REQUIREMENT - DETAILED TEST STEPS FOR ALL TEST CASES:
            ═══════════════════════════════════════════════════════════════════════════════
            EVERY SINGLE TEST CASE must have detailed, specific, step-by-step instructions.
            
            ❌ FORBIDDEN - Generic/lazy test steps like:
            "Follow the steps mentioned in the first test case"
            "Same steps as TC-001"
            "Standard validation steps"
            "Navigate and verify"
            
            ✅ REQUIRED - Each test case MUST have complete, detailed steps like:
            "1. Login to the application
            2. Navigate to Reports > Credit Risk
            3. Select 'Generate Monthly Report' option
            4. Enter the reporting period (start date and end date)
            5. Click 'Generate' button
            6. Verify the report is generated successfully"
            
            EVERY test case must be fully detailed and independent. DO NOT reference other test cases.
            Each testSteps field must contain 5-10 specific numbered steps minimum.
            ═══════════════════════════════════════════════════════════════════════════════
            
            RESPONSE FORMAT - Return ONLY a valid JSON array:
            [
              {
                "testCaseId": "TC-001",
                "testScenario": "Clear business scenario - NEVER include URLs or file paths",
                "toValidate": "To validate [functionality] - NO URLs",
                "preconditions": "Setup conditions - NO URLs",
                "testSteps": "1. Detailed action step\n2. Next specific step\n3. Another clear step\n4. Continue with details\n5. Verify expected behavior - NO URLs in steps (minimum 5-10 steps)",
                "expectedResult": "Expected outcome - NO URLs",
                "priority": "High",
                "testType": "Positive"
              }
            ]
            
            🚨 FORBIDDEN in testScenario, testSteps, expectedResult (ZERO TOLERANCE):
            ❌ https:// or http://
            ❌ sharepoint.com or any domain
            ❌ Documents/ or file paths
            ❌ .xlsx, .docx, .pdf file references
            
            ✅ CORRECT testScenario examples:
            "Verify user can generate monthly report"
            "Validate data import functionality"
            "Verify error handling for invalid inputs"
            
            GUIDELINES:
            - Return ONLY the JSON array, no additional text
            - ALWAYS include the "toValidate" field with a clear, concise statement describing what aspect of the functionality this test validates
            - The "toValidate" should start with "To validate that..." or "To verify that..." and explain the purpose/goal of the test
            - Generate fewer, high-value test cases rather than many trivial ones
            - Focus on core business functionality and critical paths
            - Include both positive and negative scenarios only for essential cases
            - Ensure test cases are practical and cover key requirements
            - Maximum 8 test cases - prioritize the most important scenarios
            - When workflow documentation is available, use it as a pattern/template but ALWAYS use the specific entities mentioned in the user story
            - NEVER use generic examples from workflow if the user story provides specific details (e.g., if story mentions "Monthly Sales Report", use that, not "Fit and Proper Report")
            - 🚨 CRITICAL: Write complete, detailed test steps (5-10 steps) for EVERY SINGLE test case - TC-001, TC-002, TC-003, ALL of them
            - 🚨 NEVER write generic steps or reference other test cases - each test case must stand alone with full details
            - Each testSteps field should read like a complete instruction manual that anyone can follow without any additional context
            """);
            
        return systemMessage.toString();
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
                        String toValidate = getJsonValue(node, "toValidate", "To validate the functionality");
                        String preconditions = getJsonValue(node, "preconditions", "No preconditions specified");
                        String testSteps = getJsonValue(node, "testSteps", "Test steps not provided");
                        String expectedResult = getJsonValue(node, "expectedResult", "Expected result not provided");
                        String priority = getJsonValue(node, "priority", "Medium");
                        String testType = getJsonValue(node, "testType", "Functional");
                        
                        TestCase testCase = TestCase.builder()
                                .testCaseId(testCaseId)
                                .testScenario(testScenario)
                                .toValidate(toValidate)
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
     * Generate fallback test cases when AI service fails - intelligent content-based generation
     * Priority: ALL Business Rules must be covered first, then Acceptance Criteria, max 8 TC total
     */
    private List<TestCase> generateFallbackTestCases(JiraStoryRequest request, String workflowType) {
        log.info("Generating fallback test cases - Priority: ALL Business Rules + Acceptance Criteria (max 8 TC) for workflow: {}", workflowType);
        List<TestCase> testCases = new ArrayList<>();
        
        String userStory = request.getUserStory() != null ? request.getUserStory() : "";
        String acceptanceCriteria = request.getAcceptanceCriteria() != null ? request.getAcceptanceCriteria() : "";
        String businessRules = request.getBusinessRules() != null ? request.getBusinessRules() : "";
        
        int testCaseCounter = 1;
        
        // Determine preconditions based on workflow type
        String basePreconditions;
        if ("VS2".equals(workflowType) || "VS4".equals(workflowType)) {
            basePreconditions = "User has access to SSC (Self Service Channel) application and has necessary permissions to perform the required operations";
        } else {
            basePreconditions = "User has logged into the application and has necessary permissions to perform the required operations";
        }
        
        // Analyze the full content to understand the functionality
        ContentAnalysis analysis = analyzeContent(userStory, acceptanceCriteria, businessRules);
        
        // Override preconditions with workflow-specific ones
        analysis.preconditions = basePreconditions;
        
        // PRIORITY 1: Generate test cases for ALL business rules (must be covered completely)
        if (!analysis.parsedBusinessRules.isEmpty()) {
            log.info("Covering {} business rules", analysis.parsedBusinessRules.size());
            for (ParsedBusinessRule rule : analysis.parsedBusinessRules) {
                if (testCaseCounter > 8) {
                    log.warn("Reached max 8 test cases while processing business rules. {} rules may not be covered.", 
                            analysis.parsedBusinessRules.size() - (testCaseCounter - 1));
                    break;
                }
                
                testCases.add(TestCase.builder()
                        .testCaseId(String.format("TC-%03d", testCaseCounter++))
                        .testScenario(rule.testScenario)
                        .preconditions(analysis.preconditions)
                        .testSteps(prependLoginStep(rule.testSteps, workflowType))
                        .expectedResult(rule.expectedResult)
                        .priority("High")
                        .testType(rule.isValidationRule ? "Negative" : "Positive")
                        .build());
            }
        }
        
        // PRIORITY 2: Generate test cases for acceptance criteria (fill remaining slots)
        if (testCaseCounter <= 8 && !analysis.parsedAcceptanceCriteria.isEmpty()) {
            log.info("Adding acceptance criteria test cases to fill remaining slots");
            for (ParsedAcceptanceCriterion criterion : analysis.parsedAcceptanceCriteria) {
                if (testCaseCounter > 8) break;
                
                testCases.add(TestCase.builder()
                        .testCaseId(String.format("TC-%03d", testCaseCounter++))
                        .testScenario(criterion.testScenario)
                        .preconditions(analysis.preconditions)
                        .testSteps(prependLoginStep(criterion.testSteps, workflowType))
                        .expectedResult(criterion.expectedResult)
                        .priority("High")
                        .testType("Positive")
                        .build());
            }
        }
        
        // PRIORITY 3: If still have slots and no BR/AC, add main functionality test
        if (testCases.isEmpty()) {
            testCases.add(TestCase.builder()
                    .testCaseId(String.format("TC-%03d", testCaseCounter++))
                    .testScenario(analysis.mainFunctionalityScenario)
                    .preconditions(analysis.preconditions)
                    .testSteps(prependLoginStep(analysis.mainPositiveSteps, workflowType))
                    .expectedResult(analysis.mainPositiveExpectedResult)
                    .priority("High")
                    .testType("Positive")
                    .build());
        }
        
        // PRIORITY 4: Fill remaining slots with negative test cases if space available
        if (testCaseCounter <= 8) {
            testCases.add(TestCase.builder()
                    .testCaseId(String.format("TC-%03d", testCaseCounter++))
                    .testScenario(analysis.mandatoryFieldsScenario)
                    .preconditions(analysis.preconditions)
                    .testSteps(prependLoginStep(analysis.mandatoryFieldsSteps, workflowType))
                    .expectedResult("System prevents submission and displays appropriate validation error messages for each missing mandatory field")
                    .priority("High")
                    .testType("Negative")
                    .build());
        }
        
        if (testCaseCounter <= 8) {
            testCases.add(TestCase.builder()
                    .testCaseId(String.format("TC-%03d", testCaseCounter++))
                    .testScenario(analysis.invalidDataScenario)
                    .preconditions(analysis.preconditions)
                    .testSteps(prependLoginStep(analysis.invalidDataSteps, workflowType))
                    .expectedResult("System validates input and displays appropriate error messages for invalid data")
                    .priority("High")
                    .testType("Negative")
                    .build());
        }
        
        // PRIORITY 5: Fill any remaining slots with view/retrieve operations or exclusions
        if (testCaseCounter <= 8 && analysis.hasViewOperation) {
            testCases.add(TestCase.builder()
                    .testCaseId(String.format("TC-%03d", testCaseCounter++))
                    .testScenario(analysis.viewScenario)
                    .preconditions(analysis.viewPreconditions)
                    .testSteps(prependLoginStep(analysis.viewSteps, workflowType))
                    .expectedResult(analysis.viewExpectedResult)
                    .priority("Medium")
                    .testType("Positive")
                    .build());
        }
        
        if (testCaseCounter <= 8 && !analysis.exclusions.isEmpty()) {
            for (String exclusion : analysis.exclusions) {
                if (testCaseCounter > 8) break;
                
                testCases.add(TestCase.builder()
                        .testCaseId(String.format("TC-%03d", testCaseCounter++))
                        .testScenario("Verify that " + exclusion + " is properly excluded/restricted")
                        .preconditions(analysis.preconditions)
                        .testSteps(prependLoginStep("1. Attempt to proceed with " + exclusion + "\n2. Verify system prevents the action\n3. Check appropriate error/warning message is displayed", workflowType))
                        .expectedResult("System blocks the operation and displays message indicating " + exclusion + " is not allowed")
                        .priority("High")
                        .testType("Negative")
                        .build());
            }
        }
        
        // Ensure exactly 8 test cases (pad with edge cases if needed)
        while (testCases.size() < 8 && !analysis.edgeCases.isEmpty() && testCases.size() - (8 - analysis.edgeCases.size()) < analysis.edgeCases.size()) {
            int edgeCaseIndex = testCases.size() - (8 - analysis.edgeCases.size());
            if (edgeCaseIndex >= 0 && edgeCaseIndex < analysis.edgeCases.size()) {
                String edgeCase = analysis.edgeCases.get(edgeCaseIndex);
                testCases.add(TestCase.builder()
                        .testCaseId(String.format("TC-%03d", testCaseCounter++))
                        .testScenario("Verify " + edgeCase)
                        .preconditions(analysis.preconditions)
                        .testSteps(prependLoginStep("1. Set up " + edgeCase + " scenario\n2. Execute the operation\n3. Verify system handles it correctly", workflowType))
                        .expectedResult("System processes " + edgeCase + " appropriately without errors")
                        .priority("Medium")
                        .testType("Functional")
                        .build());
            } else {
                break;
            }
        }
        
        log.info("Generated {} test cases: {} BR-based, {} AC-based, {} other", 
                testCases.size(), 
                analysis.parsedBusinessRules.size(),
                Math.min(analysis.parsedAcceptanceCriteria.size(), 8 - analysis.parsedBusinessRules.size()),
                testCases.size() - analysis.parsedBusinessRules.size() - Math.min(analysis.parsedAcceptanceCriteria.size(), 8 - analysis.parsedBusinessRules.size()));
        return testCases;
    }
    
    /**
     * Prepend workflow-specific login step to test steps
     */
    private String prependLoginStep(String testSteps, String workflowType) {
        if (testSteps == null || testSteps.isEmpty()) {
            testSteps = "";
        }
        
        String loginPrefix;
        if ("VS2".equals(workflowType) || "VS4".equals(workflowType)) {
            loginPrefix = "1. Login to SSC (Self Service Channel) application with valid credentials\n";
        } else {
            loginPrefix = "1. Login to the application with valid credentials\n";
        }
        
        // Check if test steps already start with login
        String lowerSteps = testSteps.toLowerCase();
        if (lowerSteps.startsWith("1. login") || lowerSteps.contains("login to")) {
            // Already has login, just update if needed for SSC
            if (("VS2".equals(workflowType) || "VS4".equals(workflowType)) && !lowerSteps.contains("ssc")) {
                // Replace generic login with SSC-specific login
                testSteps = testSteps.replaceFirst("(?i)1\\.\\s*Login to (the )?application", 
                    "1. Login to SSC (Self Service Channel) application");
            }
            return testSteps;
        }
        
        // Renumber existing steps and prepend login
        String[] lines = testSteps.split("\n");
        StringBuilder result = new StringBuilder(loginPrefix);
        
        for (String line : lines) {
            String trimmedLine = line.trim();
            if (trimmedLine.isEmpty()) continue;
            
            // Check if line starts with a number
            if (trimmedLine.matches("^\\d+\\..*")) {
                // Extract the number and content
                int dotIndex = trimmedLine.indexOf('.');
                try {
                    int stepNumber = Integer.parseInt(trimmedLine.substring(0, dotIndex).trim());
                    String content = trimmedLine.substring(dotIndex + 1).trim();
                    result.append(stepNumber + 1).append(". ").append(content).append("\n");
                } catch (NumberFormatException e) {
                    // If parsing fails, just append the line as is
                    result.append(trimmedLine).append("\n");
                }
            } else {
                // Not a numbered step, append as is
                result.append(trimmedLine).append("\n");
            }
        }
        
        return result.toString().trim();
    }
    
    /**
     * Analyze the complete content to extract meaningful test scenarios
     */
    private ContentAnalysis analyzeContent(String userStory, String acceptanceCriteria, String businessRules) {
        ContentAnalysis analysis = new ContentAnalysis();
        
        String fullContent = userStory + " " + acceptanceCriteria + " " + businessRules;
        String lowerContent = fullContent.toLowerCase();
        
        // Determine main action and entity
        String mainAction = extractDetailedAction(userStory);
        String mainEntity = extractMainEntity(userStory);
        
        // Build preconditions based on content
        analysis.preconditions = buildIntelligentPreconditions(fullContent);
        
        // Build main functionality scenario
        analysis.mainFunctionalityScenario = buildMainScenario(userStory, mainAction, mainEntity);
        analysis.mainPositiveSteps = buildDetailedSteps(userStory, mainAction, mainEntity, true);
        analysis.mainPositiveExpectedResult = buildExpectedResult(userStory, mainAction, mainEntity);
        
        // Parse business rules intelligently
        analysis.parsedBusinessRules = parseBusinessRules(businessRules);
        
        // Parse acceptance criteria
        analysis.parsedAcceptanceCriteria = parseAcceptanceCriteria(acceptanceCriteria, mainAction, mainEntity);
        
        // Build negative test scenarios
        analysis.mandatoryFieldsScenario = "Attempt to " + mainAction + " with missing mandatory fields";
        analysis.mandatoryFieldsSteps = "1. Navigate to the " + mainAction + " page\n2. Leave one or more mandatory fields blank\n3. Attempt to submit";
        
        analysis.invalidDataScenario = "Attempt to " + mainAction + " with invalid data";
        analysis.invalidDataSteps = "1. Navigate to the " + mainAction + " page\n2. Enter invalid data in input fields\n3. Attempt to submit";
        
        // Check for view operations
        analysis.hasViewOperation = lowerContent.contains("view") || lowerContent.contains("display") || lowerContent.contains("retrieve");
        if (analysis.hasViewOperation) {
            analysis.viewScenario = "View/Retrieve " + mainEntity + " details";
            analysis.viewPreconditions = "At least one " + mainEntity + " exists in the system";
            analysis.viewSteps = "1. Navigate to the view page\n2. Search for or select a " + mainEntity + "\n3. View the details";
            analysis.viewExpectedResult = "All " + mainEntity + " details are displayed accurately including " + extractKeyFields(fullContent);
        }
        
        // Extract exclusions/restrictions
        analysis.exclusions = extractExclusions(fullContent);
        
        // Identify edge cases from content
        analysis.edgeCases = identifyEdgeCases(fullContent, mainAction, mainEntity);
        
        return analysis;
    }
    
    /**
     * Parse business rules into structured test scenarios
     */
    private List<ParsedBusinessRule> parseBusinessRules(String businessRules) {
        List<ParsedBusinessRule> rules = new ArrayList<>();
        if (businessRules == null || businessRules.trim().isEmpty()) return rules;
        
        String[] lines = businessRules.split("\\n|\\|");
        for (String line : lines) {
            line = line.trim();
            if (line.length() < 10) continue;
            
            // Skip headers and formatting
            if (line.toLowerCase().contains("business rule") && line.toLowerCase().contains("description")) continue;
            if (line.matches("^[\\s\\-\\*\\|]+$")) continue;
            
            ParsedBusinessRule rule = new ParsedBusinessRule();
            
            // Extract BR number if present
            if (line.matches(".*BR\\s*\\d+.*")) {
                String brNum = line.replaceAll(".*?(BR\\s*\\d+).*", "$1").replace(" ", "");
                rule.ruleNumber = brNum;
            }
            
            // Determine if it's a validation/format rule
            rule.isValidationRule = line.toLowerCase().contains("format") || 
                                    line.toLowerCase().contains("must") ||
                                    line.toLowerCase().contains("required") ||
                                    line.toLowerCase().contains("validation");
            
            // Build test scenario
            String cleanRule = line.replaceAll("^BR\\s*\\d+\\s*[-:]*\\s*", "");
            rule.testScenario = "Validate: " + truncate(cleanRule, 100);
            
            // Build test steps based on rule type
            if (rule.isValidationRule) {
                rule.testSteps = "1. Prepare test data that complies with: " + truncate(cleanRule, 80) + 
                               "\n2. Submit the data\n3. Verify successful validation\n4. Confirm the rule is enforced correctly";
                rule.expectedResult = "Data validation succeeds and " + truncate(cleanRule, 80) + " is correctly enforced";
            } else {
                rule.testSteps = "1. Access the relevant functionality\n2. Verify that " + truncate(cleanRule, 80) + 
                               "\n3. Confirm the business rule is applied\n4. Validate the outcome";
                rule.expectedResult = "Business rule is correctly implemented: " + truncate(cleanRule, 100);
            }
            
            rules.add(rule);
            // No limit - ALL business rules must be covered
        }
        
        return rules;
    }
    
    /**
     * Parse acceptance criteria into test scenarios
     */
    private List<ParsedAcceptanceCriterion> parseAcceptanceCriteria(String acceptanceCriteria, String mainAction, String mainEntity) {
        List<ParsedAcceptanceCriterion> criteria = new ArrayList<>();
        if (acceptanceCriteria == null || acceptanceCriteria.trim().isEmpty()) return criteria;
        
        String[] lines = acceptanceCriteria.split("\\n");
        for (String line : lines) {
            line = line.trim();
            if (line.length() < 15) continue;
            
            // Skip headers
            if (line.toLowerCase().contains("acceptance criteria") && line.length() < 30) continue;
            
            ParsedAcceptanceCriterion criterion = new ParsedAcceptanceCriterion();
            
            // Clean up formatting markers
            String cleanCriterion = line.replaceAll("^[-\\*\\d\\.\\)]+\\s*", "")
                                       .replaceAll("^(Given|When|Then|And)\\s*", "");
            
            criterion.testScenario = "Verify: " + truncate(cleanCriterion, 100);
            criterion.testSteps = "1. Set up: " + truncate(cleanCriterion, 60) + 
                                "\n2. Execute the " + mainAction + " operation\n3. Verify the outcome matches the criterion\n4. Validate all aspects of the acceptance criterion";
            criterion.expectedResult = "Acceptance criterion is met: " + truncate(cleanCriterion, 100);
            
            criteria.add(criterion);
            // No limit on AC - will be constrained by max 8 TC total in main generation logic
        }
        
        return criteria;
    }
    
    /**
     * Extract more detailed action from user story
     */
    private String extractDetailedAction(String userStory) {
        if (userStory == null || userStory.isEmpty()) return "perform operation";
        
        String lower = userStory.toLowerCase();
        
        // Check for compound actions
        if (lower.contains("submit") && lower.contains("request")) return "submit request";
        if (lower.contains("add") && lower.contains("new")) return "add new record";
        if (lower.contains("save") && lower.contains("draft")) return "save as draft";
        if (lower.contains("view") && lower.contains("capture") && lower.contains("submit")) return "view, capture and submit";
        
        // Single actions
        if (lower.contains("submit")) return "submit";
        if (lower.contains("create")) return "create";
        if (lower.contains("add")) return "add";
        if (lower.contains("update") || lower.contains("edit")) return "update";
        if (lower.contains("delete") || lower.contains("remove")) return "delete";
        if (lower.contains("save")) return "save";
        if (lower.contains("view") || lower.contains("display")) return "view";
        if (lower.contains("search") || lower.contains("find")) return "search";
        if (lower.contains("approve")) return "approve";
        if (lower.contains("reject")) return "reject";
        if (lower.contains("cancel")) return "cancel";
        if (lower.contains("process")) return "process";
        
        return "perform operation";
    }
    
    /**
     * Build intelligent preconditions based on content
     */
    private String buildIntelligentPreconditions(String fullContent) {
        String lower = fullContent.toLowerCase();
        StringBuilder preconditions = new StringBuilder("User is authenticated");
        
        if (lower.contains("permission") || lower.contains("authorized") || lower.contains("access")) {
            preconditions.append(" and has necessary permissions");
        }
        
        if (lower.contains("dealer") || lower.contains("broker") || lower.contains("company")) {
            preconditions.append(", relevant entities exist in the system");
        }
        
        return preconditions.toString();
    }
    
    /**
     * Build main scenario description
     */
    private String buildMainScenario(String userStory, String mainAction, String mainEntity) {
        // Try to extract more context from the user story
        if (userStory.contains("|")) {
            String[] parts = userStory.split("\\|");
            for (String part : parts) {
                part = part.trim();
                if (part.length() > 10 && !part.matches("^[A-Z0-9\\-]+$") && !part.matches(".*\\d{4}.*")) {
                    return "Verify " + part.toLowerCase() + " - successful scenario";
                }
            }
        }
        
        return "Verify " + mainAction + " for " + mainEntity + " - successful scenario";
    }
    
    /**
     * Build detailed test steps
     */
    private String buildDetailedSteps(String userStory, String mainAction, String mainEntity, boolean isPositive) {
        StringBuilder steps = new StringBuilder();
        String lower = userStory.toLowerCase();
        
        steps.append("1. Navigate to the ").append(mainAction).append(" page\n");
        
        if (isPositive) {
            steps.append("2. Enter all required information for ").append(mainEntity).append("\n");
            
            if (lower.contains("select") || lower.contains("choose")) {
                steps.append("3. Select appropriate options from dropdowns\n");
                steps.append("4. Click Submit/Save\n");
            } else {
                steps.append("3. Click Submit/Save\n");
            }
        } else {
            steps.append("2. Enter invalid or incomplete information\n");
            steps.append("3. Attempt to submit\n");
        }
        
        return steps.toString();
    }
    
    /**
     * Build expected result
     */
    private String buildExpectedResult(String userStory, String mainAction, String mainEntity) {
        String lower = userStory.toLowerCase();
        
        if (lower.contains("submission number") || lower.contains("confirmation")) {
            return "Operation completes successfully with confirmation message and valid submission number displayed";
        }
        
        return "The " + mainAction + " operation for " + mainEntity + " completes successfully and confirmation is displayed";
    }
    
    /**
     * Extract key fields mentioned in content
     */
    private String extractKeyFields(String content) {
        List<String> fields = new ArrayList<>();
        String lower = content.toLowerCase();
        
        if (lower.contains("submission number")) fields.add("submission number");
        if (lower.contains("status")) fields.add("status");
        if (lower.contains("date")) fields.add("date");
        if (lower.contains("name")) fields.add("name");
        if (lower.contains("type")) fields.add("type");
        
        return fields.isEmpty() ? "all required fields" : String.join(", ", fields);
    }
    
    /**
     * Extract exclusions/restrictions
     */
    private List<String> extractExclusions(String content) {
        List<String> exclusions = new ArrayList<>();
        String lower = content.toLowerCase();
        
        if (lower.contains("excluding")) {
            if (lower.contains("interbank broker")) exclusions.add("interbank brokers");
            if (lower.contains("excluding") && lower.contains("company")) {
                String[] words = content.split("excluding");
                if (words.length > 1) {
                    String exclusionPart = words[1].split("[,\\.\\n]")[0].trim();
                    if (exclusionPart.length() > 5 && exclusionPart.length() < 100) {
                        exclusions.add(exclusionPart);
                    }
                }
            }
        }
        
        if (lower.contains("must not") || lower.contains("cannot") || lower.contains("prohibited")) {
            if (lower.contains("without")) {
                exclusions.add("operations without required entities");
            }
        }
        
        return exclusions;
    }
    
    /**
     * Identify edge cases from content
     */
    private List<String> identifyEdgeCases(String content, String mainAction, String mainEntity) {
        List<String> edgeCases = new ArrayList<>();
        String lower = content.toLowerCase();
        
        if (lower.contains("status")) {
            edgeCases.add(mainAction + " with different status values (Active/Inactive)");
        }
        
        if (lower.contains("mandatory") || lower.contains("required")) {
            edgeCases.add("boundary testing for mandatory fields");
        }
        
        if (lower.contains("format")) {
            edgeCases.add("format validation with edge case data");
        }
        
        return edgeCases;
    }
    
    // Inner classes for structured parsing
    private static class ContentAnalysis {
        String preconditions = "";
        String mainFunctionalityScenario = "";
        String mainPositiveSteps = "";
        String mainPositiveExpectedResult = "";
        String mandatoryFieldsScenario = "";
        String mandatoryFieldsSteps = "";
        String invalidDataScenario = "";
        String invalidDataSteps = "";
        String viewScenario = "";
        String viewPreconditions = "";
        String viewSteps = "";
        String viewExpectedResult = "";
        boolean hasViewOperation = false;
        List<ParsedBusinessRule> parsedBusinessRules = new ArrayList<>();
        List<ParsedAcceptanceCriterion> parsedAcceptanceCriteria = new ArrayList<>();
        List<String> exclusions = new ArrayList<>();
        List<String> edgeCases = new ArrayList<>();
    }
    
    private static class ParsedBusinessRule {
        String ruleNumber = "";
        String testScenario = "";
        String testSteps = "";
        String expectedResult = "";
        boolean isValidationRule = false;
    }
    
    private static class ParsedAcceptanceCriterion {
        String testScenario = "";
        String testSteps = "";
        String expectedResult = "";
    }
    
    private String extractMainAction(String userStory) {
        if (userStory == null || userStory.isEmpty()) return "perform the operation";
        
        String story = userStory.toLowerCase();
        if (story.contains("submit")) return "submit request";
        if (story.contains("create")) return "create record";
        if (story.contains("update")) return "update record";
        if (story.contains("delete")) return "delete record";
        if (story.contains("view")) return "view details";
        if (story.contains("search")) return "search records";
        if (story.contains("approve")) return "approve request";
        if (story.contains("reject")) return "reject request";
        if (story.contains("process")) return "process transaction";
        if (story.contains("upload")) return "upload file";
        if (story.contains("download")) return "download file";
        if (story.contains("generate")) return "generate report";
        
        return "perform the operation";
    }
    
    private String extractMainEntity(String userStory) {
        if (userStory == null || userStory.isEmpty()) return "record";
        
        String story = userStory.toLowerCase();
        if (story.contains("authorised dealer") || story.contains("authorized dealer")) return "Authorised Dealer";
        if (story.contains("treasury")) return "Treasury record";
        if (story.contains("outsourcing")) return "Outsourcing Company";
        if (story.contains("broker")) return "Broker";
        if (story.contains("customer")) return "Customer";
        if (story.contains("user")) return "User";
        if (story.contains("account")) return "Account";
        if (story.contains("transaction")) return "Transaction";
        if (story.contains("request")) return "Request";
        if (story.contains("application")) return "Application";
        if (story.contains("report")) return "Report";
        
        return "record";
    }
    
    private String truncate(String text, int maxLength) {
        if (text == null) return "";
        text = text.trim();
        if (text.length() <= maxLength) return text;
        return text.substring(0, maxLength - 3) + "...";
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
    
    private List<TestCase> generateDefaultTestCases(JiraStoryRequest request, String workflowType) {
        List<TestCase> defaultCases = new ArrayList<>();
        String storyTitle = request.getUserStory() != null ? request.getUserStory() : "JIRA Story";
        
        String preconditions;
        if ("VS2".equals(workflowType) || "VS4".equals(workflowType)) {
            preconditions = "User has access to SSC (Self Service Channel) application and has necessary permissions";
        } else {
            preconditions = "User is logged in and has necessary permissions";
        }
        
        // Generate basic positive test case
        defaultCases.add(TestCase.builder()
                .testCaseId("TC001")
                .testScenario("Verify " + extractMainAction(storyTitle) + " with valid data")
                .toValidate("To validate that " + extractMainAction(storyTitle) + " works correctly with valid inputs")
                .preconditions(preconditions)
                .testSteps(prependLoginStep("1. Navigate to the form/page\n2. Enter valid data in all required fields\n3. Submit the form", workflowType))
                .expectedResult("Operation completes successfully with confirmation message")
                .priority("High")
                .testType("Positive")
                .build());
        
        // Generate basic negative test case
        defaultCases.add(TestCase.builder()
                .testCaseId("TC002")
                .testScenario("Verify " + extractMainAction(storyTitle) + " with invalid/empty data")
                .toValidate("To validate that the system properly handles invalid or missing input data")
                .preconditions(preconditions)
                .testSteps(prependLoginStep("1. Navigate to the form/page\n2. Leave required fields empty or enter invalid data\n3. Attempt to submit", workflowType))
                .expectedResult("Appropriate error messages are displayed and submission is prevented")
                .priority("High")
                .testType("Negative")
                .build());
        
        return defaultCases;
    }

    public String handleChatQuery(String userQuery) {
        log.info("Handling chat query");

        try {
            String currentDateTime = java.time.LocalDateTime.now()
                .format(java.time.format.DateTimeFormatter.ofPattern("EEEE, MMMM d, yyyy 'at' h:mm a"));
            
            String systemPrompt = String.format("""
                You are TestMate AI, a helpful QA assistant. 
                
                IMPORTANT: The current date and time is %s
                
                You help users with:
                
                1. Questions about test case generation and QA best practices
                2. Writing better JIRA stories and acceptance criteria
                3. Understanding testing strategies (positive, negative, validation, error scenarios)
                4. Test coverage and scenario suggestions
                5. General QA and software testing guidance
                
                Provide clear, concise, and helpful answers. If the question is about test cases
                that were just generated, acknowledge the context. Be friendly and professional.
                
                Keep responses focused and practical. Use bullet points when listing items.
                """, currentDateTime);
            String response = aiService.sendChatMessage(systemPrompt, userQuery);

            return response;

        } catch (Exception e) {
            log.error("Error handling chat query", e);
            return "I apologize, but I encountered an error processing your question. Please try asking in a different way.";
        }
    }
    
    /**
     * Extract JIRA story key from user story text
     * Looks for patterns like [R2CX-7237] or R2CX-7237
     */
    private String extractJiraKey(String userStory) {
        if (userStory == null || userStory.isEmpty()) {
            return null;
        }
        
        // Pattern to match JIRA keys like R2CX-7237, PROJ-123, etc.
        Pattern pattern = Pattern.compile("\\[?([A-Z][A-Z0-9]+-\\d+)\\]?");
        Matcher matcher = pattern.matcher(userStory);
        
        if (matcher.find()) {
            String jiraKey = matcher.group(1);
            log.debug("Extracted JIRA key: {}", jiraKey);
            return jiraKey;
        }
        
        log.debug("No JIRA key found in user story");
        return null;
    }
    
    /**
     * Determine the appropriate workflow type based on JIRA key or user story content
     * When fetching from JIRA, the userStory contains [key] summary + description,
     * so this will detect VS2/VS4 from the JIRA description automatically.
     * 
     * @param jiraKey - JIRA story key (e.g., R2CX-7237)
     * @param userStory - user story text (includes JIRA description when fetched from JIRA)
     * @return workflow type (VS2, VS4, or null if cannot be determined)
     */
    private String determineWorkflowType(String jiraKey, String userStory) {
        log.debug("Determining workflow type - JIRA Key: {}, User Story length: {}", 
            jiraKey, userStory != null ? userStory.length() : 0);
        
        // First try to determine from JIRA key
        if (jiraKey != null) {
            String workflowType = workflowService.determineWorkflowType(jiraKey);
            if (workflowType != null) {
                log.info("Workflow type determined from JIRA key: {}", workflowType);
                return workflowType;
            }
        }
        
        // Then try to determine from user story content (includes JIRA summary + description)
        if (userStory != null) {
            String workflowType = workflowService.determineWorkflowTypeFromStory(userStory);
            if (workflowType != null) {
                log.info("Workflow type determined from user story content: {}", workflowType);
                return workflowType;
            }
        }
        
        // Default to null (system will use default workflow - VS4)
        log.debug("No specific workflow type detected, will use default (VS4)");
        return null;
    }
    
    /**
     * Generate smart locator suggestions using AI
     */
    public com.hcl.testmate.controller.TestCaseController.LocatorResponse generateLocatorSuggestions(
            com.hcl.testmate.controller.TestCaseController.LocatorRequest request) throws Exception {
        
        log.info("Generating locator suggestions for: {}", request.getElementName());
        
        String prompt = buildLocatorPrompt(request);
        String aiResponse = aiService.sendChatRequest(prompt);
        
        log.debug("AI response for locators: {}", aiResponse);
        
        return parseLocatorResponse(aiResponse);
    }
    
    private String buildLocatorPrompt(com.hcl.testmate.controller.TestCaseController.LocatorRequest request) {
        StringBuilder prompt = new StringBuilder();
        prompt.append("As a test automation expert, suggest the best locator strategies for this element:\n\n");
        
        if (request.getElementName() != null && !request.getElementName().isEmpty()) {
            prompt.append("Element Name: ").append(request.getElementName()).append("\n");
        }
        if (request.getElementType() != null && !request.getElementType().isEmpty()) {
            prompt.append("Element Type: ").append(request.getElementType()).append("\n");
        }
        if (request.getElementText() != null && !request.getElementText().isEmpty()) {
            prompt.append("Element Text: ").append(request.getElementText()).append("\n");
        }
        if (request.getElementId() != null && !request.getElementId().isEmpty()) {
            prompt.append("Element ID: ").append(request.getElementId()).append("\n");
        }
        if (request.getElementClass() != null && !request.getElementClass().isEmpty()) {
            prompt.append("Element Class: ").append(request.getElementClass()).append("\n");
        }
        if (request.getParentElement() != null && !request.getParentElement().isEmpty()) {
            prompt.append("Parent Element: ").append(request.getParentElement()).append("\n");
        }
        if (request.getContext() != null && !request.getContext().isEmpty()) {
            prompt.append("Context: ").append(request.getContext()).append("\n");
        }
        
        prompt.append("\nProvide locator suggestions in JSON format with this structure:\n");
        prompt.append("{\n");
        prompt.append("  \"suggestions\": [\n");
        prompt.append("    {\n");
        prompt.append("      \"strategy\": \"ID\",\n");
        prompt.append("      \"locator\": \"elementId\",\n");
        prompt.append("      \"priority\": \"High\",\n");
        prompt.append("      \"reason\": \"Most reliable and fast\",\n");
        prompt.append("      \"example\": \"By.id(\\\"elementId\\\")\",\n");
        prompt.append("      \"reliabilityScore\": 10,\n");
        prompt.append("      \"seleniumJavaCode\": \"driver.findElement(By.id(\\\"elementId\\\")).click();\",\n");
        prompt.append("      \"seleniumWaitCode\": \"new WebDriverWait(driver, Duration.ofSeconds(10)).until(ExpectedConditions.elementToBeClickable(By.id(\\\"elementId\\\")));\"\n");
        prompt.append("    }\n");
        prompt.append("  ],\n");
        prompt.append("  \"bestPractice\": \"Use ID when available as it's the most reliable...\"\n");
        prompt.append("}\n\n");
        prompt.append("IMPORTANT REQUIREMENTS:\n");
        prompt.append("1. Include 'reliabilityScore' (1-10): Rate each locator's stability, performance, and maintainability\n");
        prompt.append("   - 9-10: Highly reliable (ID, unique attributes)\n");
        prompt.append("   - 6-8: Moderately reliable (CSS with classes, name attributes)\n");
        prompt.append("   - 1-5: Less reliable (complex XPath, brittle selectors)\n");
        prompt.append("2. Include 'seleniumJavaCode': Complete Selenium Java code snippet for interaction\n");
        prompt.append("3. Include 'seleniumWaitCode': WebDriverWait code for explicit waits\n");
        prompt.append("4. For 'locator' field: Provide just the locator value (e.g., 'elementId' not '#elementId')\n");
        prompt.append("5. For 'example' field: Provide Selenium By locator (e.g., 'By.id(\"elementId\")')\n");
        prompt.append("\nInclude strategies: ID, CSS Selector, XPath, Name, Class, Link Text, Partial Link Text.\n");
        prompt.append("Priority levels: High, Medium, Low.\n");
        prompt.append("Provide 3-5 suggestions ordered by priority.\n");
        
        return prompt.toString();
    }
    
    private com.hcl.testmate.controller.TestCaseController.LocatorResponse parseLocatorResponse(String aiResponse) {
        try {
            // Extract JSON from response
            String jsonContent = aiResponse;
            if (aiResponse.contains("```json")) {
                int startIndex = aiResponse.indexOf("```json") + 7;
                int endIndex = aiResponse.indexOf("```", startIndex);
                if (endIndex > startIndex) {
                    jsonContent = aiResponse.substring(startIndex, endIndex).trim();
                }
            } else if (aiResponse.contains("```")) {
                int startIndex = aiResponse.indexOf("```") + 3;
                int endIndex = aiResponse.indexOf("```", startIndex);
                if (endIndex > startIndex) {
                    jsonContent = aiResponse.substring(startIndex, endIndex).trim();
                }
            }
            
            JsonNode rootNode = objectMapper.readTree(jsonContent);
            
            List<com.hcl.testmate.controller.TestCaseController.LocatorSuggestion> suggestions = new ArrayList<>();
            JsonNode suggestionsNode = rootNode.get("suggestions");
            
            if (suggestionsNode != null && suggestionsNode.isArray()) {
                for (JsonNode node : suggestionsNode) {
                    com.hcl.testmate.controller.TestCaseController.LocatorSuggestion suggestion = 
                        new com.hcl.testmate.controller.TestCaseController.LocatorSuggestion(
                            node.has("strategy") ? node.get("strategy").asText() : "",
                            node.has("locator") ? node.get("locator").asText() : "",
                            node.has("priority") ? node.get("priority").asText() : "Medium",
                            node.has("reason") ? node.get("reason").asText() : "",
                            node.has("example") ? node.get("example").asText() : ""
                        );
                    
                    // Set additional fields
                    if (node.has("reliabilityScore")) {
                        suggestion.setReliabilityScore(node.get("reliabilityScore").asInt());
                    }
                    if (node.has("seleniumJavaCode")) {
                        suggestion.setSeleniumJavaCode(node.get("seleniumJavaCode").asText());
                    }
                    if (node.has("seleniumWaitCode")) {
                        suggestion.setSeleniumWaitCode(node.get("seleniumWaitCode").asText());
                    }
                    
                    suggestions.add(suggestion);
                }
            }
            
            String bestPractice = rootNode.has("bestPractice") ? 
                rootNode.get("bestPractice").asText() : "Use the most stable and maintainable locator strategy.";
            
            return new com.hcl.testmate.controller.TestCaseController.LocatorResponse(suggestions, bestPractice);
            
        } catch (Exception e) {
            log.error("Error parsing locator response", e);
            // Return default suggestions
            return createDefaultLocatorSuggestions();
        }
    }
    
    private com.hcl.testmate.controller.TestCaseController.LocatorResponse createDefaultLocatorSuggestions() {
        List<com.hcl.testmate.controller.TestCaseController.LocatorSuggestion> suggestions = new ArrayList<>();
        
        com.hcl.testmate.controller.TestCaseController.LocatorSuggestion idSuggestion = 
            new com.hcl.testmate.controller.TestCaseController.LocatorSuggestion(
                "ID", 
                "elementId", 
                "High", 
                "Most reliable and fastest locator strategy. IDs are unique and rarely change.",
                "By.id(\"elementId\")"
            );
        idSuggestion.setReliabilityScore(10);
        idSuggestion.setSeleniumJavaCode("driver.findElement(By.id(\"elementId\")).click();");
        idSuggestion.setSeleniumWaitCode("new WebDriverWait(driver, Duration.ofSeconds(10)).until(ExpectedConditions.elementToBeClickable(By.id(\"elementId\")));");
        suggestions.add(idSuggestion);
        
        com.hcl.testmate.controller.TestCaseController.LocatorSuggestion cssSuggestion = 
            new com.hcl.testmate.controller.TestCaseController.LocatorSuggestion(
                "CSS Selector", 
                ".className", 
                "Medium", 
                "Fast and flexible for styling-based selection. Good for elements with unique classes.",
                "By.cssSelector(\".className\")"
            );
        cssSuggestion.setReliabilityScore(7);
        cssSuggestion.setSeleniumJavaCode("driver.findElement(By.cssSelector(\".className\")).sendKeys(\"text\");");
        cssSuggestion.setSeleniumWaitCode("new WebDriverWait(driver, Duration.ofSeconds(10)).until(ExpectedConditions.visibilityOfElementLocated(By.cssSelector(\".className\")));");
        suggestions.add(cssSuggestion);
        
        com.hcl.testmate.controller.TestCaseController.LocatorSuggestion xpathSuggestion = 
            new com.hcl.testmate.controller.TestCaseController.LocatorSuggestion(
                "XPath", 
                "//button[text()='Submit']", 
                "Low", 
                "Use as last resort. Can be brittle and slow. Prone to breaking with UI changes.",
                "By.xpath(\"//button[text()='Submit']\")"
            );
        xpathSuggestion.setReliabilityScore(4);
        xpathSuggestion.setSeleniumJavaCode("driver.findElement(By.xpath(\"//button[text()='Submit']\")).click();");
        xpathSuggestion.setSeleniumWaitCode("new WebDriverWait(driver, Duration.ofSeconds(10)).until(ExpectedConditions.presenceOfElementLocated(By.xpath(\"//button[text()='Submit']\")));");
        suggestions.add(xpathSuggestion);
        
        return new com.hcl.testmate.controller.TestCaseController.LocatorResponse(
            suggestions, 
            "Always prefer ID when available (Score: 9-10). Use CSS selectors for flexibility (Score: 6-8). Avoid XPath unless necessary (Score: 1-5). Choose locators with reliability scores of 7 or higher for production tests."
        );
    }
    
    /**
     * Clear cache for a specific JIRA story key
     * @param jiraKey The JIRA story key to clear from cache
     */
    public void clearCache(String jiraKey) {
        if (jiraKey != null && testCaseCache.containsKey(jiraKey)) {
            log.info("Clearing cache for JIRA story: {}", jiraKey);
            testCaseCache.remove(jiraKey);
        }
    }
    
    /**
     * Clear all cached test cases
     */
    public void clearAllCache() {
        log.info("Clearing all cached test cases ({} items)", testCaseCache.size());
        testCaseCache.clear();
    }
    
    /**
     * Get cache statistics
     * @return Map with cache statistics
     */
    public Map<String, Object> getCacheStatistics() {
        Map<String, Object> stats = new HashMap<>();
        stats.put("cachedStories", testCaseCache.size());
        stats.put("cachedKeys", new ArrayList<>(testCaseCache.keySet()));
        return stats;
    }
}
// Removed duplicate method and extraneous code after class
