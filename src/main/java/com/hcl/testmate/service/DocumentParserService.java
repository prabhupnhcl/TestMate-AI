package com.hcl.testmate.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.apache.poi.hwpf.HWPFDocument;
import org.apache.poi.hwpf.extractor.WordExtractor;
import org.apache.poi.xwpf.extractor.XWPFWordExtractor;
import org.apache.poi.xwpf.usermodel.XWPFDocument;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.BufferedReader;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;

/**
 * Service for parsing Word documents (.doc, .docx)
 */
@Service
public class DocumentParserService {

    private static final Logger log = LoggerFactory.getLogger(DocumentParserService.class);
    
    /**
     * Extract text content from uploaded Word document
     */
    public String extractTextFromDocument(MultipartFile file) {
        try {
            String filename = file.getOriginalFilename();
            if (filename == null) {
                throw new RuntimeException("Filename is null");
            }
            
            log.info("Extracting text from document: {}", filename);
            
            String text;
            if (filename.toLowerCase().endsWith(".docx")) {
                text = extractFromDocx(file.getInputStream());
            } else if (filename.toLowerCase().endsWith(".doc")) {
                // Try regular .doc first, then fall back to HTML if it fails
                try {
                    text = extractFromDoc(file.getInputStream());
                } catch (Exception e) {
                    log.warn("Failed to read as binary .doc, trying HTML extraction: {}", e.getMessage());
                    text = extractFromHtmlDoc(file.getInputStream());
                }
            } else {
                throw new RuntimeException("Unsupported file format. Please upload .doc or .docx file");
            }
            
            if (text == null || text.trim().isEmpty()) {
                throw new RuntimeException("No text content found in the document");
            }
            
            log.info("Successfully extracted {} characters from document", text.length());
            return text;
            
        } catch (Exception e) {
            log.error("Error extracting text from document", e);
            throw new RuntimeException("Failed to extract text from document: " + e.getMessage(), e);
        }
    }
    
    /**
     * Extract text from .docx file
     */
    private String extractFromDocx(InputStream inputStream) throws Exception {
        try (XWPFDocument document = new XWPFDocument(inputStream);
             XWPFWordExtractor extractor = new XWPFWordExtractor(document)) {
            return extractor.getText();
        }
    }
    
    /**
     * Extract text from .doc file
     */
    private String extractFromDoc(InputStream inputStream) throws Exception {
        try (HWPFDocument document = new HWPFDocument(inputStream);
             WordExtractor extractor = new WordExtractor(document)) {
            return extractor.getText();
        }
    }
    
    /**
     * Extract text from HTML-based .doc file (common in older Word versions)
     */
    private String extractFromHtmlDoc(InputStream inputStream) throws Exception {
        // Removed unused variable 'text'
        
        try (BufferedReader reader = new BufferedReader(
                new InputStreamReader(inputStream, StandardCharsets.UTF_8))) {
            
            String line;
            StringBuilder htmlContent = new StringBuilder();
            
            while ((line = reader.readLine()) != null) {
                htmlContent.append(line).append("\n");
            }
            
            // Remove HTML tags and extract text
            String content = htmlContent.toString();
            
            // Remove script and style tags with their content
            content = content.replaceAll("(?i)<script[^>]*>.*?</script>", "");
            content = content.replaceAll("(?i)<style[^>]*>.*?</style>", "");
            
            // Remove HTML comments
            content = content.replaceAll("<!--.*?-->", "");
            
            // Remove all HTML tags
            content = content.replaceAll("<[^>]+>", " ");
            
            // Decode HTML entities
            content = content.replace("&nbsp;", " ");
            content = content.replace("&lt;", "<");
            content = content.replace("&gt;", ">");
            content = content.replace("&amp;", "&");
            content = content.replace("&quot;", "\"");
            content = content.replace("&#39;", "'");
            
            // Remove multiple spaces and clean up
            content = content.replaceAll("\\s+", " ");
            content = content.trim();
            
            return content;
        }
    }
    
    /**
     * Validate if file is a valid Word document
     */
    public boolean isValidWordDocument(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            return false;
        }
        
        String filename = file.getOriginalFilename();
        if (filename == null) {
            return false;
        }
        
        return filename.toLowerCase().endsWith(".doc") || 
               filename.toLowerCase().endsWith(".docx");
    }
    
    /**
     * Extract structured sections from document (User Story, AC, BR)
     */
    public DocumentSections extractSections(String fullText) {
        DocumentSections sections = new DocumentSections();
        
        try {
            // Extract User Story
            sections.setUserStory(extractSection(fullText, 
                new String[]{"User Story", "Description:", "As I want to", "As a", "Story:"},
                new String[]{"Acceptance Criteria", "Business Rules", "Pre-conditions", "Assumptions"}
            ));
            
            // Extract Acceptance Criteria
            sections.setAcceptanceCriteria(extractSection(fullText,
                new String[]{"Acceptance Criteria", "Given", "When", "Then"},
                new String[]{"Business Rules", "Pre-conditions", "Assumptions", "Technical Notes"}
            ));
            
            // Extract Business Rules
            sections.setBusinessRules(extractSection(fullText,
                new String[]{"Business Rules", "BR001", "BR002", "Business Rule"},
                new String[]{"Technical Notes", "Wireframe", "Pre-conditions", "Assumptions"}
            ));
            
            log.info("Extracted sections - User Story: {} chars, AC: {} chars, BR: {} chars",
                    sections.getUserStory().length(),
                    sections.getAcceptanceCriteria().length(),
                    sections.getBusinessRules().length());
                    
        } catch (Exception e) {
            log.warn("Error extracting sections, returning full text: {}", e.getMessage());
            sections.setUserStory(fullText);
        }
        
        return sections;
    }
    
    /**
     * Extract a specific section from text based on start and end markers
     */
    private String extractSection(String text, String[] startMarkers, String[] endMarkers) {
        String lowerText = text.toLowerCase();
        
        // Find the earliest start position
        int startPos = -1;
        for (String marker : startMarkers) {
            int pos = lowerText.indexOf(marker.toLowerCase());
            if (pos != -1 && (startPos == -1 || pos < startPos)) {
                startPos = pos;
            }
        }
        
        if (startPos == -1) {
            return "";
        }
        
        // Find the earliest end position after start
        int endPos = text.length();
        for (String marker : endMarkers) {
            int pos = lowerText.indexOf(marker.toLowerCase(), startPos + 1);
            if (pos != -1 && pos < endPos) {
                endPos = pos;
            }
        }
        
        String section = text.substring(startPos, endPos).trim();
        
        // Clean up section - remove the header line itself if it's just a label
        for (String marker : startMarkers) {
            if (section.toLowerCase().startsWith(marker.toLowerCase())) {
                section = section.substring(marker.length()).trim();
                if (section.startsWith(":")) {
                    section = section.substring(1).trim();
                }
                break;
            }
        }
        
        return section.trim();
    }
    
    /**
     * Inner class to hold extracted document sections
     */
    public static class DocumentSections {
        private String userStory = "";
        private String acceptanceCriteria = "";
        private String businessRules = "";
        
        public String getUserStory() {
            return userStory;
        }
        
        public void setUserStory(String userStory) {
            this.userStory = userStory != null ? userStory : "";
        }
        
        public String getAcceptanceCriteria() {
            return acceptanceCriteria;
        }
        
        public void setAcceptanceCriteria(String acceptanceCriteria) {
            this.acceptanceCriteria = acceptanceCriteria != null ? acceptanceCriteria : "";
        }
        
        public String getBusinessRules() {
            return businessRules;
        }
        
        public void setBusinessRules(String businessRules) {
            this.businessRules = businessRules != null ? businessRules : "";
        }
    }
}
