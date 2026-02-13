# SSC Login Enhancement for VS2 and VS4 Workflows

## Overview
Updated test case generation to explicitly specify **SSC (Self Service Channel)** application in all VS2 and VS4 workflow test cases, making them more specific and accurate.

## Changes Made

### 1. AI-Generated Test Cases Enhancement
**File**: `TestCaseGeneratorService.java` - `buildTestCaseGenerationSystemMessage` method

**What Changed**:
- Added workflow-specific instructions for VS2 and VS4 workflows
- AI now receives explicit instructions to mention SSC (Self Service Channel) application in:
  - Preconditions
  - Test steps (especially login steps)

**Instructions Added**:
```
🚨 CRITICAL VS2/VS4 WORKFLOW REQUIREMENT:
For VS2/VS4 workflow test cases, you MUST specify SSC (Self Service Channel) application 
in EVERY test case's preconditions and test steps.

MANDATORY Login Step Format for ALL test cases:
- Preconditions MUST include: "User has access to SSC (Self Service Channel) application"
- First test step MUST be: "Login to SSC (Self Service Channel) application with valid credentials"
- Never use generic "Login to application" - ALWAYS specify "SSC (Self Service Channel) application"
```

### 2. Fallback Test Cases Enhancement
**File**: `TestCaseGeneratorService.java` - `generateFallbackTestCases` method

**What Changed**:
- Method now accepts `workflowType` parameter
- Generates workflow-specific preconditions:
  - **VS2/VS4**: "User has access to SSC (Self Service Channel) application and has necessary permissions to perform the required operations"
  - **Other workflows**: Generic preconditions

### 3. Login Step Helper Method
**New Method**: `prependLoginStep(String testSteps, String workflowType)`

**Purpose**: Automatically prepends the correct login step to test steps based on workflow type

**Behavior**:
- **For VS2/VS4**: Prepends "Login to SSC (Self Service Channel) application with valid credentials"
- **For other workflows**: Prepends generic "Login to the application with valid credentials"
- Intelligently renumbers existing steps
- Updates existing login steps to SSC-specific format when needed

### 4. Default Test Cases Enhancement
**File**: `TestCaseGeneratorService.java` - `generateDefaultTestCases` method

**What Changed**:
- Method now accepts `workflowType` parameter
- Uses workflow-specific preconditions and login steps via `prependLoginStep` helper

## Impact

### Before This Change
**VS2/VS4 Test Cases** (Generic):
```
Preconditions: User is logged in and has necessary permissions

Test Steps:
1. Navigate to the form
2. Enter required data
3. Submit the form
```

### After This Change
**VS2/VS4 Test Cases** (Specific):
```
Preconditions: User has access to SSC (Self Service Channel) application 
               and has necessary permissions to perform the required operations

Test Steps:
1. Login to SSC (Self Service Channel) application with valid credentials
2. Navigate to the form
3. Enter required data
4. Submit the form
```

## Testing

### Compilation Status
✅ **BUILD SUCCESS** - All changes compiled successfully without errors

### What to Test
1. Generate test cases for a VS2 workflow story
2. Generate test cases for a VS4 workflow story
3. Verify that:
   - Preconditions mention "SSC (Self Service Channel) application"
   - First test step is "Login to SSC (Self Service Channel) application with valid credentials"
   - All test cases are specific (not generic)

### Expected Behavior
- **VS2 workflows**: All test cases explicitly mention SSC application
- **VS4 workflows**: All test cases explicitly mention SSC application
- **VS6 workflows**: Continue to work as before (already generating good test cases)
- **Other workflows**: Use standard generic login steps

## Technical Details

### Workflow Detection
The system detects workflow type from:
1. JIRA story key (e.g., if key contains "VS2", "VS-2", "VS4", or "VS-4")
2. User story content (searches for "VS2", "VS4", "Value Stream 2", "Value Stream 4")
3. Falls back to default workflow (VS4) if no specific workflow detected

### Files Modified
- `src/main/java/com/hcl/testmate/service/TestCaseGeneratorService.java`
  - Updated `buildTestCaseGenerationSystemMessage()` method
  - Updated `generateFallbackTestCases()` method signature and implementation
  - Added `prependLoginStep()` helper method
  - Updated `generateDefaultTestCases()` method signature and implementation
  - Updated all method calls to pass `workflowType` parameter

## Benefits

1. **Specificity**: Test cases now explicitly mention the SSC application for VS2/VS4 workflows
2. **Clarity**: Testers know exactly which application to log into
3. **Consistency**: All test cases (AI-generated, fallback, and default) follow the same pattern
4. **Maintainability**: Centralized login step logic via helper method
5. **Flexibility**: Other workflows remain unaffected and can have their own specific requirements

## Notes

- This enhancement is backward compatible - existing VS6 and other workflows are not affected
- The change applies to both AI-generated test cases and fallback/default test cases
- The SSC application reference is automatically added; users don't need to specify it in their stories
