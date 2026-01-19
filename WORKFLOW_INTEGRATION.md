# Application Workflow Integration Guide

## Overview

TestMate AI now integrates with application workflow documentation to generate more accurate and context-aware test cases. The system automatically loads workflow documentation from Word documents and uses it to enhance test case generation.

## How It Works

### 1. Workflow Document Loading

The `WorkflowService` automatically loads the application workflow document when the application starts:

- **Default Location**: `Application Workflow for VS4 Functionality.docx` (in project root)
- **Configuration**: Can be customized in `application.properties`
- **Auto-Loading**: Document is loaded on application startup using `@PostConstruct`

### 2. Integration with Test Case Generation

When generating test cases from user stories, the workflow information is automatically:

1. **Injected into AI prompts** - The workflow document content is included in the system message to the AI
2. **Referenced in test steps** - Generated test cases include specific workflow steps, screen names, and interaction patterns
3. **Context-aware** - Test steps follow the actual application navigation and behavior described in the workflow

### 3. Benefits

- **Accurate Test Steps**: Test cases reflect actual application workflow and UI elements
- **Consistent Terminology**: Uses field names and terminology from workflow documentation  
- **Complete Coverage**: Test cases consider workflow dependencies and prerequisites
- **Navigation Patterns**: Test steps follow documented navigation flows

## Configuration

### Application Properties

```properties
# Path to the application workflow document (relative to project root)
workflow.document.path=Application Workflow for VS4 Functionality.docx
```

You can place your workflow document anywhere and update this path accordingly.

### Supported Document Formats

Currently supported: `.docx` (Microsoft Word XML format)

## Usage

### Automatic Usage

No special action required! When you generate test cases:

1. The system automatically checks if workflow documentation is available
2. If available, it includes the workflow context in the AI prompts
3. Generated test cases will reference specific workflow steps and screens

### Manual Reload

If you update the workflow document while the application is running, you can reload it by restarting the application.

## Implementation Details

### WorkflowService

```java
@Service
public class WorkflowService {
    // Loads workflow document on startup
    @PostConstruct
    public void loadWorkflowDocument()
    
    // Returns workflow content for use in AI prompts
    public String getWorkflowContent()
    
    // Check if workflow is available
    public boolean isWorkflowAvailable()
    
    // Manually reload workflow document
    public void reloadWorkflowDocument()
}
```

### TestCaseGeneratorService Integration

The `TestCaseGeneratorService` has been updated to:

1. Inject `WorkflowService` as a dependency
2. Check workflow availability when building AI prompts
3. Include workflow documentation in system messages
4. Provide guidance to AI for generating workflow-aware test steps

## Example

### Before Workflow Integration

**Generated Test Step:**
```
1. Open the application
2. Click on submit button
3. Verify submission is successful
```

### After Workflow Integration

**Generated Test Step (with workflow context):**
```
1. Navigate to the Application Dashboard screen
2. Select "New Transaction" from the main menu
3. Fill in the Transaction Details form:
   - Enter Transaction Type
   - Enter Amount in the designated field
   - Select Account from dropdown
4. Click the "Submit Transaction" button
5. Verify the confirmation message appears
6. Verify transaction appears in Transaction History
```

## Troubleshooting

### Workflow Document Not Loading

**Check logs for:**
```
Loading application workflow document from: <path>
Successfully loaded workflow document (X characters)
```

**Common issues:**
- Document path incorrect - verify path in `application.properties`
- Document not found - ensure file exists in project root
- Document format not supported - use `.docx` format only

### Workflow Not Being Used in Test Generation

**Check:**
1. `isWorkflowAvailable()` returns true
2. Workflow content is not empty
3. Check application logs for workflow-related messages

### Performance Impact

- Workflow document is loaded once at startup
- Minimal impact on test generation performance
- Document content is kept in memory for fast access

## Best Practices

1. **Keep workflow documentation up-to-date** - Update the Word document when application changes
2. **Use clear terminology** - Use consistent field names and screen titles
3. **Document all screens and flows** - More complete documentation = better test cases
4. **Include screenshots** - While not used by AI, helps maintain documentation quality
5. **Structure logically** - Organize workflow by features or user journeys

## Future Enhancements

Potential future improvements:

- Support for multiple workflow documents (by feature/module)
- Hot-reload of workflow documents without restart
- Workflow document versioning
- Visual workflow diagram integration
- Support for additional document formats (.pdf, .html)

## Support

For issues or questions about workflow integration, please refer to the main TestMate documentation or contact the development team.
