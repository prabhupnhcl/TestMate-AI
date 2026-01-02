# JIRA Integration Setup Guide

## Overview
TestMate AI now supports direct integration with JIRA to automatically fetch user stories and generate test cases. This eliminates manual copy-paste and streamlines your testing workflow.

## Features
✅ **Single Story Generation** - Fetch one JIRA issue at a time  
✅ **Batch Processing** - Process up to 10 JIRA issues simultaneously  
✅ **Smart Content Extraction** - Automatically parses User Story, Acceptance Criteria, and Business Rules  
✅ **Connection Validation** - Real-time status of JIRA connectivity  
✅ **Octane CSV Export** - Export test cases in Octane-compatible format

---

## Prerequisites
Before you begin, ensure you have:
- Access to a JIRA instance (Cloud or Data Center)
- JIRA account with permission to view issues
- Admin access to TestMate AI application.properties file

---

## Setup Instructions

### Step 1: Generate JIRA API Token

#### For JIRA Cloud:
1. **Navigate to Atlassian Account Security**
   - Go to: [https://id.atlassian.com/manage-profile/security/api-tokens](https://id.atlassian.com/manage-profile/security/api-tokens)
   - Log in with your Atlassian account

2. **Create API Token**
   - Click the **"Create API token"** button
   - Label: `TestMate AI` (or any descriptive name)
   - Click **"Create"**

3. **Copy the Token**
   - **IMPORTANT**: Copy the token immediately - you won't be able to see it again!
   - Store it securely (e.g., password manager)

#### For JIRA Data Center:
1. **Go to Personal Access Tokens**
   - Navigate to your JIRA instance
   - Go to: `Profile` → `Personal Access Tokens`
   
2. **Create Token**
   - Click **"Create token"**
   - Name: `TestMate AI`
   - Expiry: Choose appropriate duration
   - Click **"Create"**

3. **Copy the Token**
   - Save it securely

---

### Step 2: Configure Application Properties

1. **Locate Configuration File**
   ```
   TestMate AI Java/src/main/resources/application.properties
   ```

2. **Find JIRA Configuration Section**
   Look for the JIRA configuration block:
   ```properties
   # JIRA Configuration
   jira.enabled=false
   jira.url=https://your-company.atlassian.net
   jira.username=your-email@company.com
   jira.api.token=your-jira-api-token
   ```

3. **Update Configuration**
   Replace placeholders with your actual values:
   
   ```properties
   # JIRA Configuration
   jira.enabled=true
   jira.url=https://yourcompany.atlassian.net
   jira.username=john.doe@yourcompany.com
   jira.api.token=ATATT3xFfGF0abc123XYZ...
   ```

   **Configuration Details:**
   - `jira.enabled` - Set to `true` to activate JIRA integration
   - `jira.url` - Your JIRA instance URL (without trailing slash)
   - `jira.username` - Your JIRA login email
   - `jira.api.token` - The API token you generated in Step 1

---

### Step 3: Restart Application

1. **Stop the Application** (if running)
   - Press `Ctrl+C` in the terminal where Spring Boot is running

2. **Rebuild** (optional but recommended)
   ```bash
   mvn clean package
   ```

3. **Start the Application**
   ```bash
   mvn spring-boot:run
   ```

4. **Verify Startup**
   - Look for: `JiraRestClient bean initialized successfully`
   - No errors related to JIRA configuration

---

### Step 4: Verify Connection

1. **Open TestMate AI**
   - Navigate to: [http://localhost:8080/testmate](http://localhost:8080/testmate)

2. **Check JIRA Integration Tab**
   - Click on the **"🔗 JIRA Integration"** tab
   - Look for the connection status indicator

3. **Expected Status Messages:**
   - ✅ **Connected**: "JIRA Connected: Successfully connected to JIRA"
   - ⚠️ **Not Configured**: "JIRA Not Configured" (check application.properties)
   - ❌ **Connection Failed**: Check URL, credentials, and network

---

## Usage Guide

### Single Story Generation

1. **Switch to JIRA Integration Tab**
   - Click **"🔗 JIRA Integration"** at the top

2. **Enter JIRA Issue Key**
   - Format: `PROJECT-123` (e.g., `SARB-456`, `TEST-789`)
   - Project key must be uppercase
   - Number is the issue ID

3. **Click "🚀 Fetch & Generate"**
   - TestMate AI will:
     - Fetch the JIRA issue
     - Extract User Story, Acceptance Criteria, Business Rules
     - Generate comprehensive test cases
     - Display results with JIRA metadata

4. **Download CSV**
   - Click **"📥 Download CSV"** to export in Octane format

---

### Batch Story Generation

1. **Enter Multiple JIRA Keys**
   - One key per line (up to 10 keys)
   - Example:
     ```
     PROJ-101
     PROJ-102
     PROJ-103
     ```

2. **Click "🚀 Batch Fetch & Generate"**
   - Processes all stories in parallel
   - Shows success/failure for each

3. **Review Batch Results**
   - Green boxes = Success ✅
   - Red boxes = Failed ❌
   - All successful test cases combined in one view

4. **Export All**
   - Download CSV includes test cases from all successful stories

---

## JIRA Issue Requirements

### Recommended JIRA Story Format

For best results, structure your JIRA stories as follows:

#### Description Field:
```
User Story:
As a [user type], I want to [action] so that [benefit].

Acceptance Criteria:
1. Given [context], when [action], then [outcome]
2. Given [context], when [action], then [outcome]

Business Rules:
BR001: [Rule description]
BR002: [Rule description]
```

#### Supported Formats:
TestMate AI's smart parser supports:
- **Sections**: "User Story:", "Acceptance Criteria:", "Business Rules:"
- **Numbered Lists**: 1., 2., 3.
- **Bullet Points**: -, *, •
- **BR Format**: BR001, BR002, BR003
- **Gherkin Syntax**: Given/When/Then

---

## Troubleshooting

### ⚠️ "JIRA Not Configured"
**Cause**: `jira.enabled=false` or missing configuration  
**Solution**:
1. Check `application.properties`
2. Ensure `jira.enabled=true`
3. Verify all JIRA properties are set
4. Restart application

---

### ❌ "Connection Failed: 401 Unauthorized"
**Cause**: Invalid credentials  
**Solution**:
1. Verify `jira.username` is your email
2. Regenerate API token if expired
3. Check for extra spaces in configuration
4. Ensure API token has proper permissions

---

### ❌ "Connection Failed: 404 Not Found"
**Cause**: Incorrect JIRA URL  
**Solution**:
1. Verify `jira.url` format: `https://yourcompany.atlassian.net`
2. No trailing slash
3. Include `https://` protocol
4. For Data Center: Use full URL (e.g., `https://jira.yourcompany.com`)

---

### ❌ "Invalid JIRA key format"
**Cause**: Incorrectly formatted issue key  
**Solution**:
1. Format must be: `PROJECT-NUMBER`
2. Project key is uppercase letters: `PROJ`, `SARB`, `TEST`
3. Number is the issue ID: `123`, `456`
4. Valid examples: `SARB-100`, `TEST-42`
5. Invalid examples: `sarb-100`, `PROJ 123`, `PROJ_123`

---

### ⚠️ Issue Found But No Content Extracted
**Cause**: JIRA description is empty or unformatted  
**Solution**:
1. Check JIRA issue has a description
2. Use recommended format with sections
3. Manual Entry tab is alternative if JIRA format varies

---

### ❌ "Error: Issue does not exist or you do not have permission"
**Cause**: Issue key doesn't exist or no access  
**Solution**:
1. Verify issue key is correct
2. Check you have permission to view the issue
3. Log in to JIRA web UI and try viewing the issue
4. Contact JIRA admin for access if needed

---

### 🐌 Slow Performance
**Cause**: Network latency or large batch  
**Solution**:
1. Reduce batch size (fewer than 10 keys)
2. Check internet connection to JIRA
3. Try single story generation first
4. Check JIRA server status

---

## Security Best Practices

### ✅ Protect Your API Token
- **Never** commit `application.properties` with tokens to Git
- Use environment variables for production:
  ```properties
  jira.api.token=${JIRA_API_TOKEN}
  ```
- Store token in secure password manager
- Rotate tokens periodically (every 90 days)

### ✅ Limit Token Permissions
- API token inherits your JIRA permissions
- Use a service account with read-only access if possible
- Don't share tokens between applications

### ✅ Monitor Access
- Check JIRA audit logs for API usage
- Revoke token immediately if compromised
- Create new token if suspicious activity detected

---

## Advanced Configuration

### Custom Fields
If your JIRA uses custom fields for Story Points, Sprint, etc.:

1. **Check JiraService.java**
   - Locate `extractStoryPoints()` and `extractSprint()` methods
   - Update field names to match your JIRA configuration

2. **Example**:
   ```java
   private Double extractStoryPoints(Issue issue) {
       Object storyPoints = issue.getField("customfield_10016"); // Your field ID
       // ... rest of code
   }
   ```

### Connection Timeout
To adjust JIRA connection timeout:

1. **Modify JiraConfig.java**
2. **Add timeout configuration** (requires updating the client initialization)

---

## FAQ

**Q: Can I use JIRA Server (on-premise) instead of Cloud?**  
A: Yes! Just update `jira.url` to your JIRA Server URL and use Personal Access Token.

**Q: How many issues can I process at once?**  
A: Maximum 10 issues per batch to ensure performance. For larger batches, run multiple times.

**Q: Will this modify my JIRA issues?**  
A: No. TestMate AI only **reads** JIRA issues. It never creates, updates, or deletes JIRA data.

**Q: Can I use this with Jira Service Management (JSM)?**  
A: Yes, as long as you have access to view issues.

**Q: Does this work offline?**  
A: No. JIRA integration requires active internet connection to your JIRA instance.

**Q: What if my JIRA stories don't follow the recommended format?**  
A: Use the **"📝 Manual Entry"** or **"📄 Upload Document"** tabs as alternatives. The parser handles various formats, but structured content yields better results.

---

## Support

### Need Help?
- **Configuration Issues**: Check this guide's Troubleshooting section
- **Feature Requests**: Contact the TestMate AI team
- **Bug Reports**: Include error messages and JIRA configuration (mask sensitive data)

### Useful Links
- [Atlassian API Token Guide](https://support.atlassian.com/atlassian-account/docs/manage-api-tokens-for-your-atlassian-account/)
- [JIRA REST API Documentation](https://developer.atlassian.com/cloud/jira/platform/rest/v3/intro/)
- [TestMate AI Main Documentation](README.md)

---

## Version History

**v1.0.0** - Initial JIRA Integration Release
- Single story fetching
- Batch processing (up to 10 issues)
- Smart content extraction
- Connection validation
- Octane CSV export with JIRA metadata

---

*Last Updated: January 2025*
