package com.hcl.testmate.service;

import java.io.File;
import java.io.FileInputStream;
import java.io.InputStream;

import org.apache.poi.xwpf.extractor.XWPFWordExtractor;
import org.apache.poi.xwpf.usermodel.XWPFDocument;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import jakarta.annotation.PostConstruct;

/**
 * Service for loading and managing application workflow documentation
 */
@Service
public class WorkflowService {

    private static final Logger log = LoggerFactory.getLogger(WorkflowService.class);
    
    @Value("${workflow.document.path:Application Workflow for VS4 Functionality.docx}")
    private String workflowDocumentPath;
    
    private String workflowContent;
    private boolean workflowLoaded = false;

    /**
     * Load workflow document on application startup
     */
    @PostConstruct
    public void loadWorkflowDocument() {
        try {
            log.info("Loading application workflow document from: {}", workflowDocumentPath);
            
            File workflowFile = new File(workflowDocumentPath);
            
            if (!workflowFile.exists()) {
                log.warn("Workflow document not found at: {}", workflowFile.getAbsolutePath());
                log.info("Test case generation will proceed without workflow context");
                workflowLoaded = false;
                return;
            }
            
            workflowContent = extractTextFromDocx(new FileInputStream(workflowFile));
            
            if (workflowContent != null && !workflowContent.trim().isEmpty()) {
                workflowLoaded = true;
                log.info("Successfully loaded workflow document ({} characters)", workflowContent.length());
            } else {
                log.warn("Workflow document is empty");
                workflowLoaded = false;
            }
            
        } catch (Exception e) {
            log.error("Failed to load workflow document: {}", e.getMessage());
            log.info("Test case generation will proceed without workflow context");
            workflowLoaded = false;
        }
    }

    /**
     * Get the workflow content
     */
    public String getWorkflowContent() {
        if (!workflowLoaded) {
            log.debug("Workflow content requested but not loaded");
            return null;
        }
        return workflowContent;
    }

    /**
     * Check if workflow document is available
     */
    public boolean isWorkflowAvailable() {
        return workflowLoaded && workflowContent != null && !workflowContent.trim().isEmpty();
    }

    /**
     * Reload the workflow document (useful if document is updated)
     */
    public void reloadWorkflowDocument() {
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
