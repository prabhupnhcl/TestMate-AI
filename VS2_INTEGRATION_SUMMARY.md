# VS2 Workflow Integration - Implementation Summary

## Overview

Successfully integrated VS2 workflow support into TestMate AI alongside the existing VS4 workflow. The system now automatically detects which workflow to use based on the JIRA story key or user story content.

## Changes Made

### 1. WorkflowService.java
**Location**: `src/main/java/com/hcl/testmate/service/WorkflowService.java`

**Changes**:
- Added support for multiple workflow documents (VS2 and VS4)
- Added configuration properties:
  - `workflow.vs4.document.path` - VS4 workflow document path
  - `workflow.vs2.document.path` - VS2 workflow document path
- Added workflow type detection methods:
  - `determineWorkflowType(String jiraKey)` - Detects workflow from JIRA key
  - `determineWorkflowTypeFromStory(String userStory)` - Detects workflow from story content
- Added workflow-specific retrieval:
  - `getWorkflowContent(String workflowType)` - Get specific workflow content
  - `isWorkflowAvailable(String workflowType)` - Check if specific workflow is loaded
- Maintained backward compatibility with existing methods

### 2. TestCaseGeneratorService.java
**Location**: `src/main/java/com/hcl/testmate/service/TestCaseGeneratorService.java`

**Changes**:
- Updated `generateTestCases()` method to detect workflow type
- Added `determineWorkflowType()` helper method
- Modified `generateTestCasesWithAi()` to accept workflow type parameter
- Updated `buildTestCaseGenerationSystemMessage()` to use workflow-specific content
- Workflow detection logic:
  1. Extracts JIRA key from user story
  2. Determines workflow type from key or content
  3. Passes workflow type to AI prompt builder

### 3. application.properties
**Location**: `src/main/resources/application.properties`

**Changes**:
```properties
# Workflow Document Configuration
workflow.vs4.document.path=Application Workflow for VS4 Functionality.docx
workflow.vs2.document.path=VS2 Flow.docx
workflow.document.path=Application Workflow for VS4 Functionality.docx  # Legacy support
```

### 4. WORKFLOW_INTEGRATION.md
**Updates**:
- Added multi-workflow documentation
- Added automatic workflow detection explanation
- Added configuration examples
- Added usage examples for VS2 and VS4 stories

### 5. README.md
**Updates**:
- Added "Multi-Workflow Support" feature to feature list
- Added workflow configuration section
- Added link to WORKFLOW_INTEGRATION.md

## How It Works

### Workflow Detection Logic

1. **From JIRA Key**:
   - Searches for patterns like `VS2`, `VS-2`, `VS4`, `VS-4` in JIRA key
   - Example: `[R2CX-VS2-123]` → VS2 workflow

2. **From User Story Content**:
   - If no JIRA key detected, searches story content
   - Looks for: `VS2`, `VS-2`, `Value Stream 2`, `VS4`, `VS-4`, `Value Stream 4`
   - Example: "As a VS2 user..." → VS2 workflow

3. **Default Fallback**:
   - If no specific workflow detected, uses VS4 (default)

### Test Case Generation Flow

```
User submits story → Extract JIRA key → Determine workflow type
                                             ↓
                     VS2 detected → Load VS2 workflow → Generate test cases with VS2 context
                     VS4 detected → Load VS4 workflow → Generate test cases with VS4 context
                     Not detected → Load default (VS4) → Generate test cases
```

## Usage Examples

### VS2 Story Example
```
User Story: [R2CX-VS2-7237] As a VS2 user, I want to generate compliance reports
```
**Result**: Uses VS2 Flow.docx for test case generation

### VS4 Story Example
```
User Story: [R2CX-7237] As a VS4 user, I want to submit declarations
```
**Result**: Uses Application Workflow for VS4 Functionality.docx

### Story with VS2 Mention
```
User Story: As a user in Value Stream 2, I need to access the dashboard
```
**Result**: Uses VS2 Flow.docx (detected from "Value Stream 2" mention)

## Testing

### Compilation Test
✅ Passed - Project compiles successfully with `mvn clean compile`

### Expected Behavior
1. Place `VS2 Flow.docx` in project root directory
2. When generating test cases for VS2 stories:
   - System detects "VS2" in story
   - Loads VS2 workflow document
   - Includes VS2 workflow in AI prompt
   - Generates test cases with VS2-specific steps and terminology

3. When generating test cases for VS4 stories:
   - System detects "VS4" or uses default
   - Loads VS4 workflow document
   - Generates test cases with VS4-specific steps and terminology

## Files Modified

1. `src/main/java/com/hcl/testmate/service/WorkflowService.java`
2. `src/main/java/com/hcl/testmate/service/TestCaseGeneratorService.java`
3. `src/main/resources/application.properties`
4. `WORKFLOW_INTEGRATION.md`
5. `README.md`

## Next Steps

1. ✅ Compile the application: `mvn clean compile`
2. ✅ Ensure `VS2 Flow.docx` is in the project root
3. ✅ Restart the application: `mvn spring-boot:run`
4. Test with VS2 stories to verify workflow is being used correctly
5. Monitor logs to confirm VS2 workflow is loaded on startup

## Log Messages to Watch

When the application starts, you should see:
```
Loading VS4 workflow document from: Application Workflow for VS4 Functionality.docx
Successfully loaded VS4 workflow document (XXXX characters)
Loading VS2 workflow document from: VS2 Flow.docx
Successfully loaded VS2 workflow document (XXXX characters)
```

When generating test cases for a VS2 story:
```
Detected VS2 workflow from JIRA key: [key]
Generating test cases using AI service with workflow type: VS2
```

## Backward Compatibility

✅ Maintained - All existing functionality continues to work
- If no workflow type is detected, system uses default (VS4)
- Old configuration property `workflow.document.path` still supported
- Existing API endpoints remain unchanged

## Benefits

1. **Automatic Detection**: No manual configuration needed per story
2. **Accurate Test Cases**: VS2 stories get VS2-specific workflow steps
3. **Scalable**: Easy to add more workflows (VS3, VS5, etc.) in the future
4. **Backward Compatible**: Existing VS4 functionality unchanged
5. **Clear Logging**: Easy to debug which workflow is being used

---
**Implementation Date**: January 21, 2026
**Status**: ✅ Complete and Ready for Testing
