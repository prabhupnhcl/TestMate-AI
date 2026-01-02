# Quick Start Guide

## Running the Application

1. **Build the project**
   ```bash
   mvn clean install
   ```

2. **Run the application**
   ```bash
   mvn spring-boot:run
   ```

3. **Access the web interface**
   Open your browser and go to: `http://localhost:8080/testmate`

## Using the Application

### Step 1: Enter JIRA Story Details
Fill in the form with your JIRA story information:
- **User Story** (Required): The main user story
- **Acceptance Criteria**: Define success conditions
- **Business Rules**: Business constraints and rules
- **Assumptions**: Any assumptions
- **Constraints**: Technical or business constraints

### Step 2: Generate Test Cases
Click "Generate Test Cases" button. The AI will:
1. Validate your story for completeness
2. Ask for clarification if needed
3. Generate comprehensive test cases
4. Display the results

### Step 3: Download or Copy
- Click "Download CSV" to save as a file
- Click "Copy to Clipboard" to copy the CSV content

## Example JIRA Story

**User Story:**
```
As a registered user, I want to log into the system using my email and password, 
so that I can access my account dashboard.
```

**Acceptance Criteria:**
```
Given I am on the login page
When I enter valid email and password
And I click the login button
Then I should be redirected to my dashboard

Given I am on the login page
When I enter invalid credentials
And I click the login button
Then I should see an error message "Invalid credentials"

Given I am on the login page
When I leave email or password empty
And I click the login button
Then I should see validation errors
```

**Business Rules:**
```
- Password must be at least 8 characters
- Email must be a valid format
- Account gets locked after 5 failed login attempts
- Session expires after 30 minutes of inactivity
```

## Troubleshooting

### Application won't start
- Ensure Java 17 is installed: `java -version`
- Ensure Maven is installed: `mvn -version`
- Check if port 8080 is available

### Test cases not generating
- Check your internet connection
- Verify the HCL Cafe AI API is accessible
- Check the application logs for errors

### CSV download not working
- Check browser download settings
- Try using "Copy to Clipboard" instead

## API Testing with cURL

Test the API directly:

```bash
curl -X POST http://localhost:8080/testmate/api/testcases/generate \
  -H "Content-Type: application/json" \
  -d '{
    "userStory": "As a user, I want to login",
    "acceptanceCriteria": "Given valid credentials, when I login, then I see dashboard"
  }'
```

## Next Steps

- Read the full [README.md](README.md) for detailed documentation
- Explore the source code in `src/main/java/com/hcl/testmate/`
- Customize the UI in `src/main/resources/static/`
- Modify configuration in `src/main/resources/application.properties`
