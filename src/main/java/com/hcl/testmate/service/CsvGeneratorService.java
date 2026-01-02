package com.hcl.testmate.service;

import com.hcl.testmate.model.TestCase;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.apache.commons.csv.CSVFormat;
import org.apache.commons.csv.CSVPrinter;
import org.springframework.stereotype.Service;

import java.io.StringWriter;
import java.util.List;

/**
 * Service for generating CSV files from test cases
 */
@Service
public class CsvGeneratorService {

    private static final Logger log = LoggerFactory.getLogger(CsvGeneratorService.class);
    
    private static final String[] CSV_HEADERS = {
        "ID",
        "Has attachments",
        "Name",
        "Testing tool type",
        "Planned",
        "Passed",
        "Failed",
        "Requires Attention",
        "Test type",
        "Application modules",
        "Backlog Coverage",
        "Preconditions",
        "Test Steps",
        "Expected Result",
        "Priority"
    };
    
    /**
     * Generate CSV content from list of test cases in Octane format
     */
    public String generateCsv(List<TestCase> testCases) {
        try (StringWriter writer = new StringWriter();
             CSVPrinter csvPrinter = new CSVPrinter(writer, 
                     CSVFormat.DEFAULT.builder()
                             .setHeader(CSV_HEADERS)
                             .setQuoteMode(org.apache.commons.csv.QuoteMode.ALL)
                             .setRecordSeparator("\n")
                             .build())) {
            
            for (TestCase testCase : testCases) {
                csvPrinter.printRecord(
                    testCase.getTestCaseId(),          // ID
                    "No",                                // Has attachments
                    formatTestScenario(testCase.getTestScenario()),         // Name (wrap text)
                    "Manual Runner",                     // Testing tool type
                    "",                                  // Planned (empty)
                    "",                                  // Passed (empty)
                    "",                                  // Failed (empty)
                    "",                                  // Requires Attention (empty)
                    testCase.getTestType(),             // Test type
                    "",                                  // Application modules (empty)
                    "",                                  // Backlog Coverage (empty)
                    formatMultilineField(testCase.getPreconditions()),        // Preconditions
                    formatTestSteps(testCase.getTestSteps()),            // Test Steps (each step in new row)
                    formatMultilineField(testCase.getExpectedResult()),       // Expected Result
                    testCase.getPriority()              // Priority
                );
            }
            
            csvPrinter.flush();
            return writer.toString();
            
        } catch (Exception e) {
            log.error("Error generating CSV", e);
            throw new RuntimeException("Failed to generate CSV: " + e.getMessage(), e);
        }
    }
    
    /**
     * Format test scenario for wrap text in Excel
     */
    private String formatTestScenario(String scenario) {
        if (scenario == null || scenario.isEmpty()) {
            return "";
        }
        // Ensure proper line breaks for wrap text
        return scenario.trim();
    }
    
    /**
     * Format test steps to display each step on a separate row within the cell
     * Ensures numbered steps are on separate lines for Excel
     */
    private String formatTestSteps(String steps) {
        if (steps == null || steps.isEmpty()) {
            return "";
        }
        
        // Replace common step separators with newlines for Excel row display
        String formatted = steps.trim();
        
        // If steps are already separated by newlines, preserve them
        if (formatted.contains("\n")) {
            // Clean up multiple consecutive newlines
            formatted = formatted.replaceAll("\n{3,}", "\n\n");
            return formatted;
        }
        
        // If steps are numbered with patterns like "1.", "Step 1:", "1)", etc.
        // Add newline before each numbered step (except the first one)
        formatted = formatted.replaceAll("(?<!^)([\\s]*)(\\d+[\\.\\)]\\s*)", "\n$2");
        formatted = formatted.replaceAll("(?<!^)([\\s]*)(Step\\s*\\d+[:\\.\\)]\\s*)", "\n$2");
        
        return formatted.trim();
    }
    
    /**
     * Normalize multi-line fields for CSV by preserving line breaks
     * CSV spec allows newlines within quoted fields
     */
    private String formatMultilineField(String field) {
        if (field == null || field.isEmpty()) {
            return "";
        }
        // Preserve all newlines - Apache Commons CSV will handle proper quoting
        return field.trim();
    }
}
