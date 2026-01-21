# Application Workflow Integration Guide

## Overview

TestMate AI now integrates with application workflow documentation to generate more accurate and context-aware test cases. The system automatically loads workflow documentation from Word documents and uses it to enhance test case generation.

**NEW**: The system now supports multiple workflows (VS2, VS4, etc.) and automatically selects the appropriate workflow based on the JIRA story key or user story content.

## How It Works

### 1. Workflow Document Loading

The `WorkflowService` automatically loads multiple application workflow documents when the application starts:

- **VS4 Workflow**: `Application Workflow for VS4 Functionality.docx` (in project root)
- **VS2 Workflow**: `VS2 Flow.docx` (in project root)
- **Configuration**: Can be customized in `application.properties`
- **Auto-Loading**: Documents are loaded on application startup using `@PostConstruct`

### 2. Automatic Workflow Detection

When generating test cases from user stories, the system automatically detects which workflow to use:

1. **From JIRA Key**: If the user story contains a JIRA key (e.g., R2CX-7237), the system checks if it contains VS2, VS-2, VS4, or VS-4
2. **From Story Content**: If no JIRA key is found, the system searches the user story content for VS2, VS-2, VS4, VS-4, or "Value Stream 2/4" mentions
3. **Default Fallback**: If no specific workflow is detected, the system uses the default workflow (VS4)

### 3. Integration with Test Case Generation

When generating test cases from user stories, the workflow information is automatically:

1. **Injected into AI prompts** - The appropriate workflow document content is included in the system message to the AI
2. **Referenced in test steps** - Generated test cases include specific workflow steps, screen names, and interaction patterns
3. **Context-aware** - Test steps follow the actual application navigation and behavior described in the workflow
4. **Workflow-specific** - VS2 stories get VS2 workflow, VS4 stories get VS4 workflow

### 4. Benefits

- **Accurate Test Steps**: Test cases reflect actual application workflow and UI elements for the specific value stream
- **Consistent Terminology**: Uses field names and terminology from workflow documentation  
- **Complete Coverage**: Test cases consider workflow dependencies and prerequisites
- **Navigation Patterns**: Test steps follow documented navigation flows
- **Multi-Workflow Support**: Different value streams can have different workflows and behaviors

## Configuration

### Application Properties

```properties
# Path to the VS4 application workflow document (relative to project root)
workflow.vs4.document.path=Application Workflow for VS4 Functionality.docx

# Path to the VS2 application workflow document (relative to project root)
workflow.vs2.document.path=VS2 Flow.docx

# Legacy support - deprecated, use workflow.vs4.document.path instead
workflow.document.path=Application Workflow for VS4 Functionality.docx
```

You can place your workflow documents anywhere and update these paths accordingly.

### Supported Document Formats

Currently supported: `.docx` (Microsoft Word XML format)

## Usage

### Automatic Usage

No special action required! When you generate test cases:

1. The system automatically checks if workflow documentation is available for VS2 and VS4
2. It determines which workflow to use based on the JIRA story key or content
3. If available, it includes the appropriate workflow context in the AI prompts
4. Generated test cases will reference specific workflow steps and screens for that value stream

### Example User Stories

**VS2 Story:**
```
[R2CX-7237] As a VS2 user, I want to generate compliance reports...
```
→ Will use VS2 workflow

**VS4 Story:**
```
[PROJ-123] As a VS4 user, I want to submit declarations...
```
→ Will use VS4 workflow

**Story with VS2 Mention:**
```
As a user in Value Stream 2, I need to access the dashboard...
```
→ Will use VS2 workflow

### Manual Reload

If you update the workflow documents while the application is running, you can reload them by restarting the application.

## Implementation Details

### WorkflowService

```java
@Service
public class WorkflowService {
    // Loads workflow documents on startup
    @PostConstruct
    public void loadWorkflowDocument()
    
    // Returns workflow content for a specific type (VS2, VS4, etc.)
    public String getWorkflowContent(String workflowType)
    
    // Returns default workflow content for backward compatibility
    public String getWorkflowContent()
    
    // Check if a specific workflow type is available
    public boolean isWorkflowAvailable(String workflowType)
    
    // Check if default workflow is available
    public boolean isWorkflowAvailable()
    
    // Determine workflow type from JIRA key
    public String determineWorkflowType(String jiraKey)
    
    // Determine workflow type from user story content
    public String determineWorkflowTypeFromStory(String userStory)
    
    // Manually reload workflow documents
    public void reloadWorkflowDocument()
}
```

### TestCaseGeneratorService Integration

The `TestCaseGeneratorService` has been updated to:

1. Inject `WorkflowService` as a dependency
2. Extract JIRA key from user story
3. 

### After Workflow Integration (VS4)

**Generated Test Step:**
```
1. Navigate to Fit and Proper Declaration screen
2. Select the entity from the dropdown
3. Select declaration type: "Annual Declaration"
4. Click "Submit Declaration" button
5. Verify declaration submitted successfully with confirmation message
```

### After Workflow Integration (VS2)

**Generated Test Step (based on VS2 Flow.docx):**
```
1. Navigate to Compliance Reports screen
2. Select report type from available options
3. Set date range for the report
4. Click "Generate Report" button
5. Verify report is generated and displayed correctly
```

*Note: The actual test steps will vary based on the specific workflow documentation content for each value stream.*Determine appropriate workflow type (VS2, VS4, or default)
4. Check workflow availability for the detected type
5. Include the appropriate workflow documentation in system messages
6. Provide guidance to AI for generating workflow-aware test steps

### Workflow Detection Logic

1. **JIRA Key Detection**: Extracts JIRA keys like `R2CX-7237`, `PROJ-123` from user story
2. **Workflow Type from Key**: Checks if key contains `VS2`, `VS-2`, `VS4`, `VS-4`
3. **Workflow Type from Content**: If key detection fails, searches user story for workflow mentions
4. **Fallback**: Uses default workflow (VS4) if no specific workflow is detected

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
