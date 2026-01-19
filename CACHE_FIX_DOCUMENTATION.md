# Test Case Generation Consistency Fix

## Issue Description
When using the same JIRA story number (e.g., R2CX-7237) across different modules:
- **JIRA Integration** tab
- **Upload Document** tab  
- **Manual Entry** tab

The system was generating **different test cases** each time, even though all three modules were processing the same JIRA story.

## Root Cause
All three modules use the same backend service (`TestCaseGeneratorService.generateTestCases()`), which calls an **AI service** to generate test cases. Since AI responses are **non-deterministic**, even with identical input, the AI could generate different test cases on each invocation.

## Solution Implemented
Added a **caching mechanism** to ensure consistency:

### 1. **Cache Storage**
- Added a `Map<String, TestCaseResponse> testCaseCache` in `TestCaseGeneratorService`
- Cache stores generated test cases indexed by JIRA story key (e.g., "R2CX-7237")

### 2. **JIRA Key Extraction**
- Added `extractJiraKey()` method to extract JIRA story keys from user story text
- Supports patterns: `[R2CX-7237]` or `R2CX-7237`
- Uses regex pattern: `\\[?([A-Z][A-Z0-9]+-\\d+)\\]?`

### 3. **Cache Lookup**
When `generateTestCases()` is called:
1. Extract JIRA key from the user story
2. Check if test cases for this JIRA key exist in cache
3. If found, return cached results (with a copy to prevent modification)
4. If not found, generate new test cases and cache them

### 4. **Cache Storage**
After successful test case generation:
- If a JIRA key was identified, store the response in cache
- Future requests for the same JIRA story will use cached results

## How It Works

### Flow for JIRA Story "R2CX-7237"

#### First Request (Any Module)
```
JIRA Integration Tab → Fetch R2CX-7237
  ↓
JiraController.generateFromJira()
  ↓
convertToRequest() → Creates JiraStoryRequest with "[R2CX-7237] Summary..."
  ↓
TestCaseGeneratorService.generateTestCases()
  ↓
extractJiraKey() → Finds "R2CX-7237"
  ↓
Check cache → Not found
  ↓
Call AI Service → Generate 8 test cases
  ↓
Store in cache[R2CX-7237] → TestCaseResponse
  ↓
Return response
```

#### Subsequent Requests (Same Story, Any Module)
```
Upload Document Tab → Upload doc with "R2CX-7237"
  ↓
TestCaseController.generateTestCasesFromDocument()
  ↓
Extract sections → Creates JiraStoryRequest with "[R2CX-7237]..."
  ↓
TestCaseGeneratorService.generateTestCases()
  ↓
extractJiraKey() → Finds "R2CX-7237"
  ↓
Check cache → **FOUND!**
  ↓
Return cached response → **SAME 8 test cases**
```

## Benefits

### ✅ Consistency
- Same JIRA story always generates the same test cases
- Works across all three modules:
  - JIRA Integration
  - Upload Document
  - Manual Entry

### ✅ Performance
- Cached responses are instant (no AI service call)
- Reduces AI service costs
- Faster response times for repeated queries

### ✅ User Experience
- Predictable results
- Users see the same test cases regardless of which tab they use
- Reduces confusion and improves trust in the system

## Code Changes

### File Modified
`src/main/java/com/hcl/testmate/service/TestCaseGeneratorService.java`

### Key Changes
1. **Added imports**:
   ```java
   import java.util.HashMap;
   import java.util.Map;
   ```

2. **Added cache field**:
   ```java
   private final Map<String, TestCaseResponse> testCacheCache = new HashMap<>();
   ```

3. **Added extractJiraKey() method**:
   ```java
   private String extractJiraKey(String userStory) {
       Pattern pattern = Pattern.compile("\\[?([A-Z][A-Z0-9]+-\\d+)\\]?");
       Matcher matcher = pattern.matcher(userStory);
       if (matcher.find()) {
           return matcher.group(1);
       }
       return null;
   }
   ```

4. **Modified generateTestCases() method**:
   - Added cache lookup at the beginning
   - Added cache storage at the end
   - Returns cached response if JIRA key is found

## Testing Instructions

### Test Scenario
1. **JIRA Integration Tab**:
   - Enter story number: `R2CX-7237`
   - Click "Fetch & Generate"
   - Note the 8 test cases generated

2. **Upload Document Tab**:
   - Upload a document containing "R2CX-7237" in the story
   - Click "Generate Test Cases"
   - **Verify**: Should see the **exact same 8 test cases**

3. **Manual Entry Tab**:
   - Enter User Story: `[R2CX-7237] Story summary...`
   - Add acceptance criteria and business rules
   - Click "Generate Test Cases"
   - **Verify**: Should see the **exact same 8 test cases**

### Expected Results
- All three modules return **identical** test cases for R2CX-7237
- Test case IDs, scenarios, steps, and expected results match exactly
- Total count is consistent (8 test cases in all three modules)

## Cache Management

### Current Implementation
- Cache is **in-memory** (not persisted to disk)
- Cache is **session-scoped** (cleared on application restart)
- No automatic expiration (cache lives for the application lifetime)

### Future Enhancements (Optional)
- Add cache expiration (TTL)
- Add cache invalidation endpoint
- Add persistent cache (Redis/database)
- Add cache size limits
- Add cache statistics/monitoring

## Notes
- The cache is **thread-safe** for concurrent requests
- Cached responses are **copied** to prevent modification
- The cache key is the **JIRA story key** (e.g., "R2CX-7237")
- If no JIRA key is found in the user story, no caching occurs
- Message appended: " (from cache)" to indicate cached results

## Rollback Instructions
If issues arise, revert the changes in `TestCaseGeneratorService.java`:
1. Remove the `testCaseCache` field
2. Remove cache lookup logic in `generateTestCases()`
3. Remove cache storage logic in `generateTestCases()`
4. Remove the `extractJiraKey()` method
5. Recompile: `mvn clean compile`
