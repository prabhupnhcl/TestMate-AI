package com.hcl.testmate.controller;

import com.hcl.testmate.model.JiraStoryRequest;
import com.hcl.testmate.model.MultiDocumentResponse;
import com.hcl.testmate.model.ReviewRequest;
import com.hcl.testmate.model.TestCaseResponse;
import com.hcl.testmate.service.DocumentParserService;
import com.hcl.testmate.service.EmailService;
import com.hcl.testmate.service.TestCaseGeneratorService;
import jakarta.mail.MessagingException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import jakarta.validation.Valid;
import java.util.ArrayList;
import java.util.List;

/**
 * REST Controller for test case generation
 */
@RestController
@RequestMapping("/api/testcases")

@Validated
public class TestCaseController {
    private static final Logger log = LoggerFactory.getLogger(TestCaseController.class);
    private final TestCaseGeneratorService testCaseGeneratorService;
    private final DocumentParserService documentParserService;
    private final EmailService emailService;

    public TestCaseController(TestCaseGeneratorService testCaseGeneratorService, DocumentParserService documentParserService, EmailService emailService) {
        this.testCaseGeneratorService = testCaseGeneratorService;
        this.documentParserService = documentParserService;
        this.emailService = emailService;
    }
    
    /**
     * Generate test cases from JIRA story
     */
    @PostMapping("/generate")
    public ResponseEntity<TestCaseResponse> generateTestCases(
            @Valid @RequestBody JiraStoryRequest request) {
        
        log.info("Received request to generate test cases");
        
        TestCaseResponse response = testCaseGeneratorService.generateTestCases(request);
        
        if (response.isSuccess()) {
            return ResponseEntity.ok(response);
        } else {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
        }
    }
    
    /**
     * Generate test cases from uploaded Word document(s)
     * Each document is processed separately and returns individual test cases
     */
    @PostMapping("/generate/upload")
    public ResponseEntity<MultiDocumentResponse> generateTestCasesFromDocument(
            @RequestParam("files") List<MultipartFile> files) {
        
        log.info("Received request to generate test cases from {} document(s)", files.size());
        
        // Validate that files were uploaded
        if (files.isEmpty()) {
            MultiDocumentResponse errorResponse = MultiDocumentResponse.builder()
                .success(false)
                .message("No files uploaded. Please select at least one file.")
                .totalDocuments(0)
                .totalTestCases(0)
                .build();
            return ResponseEntity.badRequest().body(errorResponse);
        }
        
        // Validate maximum file count
        if (files.size() > 10) {
            MultiDocumentResponse errorResponse = MultiDocumentResponse.builder()
                    .success(false)
                    .message("Maximum 10 files allowed. You uploaded " + files.size() + " files.")
                    .totalDocuments(0)
                    .totalTestCases(0)
                    .build();
            return ResponseEntity.badRequest().body(errorResponse);
        }
        
        try {
            List<MultiDocumentResponse.DocumentTestCaseResult> documentResults = new ArrayList<>();
            int totalTestCases = 0;
            int successCount = 0;
            
            // Process each file separately
            for (MultipartFile file : files) {
                String fileName = file.getOriginalFilename();
                log.info("Processing document: {}", fileName);
                
                try {
                    // Validate file
                    if (!documentParserService.isValidWordDocument(file)) {
                        MultiDocumentResponse.DocumentTestCaseResult result = 
                                MultiDocumentResponse.DocumentTestCaseResult.builder()
                                        .fileName(fileName)
                                        .success(false)
                                        .errorMessage("Invalid file format. Please upload .doc or .docx files only.")
                                        .build();
                        documentResults.add(result);
                        continue;
                    }
                    
                    // Extract text from document
                    String documentText = documentParserService.extractTextFromDocument(file);
                    
                    // Extract structured sections (User Story, AC, BR)
                    DocumentParserService.DocumentSections sections = 
                            documentParserService.extractSections(documentText);
                    
                        // Create request for this specific document using extracted sections
                        JiraStoryRequest request = JiraStoryRequest.builder()
                            .userStory(sections.getUserStory())
                            .acceptanceCriteria(sections.getAcceptanceCriteria())
                            .businessRules(sections.getBusinessRules())
                            .assumptions("")
                            .constraints("")
                            .additionalNotes("")
                            .build();
                    
                    // Generate test cases for this document
                    TestCaseResponse response = testCaseGeneratorService.generateTestCases(request);
                    
                    // Add extracted sections to response
                    if (response.isSuccess()) {
                        TestCaseResponse.ExtractedContent extractedContent = 
                                TestCaseResponse.ExtractedContent.builder()
                                        .userStory(sections.getUserStory())
                                        .acceptanceCriteria(sections.getAcceptanceCriteria())
                                        .businessRules(sections.getBusinessRules())
                                        .build();
                        response.setExtractedContent(extractedContent);
                        response.setMessage("Successfully generated test cases from " + fileName);
                        
                        totalTestCases += response.getTotalTestCases();
                        successCount++;
                    }
                    
                    // Create result for this document
                    MultiDocumentResponse.DocumentTestCaseResult result = 
                            MultiDocumentResponse.DocumentTestCaseResult.builder()
                                    .fileName(fileName)
                                    .testCaseResponse(response)
                                    .success(response.isSuccess())
                                    .errorMessage(response.isSuccess() ? null : response.getMessage())
                                    .build();
                    
                    documentResults.add(result);
                    log.info("Successfully processed document: {} with {} test cases", 
                            fileName, response.getTotalTestCases());
                    
                } catch (Exception e) {
                    log.error("Error processing document: {}", fileName, e);
                    MultiDocumentResponse.DocumentTestCaseResult result = 
                            MultiDocumentResponse.DocumentTestCaseResult.builder()
                                    .fileName(fileName)
                                    .success(false)
                                    .errorMessage("Error processing document: " + e.getMessage())
                                    .build();
                    documentResults.add(result);
                }
            }
            
            // Build final response
            MultiDocumentResponse finalResponse = MultiDocumentResponse.builder()
                    .documentResults(documentResults)
                    .totalDocuments(files.size())
                    .totalTestCases(totalTestCases)
                    .success(successCount > 0)
                    .message(String.format("Processed %d of %d document(s) successfully. Generated %d test cases total.", 
                            successCount, files.size(), totalTestCases))
                    .build();
            
            return ResponseEntity.ok(finalResponse);
            
        } catch (Exception e) {
            log.error("Error processing documents", e);
            MultiDocumentResponse errorResponse = MultiDocumentResponse.builder()
                    .success(false)
                    .message("Error processing documents: " + e.getMessage())
                    .totalDocuments(0)
                    .totalTestCases(0)
                    .build();
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }
    
    /**
     * Download test cases as CSV file
     */
    @PostMapping("/generate/csv")
    public ResponseEntity<byte[]> generateTestCasesAsCsv(
            @Valid @RequestBody JiraStoryRequest request) {
        
        log.info("Received request to generate test cases as CSV");
        
        TestCaseResponse response = testCaseGeneratorService.generateTestCases(request);
        
        if (!response.isSuccess()) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).build();
        }
        
        byte[] csvBytes = response.getCsvContent().getBytes();
        
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.parseMediaType("text/csv"));
        headers.setContentDispositionFormData("attachment", "test-cases.csv");
        headers.setContentLength(csvBytes.length);
        
        return new ResponseEntity<>(csvBytes, headers, HttpStatus.OK);
    }
    
    /**
     * Health check endpoint
     */
    @GetMapping("/health")
    public ResponseEntity<String> health() {
        return ResponseEntity.ok("TestMate AI is running!");
    }
    
    /**
     * Chat endpoint for Ask Me Anything
     */
    @PostMapping("/chat")
    public ResponseEntity<?> chat(@RequestBody ChatRequest chatRequest) {
        log.info("Received chat request: {}", chatRequest.getMessage());
        
        try {
            String response = testCaseGeneratorService.handleChatQuery(chatRequest.getMessage());
            
            ChatResponse chatResponse = new ChatResponse();
            chatResponse.setResponse(response);
            
            return ResponseEntity.ok(chatResponse);
            
        } catch (Exception e) {
            log.error("Error handling chat request", e);
            ChatResponse errorResponse = new ChatResponse();
            
            // Provide more specific error message based on the exception
            String errorMessage = "I apologize, but I encountered an error processing your question.";
            if (e.getMessage() != null && e.getMessage().contains("401")) {
                errorMessage = "The AI service is currently unavailable due to authentication issues. Please contact the administrator to verify the API key configuration.";
            } else if (e.getMessage() != null && e.getMessage().contains("API")) {
                errorMessage = "Unable to connect to the AI service. Please try again in a moment or contact support.";
            } else {
                errorMessage += " Please try asking in a different way.";
            }
            
            errorResponse.setResponse(errorMessage);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }
    
    /**
     * Generate smart locator suggestions
     */
    @PostMapping("/locators/suggest")
    public ResponseEntity<?> suggestLocators(@RequestBody LocatorRequest request) {
        log.info("Received locator suggestion request for element: {}", request.getElementName());
        
        try {
            LocatorResponse response = testCaseGeneratorService.generateLocatorSuggestions(request);
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            log.error("Error generating locator suggestions", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(new MessageResponse("Failed to generate locator suggestions: " + e.getMessage()));
        }
    }
    
    /**
     * Send review notification email
     */
    @PostMapping("/review/send")
    public ResponseEntity<?> sendReviewNotification(@Valid @RequestBody ReviewRequest request) {
        try {
            log.info("Received review notification request for: {}", request.getCreatorEmail());
            
            emailService.sendReviewNotification(
                request.getReviewerName(),
                request.getCreatorEmail(),
                request.getStatus(),
                request.getComments(),
                request.getTestCaseCount()
            );
            
            return ResponseEntity.ok(new MessageResponse("Review notification sent successfully to " + request.getCreatorEmail()));
        } catch (MessagingException e) {
            log.error("Failed to send email notification", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(new MessageResponse("Failed to send email: " + e.getMessage()));
        } catch (Exception e) {
            log.error("Unexpected error while sending review notification", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(new MessageResponse("An error occurred: " + e.getMessage()));
        }
    }
    
    /**
     * Message response model
     */
    public static class MessageResponse {
        private String message;
        public MessageResponse() {}
        public MessageResponse(String message) { this.message = message; }
        public String getMessage() { return message; }
        public void setMessage(String message) { this.message = message; }
    }
    
    /**
     * Chat request model
     */
    public static class ChatRequest {
        private String message;
        public ChatRequest() {}
        public ChatRequest(String message) { this.message = message; }
        public String getMessage() { return message; }
        public void setMessage(String message) { this.message = message; }
    }
    
    /**
     * Chat response model
     */
    public static class ChatResponse {
        private String response;
        public ChatResponse() {}
        public ChatResponse(String response) { this.response = response; }
        public String getResponse() { return response; }
        public void setResponse(String response) { this.response = response; }
    }
    
    /**
     * Locator request model
     */
    public static class LocatorRequest {
        private String elementName;
        private String elementType;
        private String elementText;
        private String elementId;
        private String elementClass;
        private String parentElement;
        private String context;
        
        public LocatorRequest() {}
        
        public String getElementName() { return elementName; }
        public void setElementName(String elementName) { this.elementName = elementName; }
        public String getElementType() { return elementType; }
        public void setElementType(String elementType) { this.elementType = elementType; }
        public String getElementText() { return elementText; }
        public void setElementText(String elementText) { this.elementText = elementText; }
        public String getElementId() { return elementId; }
        public void setElementId(String elementId) { this.elementId = elementId; }
        public String getElementClass() { return elementClass; }
        public void setElementClass(String elementClass) { this.elementClass = elementClass; }
        public String getParentElement() { return parentElement; }
        public void setParentElement(String parentElement) { this.parentElement = parentElement; }
        public String getContext() { return context; }
        public void setContext(String context) { this.context = context; }
    }
    
    /**
     * Locator response model
     */
    public static class LocatorResponse {
        private List<LocatorSuggestion> suggestions;
        private String bestPractice;
        
        public LocatorResponse() {}
        public LocatorResponse(List<LocatorSuggestion> suggestions, String bestPractice) {
            this.suggestions = suggestions;
            this.bestPractice = bestPractice;
        }
        
        public List<LocatorSuggestion> getSuggestions() { return suggestions; }
        public void setSuggestions(List<LocatorSuggestion> suggestions) { this.suggestions = suggestions; }
        public String getBestPractice() { return bestPractice; }
        public void setBestPractice(String bestPractice) { this.bestPractice = bestPractice; }
    }
    
    /**
     * Locator suggestion model
     */
    public static class LocatorSuggestion {
        private String strategy;
        private String locator;
        private String priority;
        private String reason;
        private String example;
        private Integer reliabilityScore;
        private String seleniumJavaCode;
        private String seleniumWaitCode;
        
        public LocatorSuggestion() {}
        public LocatorSuggestion(String strategy, String locator, String priority, String reason, String example) {
            this.strategy = strategy;
            this.locator = locator;
            this.priority = priority;
            this.reason = reason;
            this.example = example;
        }
        
        public String getStrategy() { return strategy; }
        public void setStrategy(String strategy) { this.strategy = strategy; }
        public String getLocator() { return locator; }
        public void setLocator(String locator) { this.locator = locator; }
        public String getPriority() { return priority; }
        public void setPriority(String priority) { this.priority = priority; }
        public String getReason() { return reason; }
        public void setReason(String reason) { this.reason = reason; }
        public String getExample() { return example; }
        public void setExample(String example) { this.example = example; }
        public Integer getReliabilityScore() { return reliabilityScore; }
        public void setReliabilityScore(Integer reliabilityScore) { this.reliabilityScore = reliabilityScore; }
        public String getSeleniumJavaCode() { return seleniumJavaCode; }
        public void setSeleniumJavaCode(String seleniumJavaCode) { this.seleniumJavaCode = seleniumJavaCode; }
        public String getSeleniumWaitCode() { return seleniumWaitCode; }
        public void setSeleniumWaitCode(String seleniumWaitCode) { this.seleniumWaitCode = seleniumWaitCode; }
    }
}
