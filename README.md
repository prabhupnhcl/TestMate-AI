# TestMate AI Java

An AI-Powered QA Agent that behaves as a Senior QA Engineer, analyzing JIRA stories and generating comprehensive functional test cases.

## 🎯 Features

- **Intelligent Story Analysis**: Parses User Stories, Acceptance Criteria, Business Rules, Assumptions, and Constraints
- **Comprehensive Test Case Generation**: Identifies positive, negative, error, and validation scenarios
- **Smart Validation**: Asks for clarification when information is missing or ambiguous
- **CSV Export**: Generates test cases in CSV format compatible with Octane and other test management tools
- **Professional UI**: Clean, modern web interface for easy interaction
- **Duplicate Detection**: Automatically removes duplicate test cases
- **QA Best Practices**: Follows senior QA engineer standards
- **AI Chatbot**: Interactive "Ask Me Anything" assistant with modern glassmorphism UI
- **Multi-Workflow Support**: Automatically detects and uses VS2 or VS4 workflows based on story content
- **📄 Multi-Document Support**: Upload and process multiple documents simultaneously
- **📧 Email Integration**: Send test cases directly via email
- **📊 Coverage Analysis**: Validate test coverage against requirements

## 🏗️ Architecture

### Backend
- **Framework**: Spring Boot 3.2.0
- **Language**: Java 17
- **Build Tool**: Maven
- **AI Integration**: HCL Cafe AI API (GPT-4.1)

### Frontend
- **HTML5**: Semantic markup
- **CSS3**: Modern, responsive design
- **JavaScript**: Vanilla JS (no frameworks)

## 📋 Prerequisites

- Java 17 or higher
- Maven 3.6 or higher
- Internet connection (for HCL Cafe AI API)

## 🚀 Quick Start

### 1. Clone the Repository

```bash
git clone <repository-url>
cd "TestMate AI Java"
```

### 2. Build the Project

```bash
mvn clean install
```

### 3. Run the Application

```bash
mvn spring-boot:run
```

### 4. Access the Application

Open your browser and navigate to:
```
http://localhost:8080/testmate
```

## 📁 Project Structure

```
TestMate AI Java/
├── src/
│   ├── main/
│   │   ├── java/com/hcl/testmate/
│   │   │   ├── TestMateApplication.java
│   │   │   ├── config/
│   │   │   │   ├── HclCafeAiConfig.java
│   │   │   │   └── WebConfig.java
│   │   │   ├── controller/
│   │   │   │   ├── TestCaseController.java
│   │   │   │   └── WebController.java
│   │   │   ├── model/
│   │   │   │   ├── JiraStoryRequest.java
│   │   │   │   ├── TestCase.java
│   │   │   │   ├── TestCaseResponse.java
│   │   │   │   ├── MultiDocumentResponse.java
│   │   │   │   └── HclCafeAiModels.java
│   │   │   ├── service/
│   │   │   │   ├── HclCafeAiService.java
│   │   │   │   ├── CsvGeneratorService.java
│   │   │   │   ├── TestCaseGeneratorService.java
│   │   │   │   └── DocumentParserService.java
│   │   │   └── exception/
│   │   │       └── GlobalExceptionHandler.java
│   │   └── resources/
│   │       ├── application.properties
│   │       └── static/
│   │           ├── index.html
│   │           ├── css/styles.css
│   │           └── js/app.js
│   └── test/
├── pom.xml
└── README.md
```

## 🔧 Configuration

The application is configured in `src/main/resources/application.properties`:

```properties
# Server Configuration
server.port=8080
server.servlet.context-path=/testmate

# HCL Cafe AI Configuration
hcl.cafe.ai.api-key=ee6f82c2-2084-4504-99a7-2f080df7cef9
hcl.cafe.ai.base-url=https://aicafe.hcl.com/AICafeService/api/v1/subscription/openai/deployments
hcl.cafe.ai.deployment-name=gpt-4.1
hcl.cafe.ai.api-version=2024-12-01-preview
hcl.cafe.ai.model=gpt-4.1
hcl.cafe.ai.max-tokens=10000
hcl.cafe.ai.temperature=0.7

# Workflow Document Configuration (NEW!)
workflow.vs4.document.path=Application Workflow for VS4 Functionality.docx
workflow.vs2.document.path=VS2 Flow.docx
```

### Multi-Workflow Support

TestMate AI now supports multiple application workflows:

- **VS4 Workflow**: For Value Stream 4 stories
- **VS2 Workflow**: For Value Stream 2 stories

The system automatically detects which workflow to use based on:
1. JIRA story key (e.g., if key contains "VS2" or "VS-2")
2. User story content (mentions of "VS2", "Value Stream 2", etc.)

Place your workflow documents (`Application Workflow for VS4 Functionality.docx` and `VS2 Flow.docx`) in the project root directory.

See [WORKFLOW_INTEGRATION.md](WORKFLOW_INTEGRATION.md) for detailed information.

## 📝 Usage

### 1. Fill in JIRA Story Details

- **User Story** (Required): The main user story
- **Acceptance Criteria**: Define success conditions
- **Business Rules**: Any business constraints
- **Assumptions**: Assumptions made
- **Constraints**: Technical or business constraints
- **Additional Notes**: Any other relevant information

### 2. Generate Test Cases

Click the "Generate Test Cases" button. The AI will:
- Validate the story for completeness
- Ask for clarification if needed
- Generate comprehensive test cases
- Remove duplicates
- Display results

### 3. Download or Copy

- **Download CSV**: Export test cases as CSV file
- **Copy to Clipboard**: Copy CSV content for pasting

## 🎨 Test Case Format

Each test case includes:
- **Test Case ID**: TC-001, TC-002, etc.
- **Test Scenario**: Brief description
- **Preconditions**: Setup requirements
- **Test Steps**: Numbered, clear steps
- **Expected Result**: Expected outcome
- **Priority**: High, Medium, Low
- **Test Type**: Positive, Negative, Validation, Error

## 🔌 API Endpoints

### Generate Test Cases
```http
POST /testmate/api/testcases/generate
Content-Type: application/json

{
  "userStory": "As a user...",
  "acceptanceCriteria": "Given... When... Then...",
  "businessRules": "...",
  "assumptions": "...",
  "constraints": "...",
  "additionalNotes": "..."
}
```

### Download CSV
```http
POST /testmate/api/testcases/generate/csv
Content-Type: application/json

{
  "userStory": "As a user...",
  ...
}
```

### Health Check
```http
GET /testmate/api/testcases/health
```

## 📊 CSV Format

The generated CSV is compatible with Octane and follows this structure:

```csv
Test Case ID,Test Scenario,Preconditions,Test Steps,Expected Result,Priority,Test Type
TC-001,Verify login with valid credentials,User account exists,"1. Navigate to login page
2. Enter username
3. Enter password
4. Click login",User is logged in successfully,High,Positive
```

## 🛠️ Development

### Build
```bash
mvn clean install
```

### Run Tests
```bash
mvn test
```

### Run with Debug
```bash
mvn spring-boot:run -Dspring-boot.run.jvmArguments="-Xdebug -Xrunjdwp:transport=dt_socket,server=y,suspend=n,address=5005"
```

## 📦 Dependencies

- Spring Boot Starter Web
- Spring Boot Starter Validation
- Lombok
- Apache Commons CSV
- Jackson (JSON processing)
- Apache HTTP Client 5

## 🌟 Guidelines Compliance

### Guideline 1
✅ Parses User Story, Acceptance Criteria, Business Rules, Assumptions, Constraints  
✅ Identifies positive, negative, error, and validation scenarios

### Guideline 2
✅ Does not assume missing requirements  
✅ Asks for clarification when AC or BR are missing/ambiguous  
✅ Includes all required test case fields  
✅ Removes duplicate test cases  
✅ Follows QA best practices

### Guideline 3
✅ Generates CSV format only  
✅ Compatible with Octane tool  
✅ Proper CSV formatting  
✅ Supports future automation readiness  
✅ Scalable for regression, smoke, and sanity tests

## 🔒 Security

- Input validation on all fields
- XSS prevention in frontend
- CORS configuration for API security
- API key stored in configuration (consider using environment variables for production)

## 🚀 Deployment

### Production Deployment

1. Update `application.properties` for production:
```properties
server.port=80
# Use environment variables for sensitive data
hcl.cafe.ai.api-key=${HCL_CAFE_AI_API_KEY}
```

2. Build JAR:
```bash
mvn clean package
```

3. Run:
```bash
java -jar target/testmate-ai-java-1.0.0.jar
```

### Docker Deployment (Optional)

Create a `Dockerfile`:
```dockerfile
FROM openjdk:17-jdk-slim
WORKDIR /app
COPY target/testmate-ai-java-1.0.0.jar app.jar
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]
```

Build and run:
```bash
docker build -t testmate-ai .
docker run -p 8080:8080 testmate-ai
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## 📄 License

Copyright © 2025 HCL Technologies

## 📧 Support

For issues or questions, please contact the development team.

## 🎯 Future Enhancements

- [ ] Support for multiple test management tools
- [ ] Automated regression test suite generation
- [ ] Integration with JIRA API
- [ ] Test case versioning
- [ ] User authentication
- [ ] Test execution tracking
- [ ] Custom test case templates
- [ ] Bulk import from JIRA

---

**Powered by HCL Cafe AI** 🤖
