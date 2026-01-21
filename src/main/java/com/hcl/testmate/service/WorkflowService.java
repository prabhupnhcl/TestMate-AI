package com.hcl.testmate.service;

import java.io.File;
import java.io.FileInputStream;
import java.io.InputStream;
import java.util.HashMap;
import java.util.Map;

import org.apache.poi.xwpf.extractor.XWPFWordExtractor;
import org.apache.poi.xwpf.usermodel.XWPFDocument;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import jakarta.annotation.PostConstruct;

/**
 * Service for loading and managing application workflow documentation
 * Supports multiple workflows (VS2, VS4, etc.)
 */
@Service
public class WorkflowService {

    private static final Logger log = LoggerFactory.getLogger(WorkflowService.class);
    
    @Value("${workflow.vs4.document.path:Application Workflow for VS4 Functionality.docx}")
    private String vs4WorkflowDocumentPath;
    
    @Value("${workflow.vs2.document.path:VS2 Flow.docx}")
    private String vs2WorkflowDocumentPath;
    
    // Map to store workflow content by workflow type
    private Map<String, String> workflowContents = new HashMap<>();
    private Map<String, Boolean> workflowLoadedStatus = new HashMap<>();
    
    // Legacy support - default workflow
    private String workflowContent;
    private boolean workflowLoaded = false;

    /**
     * Load workflow documents on application startup
     */
    @PostConstruct
    public void loadWorkflowDocument() {
        log.info("Loading application workflow documents...");
        
        // Load VS4 workflow
        loadWorkflowByType("VS4", vs4WorkflowDocumentPath);
        
        // Load VS2 workflow
        loadWorkflowByType("VS2", vs2WorkflowDocumentPath);
        
        // Set default workflow to VS4 for backward compatibility
        if (workflowLoadedStatus.getOrDefault("VS4", false)) {
            workflowContent = workflowContents.get("VS4");
            workflowLoaded = true;
            log.info("Default workflow set to VS4");
        } else if (workflowLoadedStatus.getOrDefault("VS2", false)) {
            workflowContent = workflowContents.get("VS2");
            workflowLoaded = true;
            log.info("Default workflow set to VS2");
        } else {
            workflowLoaded = false;
            log.warn("No workflow documents loaded. Test case generation will proceed without workflow context");
        }
    }
    
    /**
     * Load a specific workflow document by type
     */
    private void loadWorkflowByType(String workflowType, String documentPath) {
        try {
            log.info("Loading {} workflow document from: {}", workflowType, documentPath);
            
            File workflowFile = new File(documentPath);
            
            if (!workflowFile.exists()) {
                log.warn("{} workflow document not found at: {}", workflowType, workflowFile.getAbsolutePath());
                workflowLoadedStatus.put(workflowType, false);
                return;
            }
            
            String content = extractTextFromDocx(new FileInputStream(workflowFile));
            
            if (content != null && !content.trim().isEmpty()) {
                workflowContents.put(workflowType, content);
                workflowLoadedStatus.put(workflowType, true);
                log.info("Successfully loaded {} workflow document ({} characters)", workflowType, content.length());
            } else {
                log.warn("{} workflow document is empty", workflowType);
                workflowLoadedStatus.put(workflowType, false);
            }
            
        } catch (Exception e) {
            log.error("Failed to load {} workflow document: {}", workflowType, e.getMessage());
            workflowLoadedStatus.put(workflowType, false);
        }
    }

    /**
     * Get the workflow content (default workflow for backward compatibility)
     */
    public String getWorkflowContent() {
        if (!workflowLoaded) {
            log.debug("Workflow content requested but not loaded");
            return null;
        }
        return workflowContent;
    }
    
    /**
     * Get workflow content by type (VS2, VS4, etc.)
     */
    public String getWorkflowContent(String workflowType) {
        if (workflowType == null || workflowType.isEmpty()) {
            return getWorkflowContent();
        }
        
        String normalizedType = workflowType.toUpperCase().trim();
        
        if (!workflowLoadedStatus.getOrDefault(normalizedType, false)) {
            log.debug("{} workflow content requested but not loaded", normalizedType);
            return null;
        }
        
        return workflowContents.get(normalizedType);
    }
    
    /**
     * Determine workflow type from JIRA key
     * @param jiraKey - JIRA story key (e.g., R2CX-7237)
     * @return workflow type (VS2, VS4, or null if cannot be determined)
     */
    public String determineWorkflowType(String jiraKey) {
        if (jiraKey == null || jiraKey.isEmpty()) {
            log.debug("No JIRA key provided, cannot determine workflow type");
            return null;
        }
        
        // VS2 stories are typically identified by VS2 in the story summary or key
        // VS4 stories are typically identified by VS4 in the story summary or key
        String upperKey = jiraKey.toUpperCase();
        
        if (upperKey.contains("VS2") || upperKey.contains("VS-2")) {
            log.info("Detected VS2 workflow from JIRA key: {}", jiraKey);
            return "VS2";
        } else if (upperKey.contains("VS4") || upperKey.contains("VS-4")) {
            log.info("Detected VS4 workflow from JIRA key: {}", jiraKey);
            return "VS4";
        }
        
        log.debug("Could not determine workflow type from JIRA key: {}", jiraKey);
        return null;
    }
    
    /**
     * Determine workflow type from user story content (including JIRA description/summary)
     * @param userStory - user story text (may include JIRA key, summary, and description)
     * @return workflow type (VS2, VS4, or null)
     */
    public String determineWorkflowTypeFromStory(String userStory) {
        if (userStory == null || userStory.isEmpty()) {
            return null;
        }
        
        String upperStory = userStory.toUpperCase();
        
        // Check for VS2 mentions in the entire story content
        if (upperStory.contains("VS2") || upperStory.contains("VS-2") || 
            upperStory.contains("VALUE STREAM 2") || upperStory.contains("VALUESTREAM2")) {
            log.info("Detected VS2 workflow from user story content: {}", 
                userStory.length() > 100 ? userStory.substring(0, 100) + "..." : userStory);
            return "VS2";
        }
        
        // Check for VS4 mentions in the entire story content
        if (upperStory.contains("VS4") || upperStory.contains("VS-4") || 
            upperStory.contains("VALUE STREAM 4") || upperStory.contains("VALUESTREAM4")) {
            log.info("Detected VS4 workflow from user story content: {}", 
                userStory.length() > 100 ? userStory.substring(0, 100) + "..." : userStory);
            return "VS4";
        }
        
        log.debug("No VS2 or VS4 mention found in user story content (length: {})", userStory.length());
        return null;
    }

    /**
     * Check if workflow document is available
     */
    public boolean isWorkflowAvailable() {
        return workflowLoaded && workflowContent != null && !workflowContent.trim().isEmpty();
    }
    
    /**
     * Check if a specific workflow type is available
     */
    public boolean isWorkflowAvailable(String workflowType) {
        if (workflowType == null || workflowType.isEmpty()) {
            return isWorkflowAvailable();
        }
        
        String normalizedType = workflowType.toUpperCase().trim();
        return workflowLoadedStatus.getOrDefault(normalizedType, false) && 
               workflowContents.get(normalizedType) != null && 
               !workflowContents.get(normalizedType).trim().isEmpty();
    }

    /**
     * Reload the workflow documents (useful if documents are updated)
     */
    public void reloadWorkflowDocument() {
        workflowContents.clear();
        workflowLoadedStatus.clear();
        loadWorkflowDocument();
    }

    /**
     * Extract text from .docx file
     */
    private String extractTextFromDocx(InputStream inputStream) throws Exception {
        try (XWPFDocument document = new XWPFDocument(inputStream);
             XWPFWordExtractor extractor = new XWPFWordExtractor(document)) {
            return extractor.getText();
        }
    }
}
