package com.hcl.testmate.service;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.ArrayList;
import java.util.Base64;
import java.util.List;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.hcl.testmate.model.JiraStory;

@Service
public class JiraService {
    private static final Logger log = LoggerFactory.getLogger(JiraService.class);
    private final JiraClientFactory jiraClientFactory;
    private final ObjectMapper objectMapper = new ObjectMapper();

    public JiraService(JiraClientFactory jiraClientFactory) {
        this.jiraClientFactory = jiraClientFactory;
    }

    /**
     * Fetch a JIRA story using user-provided credentials
     */
    public JiraStory fetchStory(String jiraUrl, String username, String apiToken, String issueKey) {
        // Validate issue key format
        if (issueKey == null || issueKey.trim().isEmpty()) {
            throw new IllegalArgumentException("Issue key cannot be empty");
        }
        
        String cleanIssueKey = issueKey.trim().toUpperCase();
        if (!cleanIssueKey.matches("^[A-Z0-9]+-\\d+$")) {
            throw new IllegalArgumentException("Invalid JIRA issue key format: '" + issueKey + "'. Expected format: PROJECT-123 (e.g., PROJ-456, R2CX-1234)");
        }
        
        try {
            log.info("Fetching JIRA story: {} from URL: {} for user: {}", cleanIssueKey, jiraUrl, username);
            
            // Use HTTP client approach with multiple fallback strategies
            String auth = Base64.getEncoder().encodeToString((username + ":" + apiToken).getBytes(StandardCharsets.UTF_8));
            HttpClient client = HttpClient.newHttpClient();
            
            // Try multiple API endpoints in order of preference
            String[] apiEndpoints = {
                "/rest/api/2/issue/" + cleanIssueKey,     // Standard API v2
                "/rest/api/3/issue/" + cleanIssueKey,     // API v3 (newer)
                "/rest/api/latest/issue/" + cleanIssueKey // Latest available
            };
            
            JiraStory result = null;
            String lastError = null;
            
            for (String endpoint : apiEndpoints) {
                String apiUrl = jiraUrl + endpoint;
                log.info("Attempting JIRA API call to: {}", apiUrl);
                
                try {
                    HttpRequest request = HttpRequest.newBuilder()
                            .uri(URI.create(apiUrl))
                            .header("Authorization", "Basic " + auth)
                            .header("Content-Type", "application/json")
                            .header("Accept", "application/json")
                            .header("User-Agent", "TestMate-JIRA-Client/1.0")
                            .GET()
                            .build();
                            
                    HttpResponse<String> response = client.send(request, HttpResponse.BodyHandlers.ofString());
                    
                    log.info("JIRA API Response - Endpoint: {}, Status: {}, Content-Length: {}", 
                        endpoint, response.statusCode(), 
                        response.headers().firstValue("content-length").orElse("unknown"));
                    
                    if (response.statusCode() == 200) {
                        log.info("Successfully fetched JIRA issue: {} using endpoint: {}", cleanIssueKey, endpoint);
                        result = parseJiraStoryFromJson(response.body());
                        break; // Success, exit loop
                    } else if (response.statusCode() == 404) {
                        log.warn("JIRA issue not found via endpoint: {} - trying next endpoint", endpoint);
                        lastError = "Issue not found via endpoint: " + endpoint;
                    } else if (response.statusCode() == 401) {
                        log.error("JIRA authentication failed for endpoint: {}", endpoint);
                        throw new RuntimeException("JIRA authentication failed. Please verify your username and API token are correct.");
                    } else if (response.statusCode() == 403) {
                        log.error("JIRA access forbidden for issue: {} via endpoint: {}", cleanIssueKey, endpoint);
                        lastError = "Access forbidden via endpoint: " + endpoint;
                    } else {
                        log.warn("JIRA API error for endpoint: {} - Status: {}, Response: {}", endpoint, response.statusCode(), response.body());
                        lastError = "API error " + response.statusCode() + " via endpoint: " + endpoint;
                    }
                } catch (Exception e) {
                    log.warn("Failed to connect to endpoint: {} - {}", endpoint, e.getMessage());
                    lastError = "Connection failed to endpoint: " + endpoint + " - " + e.getMessage();
                }
            }
            
            // If direct API calls failed, try search API as last resort
            if (result == null) {
                log.info("Direct API calls failed, attempting search API for issue: {}", cleanIssueKey);
                result = fetchViaSearchApi(jiraUrl, auth, cleanIssueKey, client);
            }
            
            if (result != null) {
                return result;
            }
            
            // All methods failed
            throw new RuntimeException("JIRA issue '" + cleanIssueKey + "' not found via any API endpoint, but you can access it in browser.\n" +
                "This suggests an API permission issue. Please check:\n" +
                "1. Your API token has the same permissions as your web login\n" +
                "2. The project allows API access (some projects restrict API access)\n" +
                "3. Your JIRA admin may need to grant API access permissions\n" +
                "4. Try regenerating your API token in JIRA settings\n" +
                "5. Contact your JIRA admin to enable API access for this project\n" +
                "\nLast error: " + lastError +
                "\nBrowser URL works: " + jiraUrl + "/browse/" + cleanIssueKey +
                "\nAPI endpoints tested: " + String.join(", ", apiEndpoints));
        } catch (Exception e) {
            log.error("Failed to fetch JIRA story: {}", cleanIssueKey, e);
            if (e instanceof InterruptedException) {
                Thread.currentThread().interrupt();
            }
            throw new RuntimeException("Failed to fetch JIRA story: " + e.getMessage());
        }
    }

    /**
     * Fetch multiple JIRA stories using user-provided credentials
     */
    public List<JiraStory> fetchMultipleStories(String jiraUrl, String username, String apiToken, List<String> issueKeys) {
        List<JiraStory> stories = new ArrayList<>();
        
        for (String issueKey : issueKeys) {
            try {
                stories.add(fetchStory(jiraUrl, username, apiToken, issueKey));
            } catch (Exception e) {
                log.error("Failed to fetch story: {}", issueKey, e);
            }
        }
        
        return stories;
    }

    /**
     * Fetch stories from JIRA projects or specific issue keys using JQL search
     */
    public List<JiraStory> fetchStoriesByProjects(String jiraUrl, String username, String apiToken, List<String> projectKeys) {
        List<JiraStory> stories = new ArrayList<>();
        
        try {
            log.info("Fetching stories from projects/issues: {} for user: {}", projectKeys, username);
            
            // Separate issue keys from project keys
            List<String> issueKeys = new ArrayList<>();
            List<String> projects = new ArrayList<>();
            
            for (String key : projectKeys) {
                String trimmedKey = key.trim().toUpperCase();
                if (trimmedKey.matches("^[A-Z0-9]+-\\d+$")) {
                    // This is an issue key (e.g., R2CX-1234)
                    issueKeys.add(trimmedKey);
                } else {
                    // This is a project key (e.g., R2CX)
                    projects.add(trimmedKey);
                }
            }
            
            log.info("Detected {} issue keys and {} project keys", issueKeys.size(), projects.size());
            
            // Fetch specific issues if issue keys were provided
            if (!issueKeys.isEmpty()) {
                for (String issueKey : issueKeys) {
                    try {
                        JiraStory story = fetchStory(jiraUrl, username, apiToken, issueKey);
                        stories.add(story);
                        log.info("Fetched specific issue: {}", issueKey);
                    } catch (Exception e) {
                        log.error("Failed to fetch issue: {}", issueKey, e);
                    }
                }
            }
            
            // Fetch stories from projects if project keys were provided
            if (!projects.isEmpty()) {
                String auth = Base64.getEncoder().encodeToString((username + ":" + apiToken).getBytes(StandardCharsets.UTF_8));
                HttpClient client = HttpClient.newHttpClient();
                
                // Build JQL query for projects - use issuetype instead of type
                String projectsJql = projects.stream()
                    .map(key -> "project = " + key.trim())
                    .reduce((a, b) -> a + " OR " + b)
                    .orElse("");
                
                // Try without issue type filter first, then with it
                String[] jqlVariants = {
                    projectsJql + " ORDER BY created DESC",  // No issue type filter
                    projectsJql + " AND issuetype = Story ORDER BY created DESC",  // With Story filter
                    projectsJql + " AND type in (Story, Task, Bug) ORDER BY created DESC"  // Multiple types
                };
                
                for (String jql : jqlVariants) {
                    String encodedJql = java.net.URLEncoder.encode(jql, StandardCharsets.UTF_8);
                
                    // Try multiple API endpoints
                    String[] apiEndpoints = {
                        "/rest/api/3/search?jql=" + encodedJql + "&maxResults=50",     // API v3 (newer)
                        "/rest/api/2/search?jql=" + encodedJql + "&maxResults=50",     // API v2
                        "/rest/api/latest/search?jql=" + encodedJql + "&maxResults=50" // Latest
                    };
                    
                    String lastError = null;
                    
                    for (String endpoint : apiEndpoints) {
                        String searchUrl = jiraUrl + endpoint;
                        log.info("Attempting JIRA search API: {}", searchUrl);
                        log.info("JQL query: {}", jql);
                        
                        try {
                            HttpRequest request = HttpRequest.newBuilder()
                                    .uri(URI.create(searchUrl))
                                    .header("Authorization", "Basic " + auth)
                                    .header("Content-Type", "application/json")
                                    .header("Accept", "application/json")
                                    .header("User-Agent", "TestMate-JIRA-Client/1.0")
                                    .GET()
                                    .build();
                                    
                            HttpResponse<String> response = client.send(request, HttpResponse.BodyHandlers.ofString());
                            
                            log.info("JQL search response - Endpoint: {}, Status: {}", endpoint, response.statusCode());
                            
                            if (response.statusCode() == 200) {
                                JsonNode searchResult = objectMapper.readTree(response.body());
                                JsonNode issues = searchResult.path("issues");
                                
                                if (issues.isArray()) {
                                    for (JsonNode issue : issues) {
                                        try {
                                            JiraStory story = parseJiraStoryFromJsonNode(issue);
                                            stories.add(story);
                                        } catch (Exception e) {
                                            log.error("Failed to parse JIRA story: {}", e.getMessage());
                                        }
                                    }
                                    log.info("Successfully fetched {} issues from projects: {} using endpoint: {} with JQL: {}", stories.size(), projects, endpoint, jql);
                                    
                                    // Success - return immediately
                                    if (!stories.isEmpty()) {
                                        log.info("Total stories fetched: {}", stories.size());
                                        return stories;
                                    }
                                }
                            } else if (response.statusCode() == 401) {
                                throw new RuntimeException("Authentication failed. Please verify your credentials.");
                            } else if (response.statusCode() == 400) {
                                log.warn("Invalid JQL query via endpoint: {} - Response: {}", endpoint, response.body());
                                lastError = "Invalid JQL: " + jql;
                            } else if (response.statusCode() == 410) {
                                log.warn("API endpoint deprecated: {} - trying next endpoint", endpoint);
                                lastError = "API deprecated: " + endpoint;
                            } else {
                                log.warn("Failed via endpoint: {} - Status: {}, Response: {}", endpoint, response.statusCode(), response.body());
                                lastError = "Status " + response.statusCode() + ": " + endpoint;
                            }
                        } catch (Exception e) {
                            log.warn("Failed to connect to endpoint: {} - {}", endpoint, e.getMessage());
                            lastError = "Connection failed: " + e.getMessage();
                        }
                    }
                }
                
                // If we got here and have issue keys results, that's OK
                if (!issueKeys.isEmpty() && !stories.isEmpty()) {
                    log.info("Fetched {} stories from issue keys", stories.size());
                    return stories;
                }
                
                // No success with any variant
                throw new RuntimeException("Unable to fetch stories from project(s) " + projects + 
                    ". The JIRA search API may not be available or the project keys may be incorrect. " +
                    "Try using specific issue keys (e.g., R2CX-1234) instead.");
            }
            
            log.info("Total stories fetched: {}", stories.size());
            
        } catch (Exception e) {
            log.error("Failed to fetch stories from projects: {}", projectKeys, e);
            if (e instanceof InterruptedException) {
                Thread.currentThread().interrupt();
            }
            throw new RuntimeException("Failed to fetch stories: " + e.getMessage());
        }
        
        return stories;
    }

    /**
     * Attempt to fetch JIRA issue via search API when direct access fails
     */
    private JiraStory fetchViaSearchApi(String jiraUrl, String auth, String issueKey, HttpClient client) {
        try {
            String searchUrl = jiraUrl + "/rest/api/2/search?jql=key=" + issueKey;
            log.info("Attempting search API: {}", searchUrl);
            
            HttpRequest searchRequest = HttpRequest.newBuilder()
                    .uri(URI.create(searchUrl))
                    .header("Authorization", "Basic " + auth)
                    .header("Content-Type", "application/json")
                    .header("Accept", "application/json")
                    .header("User-Agent", "TestMate-JIRA-Client/1.0")
                    .GET()
                    .build();
                    
            HttpResponse<String> searchResponse = client.send(searchRequest, HttpResponse.BodyHandlers.ofString());
            
            log.info("Search API Response - Status: {}", searchResponse.statusCode());
            
            if (searchResponse.statusCode() == 200) {
                JsonNode searchResult = objectMapper.readTree(searchResponse.body());
                JsonNode issues = searchResult.path("issues");
                
                if (issues.isArray() && issues.size() > 0) {
                    JsonNode issue = issues.get(0);
                    log.info("Successfully found JIRA issue: {} via search API", issueKey);
                    return parseJiraStoryFromJsonNode(issue);
                } else {
                    log.warn("Search API returned no results for issue: {}", issueKey);
                }
            } else {
                log.warn("Search API failed with status: {} for issue: {}", searchResponse.statusCode(), issueKey);
            }
        } catch (Exception e) {
            log.warn("Search API attempt failed for issue: {} - {}", issueKey, e.getMessage());
        }
        return null;
    }
    
    /**
     * Parse JIRA story from JSON response
     */
    private JiraStory parseJiraStoryFromJson(String jsonResponse) {
        try {
            log.debug("Parsing JIRA JSON response (length: {} chars)", jsonResponse.length());
            JsonNode root = objectMapper.readTree(jsonResponse);
            return parseJiraStoryFromJsonNode(root);
        } catch (Exception e) {
            log.error("Failed to parse JIRA JSON response: {}", e.getMessage(), e);
            log.debug("JSON Response that failed to parse: {}", jsonResponse);
            throw new RuntimeException("Failed to parse JIRA response: " + e.getMessage());
        }
    }
    
    /**
     * Parse JIRA story from JsonNode (shared between direct API and search API)
     */
    private JiraStory parseJiraStoryFromJsonNode(JsonNode root) {
        JsonNode fields = root.path("fields");
        
        JiraStory story = new JiraStory();
        
        // Basic fields
        story.setIssueKey(getTextValue(root, "key"));
        story.setSummary(getTextValue(fields, "summary"));
        story.setDescription(getTextValue(fields, "description"));
        
        // Nested object fields
        story.setIssueType(getTextValue(fields.path("issuetype"), "name"));
        story.setStatus(getTextValue(fields.path("status"), "name"));
        story.setPriority(getTextValue(fields.path("priority"), "name"));
        story.setReporter(getTextValue(fields.path("reporter"), "displayName"));
        story.setAssignee(getTextValue(fields.path("assignee"), "displayName"));
        story.setProject(getTextValue(fields.path("project"), "name"));
        
        // Extract user story and acceptance criteria from description
        String description = story.getDescription();
        if (description != null) {
            log.debug("Description length: {} chars", description.length());
            log.debug("Description contains 'Acceptance Criteria': {}", description.contains("Acceptance Criteria"));
            log.debug("Description contains 'Given': {}", description.contains("Given"));
            log.debug("Description preview: {}", description.length() > 200 ? description.substring(0, 200) + "..." : description);
            
            story.setUserStory(extractUserStory(description));
            List<String> acList = extractAcceptanceCriteria(description);
            log.debug("Extracted AC from JIRA: {} criteria found", acList.size());
            if (!acList.isEmpty()) {
                log.debug("First AC item: {}", acList.get(0).length() > 100 ? acList.get(0).substring(0, 100) + "..." : acList.get(0));
            }
            story.setAcceptanceCriteria(acList);
            story.setBusinessRules(extractBusinessRules(description));
        }
        
        log.debug("Parsed JIRA story - Key: {}, Summary: {}, Project: {}", 
            story.getIssueKey(), story.getSummary(), story.getProject());
        
        return story;
    }
    
    /**
     * Safely extract text value from JsonNode
     */
    private String getTextValue(JsonNode node, String fieldName) {
        JsonNode fieldNode = node.path(fieldName);
        return fieldNode.isTextual() ? fieldNode.asText() : null;
    }

    /**
     * Validate JIRA connection using user-provided credentials
     */
    public boolean validateConnection(String jiraUrl, String username, String apiToken) {
        try {
            log.info("Validating JIRA connection to: {} for user: {}", jiraUrl, username);
            log.debug("API Token (first 10 chars): {}...", apiToken != null && apiToken.length() > 10 ? apiToken.substring(0, 10) : apiToken);
            
            // Validate inputs
            if (jiraUrl == null || jiraUrl.trim().isEmpty()) {
                throw new RuntimeException("JIRA URL cannot be empty");
            }
            if (username == null || username.trim().isEmpty()) {
                throw new RuntimeException("Username cannot be empty");
            }
            if (apiToken == null || apiToken.trim().isEmpty()) {
                throw new RuntimeException("API Token cannot be empty");
            }
            
            // Check if API token looks like random numbers (basic validation)
            if (apiToken.matches("^\\d+$") && apiToken.length() < 20) {
                log.error("API token appears to be just numbers: {}", apiToken);
                throw new RuntimeException("Invalid API token format. API tokens should not be just numbers. Please generate a valid API token from JIRA.");
            }
            
            // Validate URL format
            try {
                URI uri = URI.create(jiraUrl);
                if (uri.getScheme() == null || (!uri.getScheme().equals("http") && !uri.getScheme().equals("https"))) {
                    throw new RuntimeException("JIRA URL must start with http:// or https://");
                }
            } catch (IllegalArgumentException e) {
                throw new RuntimeException("Invalid JIRA URL format: " + e.getMessage());
            }
            
            String auth = Base64.getEncoder().encodeToString((username + ":" + apiToken).getBytes(StandardCharsets.UTF_8));
            
            HttpClient client = HttpClient.newBuilder()
                    .connectTimeout(Duration.ofSeconds(10))
                    .build();
            
            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(jiraUrl + "/rest/api/2/serverInfo"))
                    .header("Authorization", "Basic " + auth)
                    .header("Content-Type", "application/json")
                    .header("Accept", "application/json")
                    .timeout(Duration.ofSeconds(10))
                    .GET()
                    .build();
                    
            HttpResponse<String> response = client.send(request, HttpResponse.BodyHandlers.ofString());
            
            log.debug("JIRA validation response status: {}, body: {}", response.statusCode(), response.body());
            
            if (response.statusCode() == 200) {
                // Verify the response is actually from JIRA by checking for expected fields
                String responseBody = response.body();
                if (responseBody == null || responseBody.trim().isEmpty()) {
                    throw new RuntimeException("Empty response from server. This does not appear to be a valid JIRA instance.");
                }
                
                // Check if response contains JIRA-specific fields
                if (!responseBody.contains("serverTitle") && !responseBody.contains("version") && !responseBody.contains("baseUrl")) {
                    log.error("Response does not appear to be from JIRA. Response: {}", responseBody);
                    throw new RuntimeException("The URL does not appear to be a valid JIRA instance. Please verify the URL.");
                }
                
                log.info("Successfully validated JIRA connection to: {}", jiraUrl);
                return true;
            } else if (response.statusCode() == 401 || response.statusCode() == 403) {
                log.error("JIRA authentication failed - Invalid credentials for user: {}", username);
                throw new RuntimeException("Authentication failed. Please verify your username and API token are correct.");
            } else if (response.statusCode() == 404) {
                log.error("JIRA URL not found: {}", jiraUrl);
                throw new RuntimeException("JIRA server not found at URL: " + jiraUrl + ". Please verify the URL is correct.");
            } else {
                log.error("JIRA connection validation failed with status: {}", response.statusCode());
                throw new RuntimeException("Connection failed with status: " + response.statusCode() + ". Please check your JIRA URL and credentials.");
            }
        } catch (RuntimeException e) {
            // Re-throw RuntimeExceptions as-is (these are our custom error messages)
            throw e;
        } catch (java.net.http.HttpTimeoutException e) {
            log.error("JIRA connection timeout: {}", e.getMessage());
            throw new RuntimeException("Connection timeout. Please verify the JIRA URL and network connectivity.");
        } catch (java.net.UnknownHostException e) {
            log.error("JIRA host not found: {}", e.getMessage());
            throw new RuntimeException("Could not connect to JIRA server. Please verify the URL is correct.");
        } catch (java.net.ConnectException e) {
            log.error("Connection refused to JIRA: {}", e.getMessage());
            throw new RuntimeException("Connection refused. Please verify the JIRA URL and network connectivity.");
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            log.error("JIRA connection validation interrupted: {}", e.getMessage());
            throw new RuntimeException("Connection attempt was interrupted.");
        } catch (Exception e) {
            log.error("JIRA connection validation failed: {}", e.getMessage());
            throw new RuntimeException("Connection failed: " + e.getMessage());
        }
    }

    private String extractUserStory(String description) {
        // Extract content between "User Story:" and next section
        Pattern pattern = Pattern.compile("(?i)user story:?\\s*(.+?)(?=acceptance criteria|business rules|assumptions|pre-?conditions|description:|$)", Pattern.DOTALL);
        Matcher matcher = pattern.matcher(description);
        
        if (matcher.find()) {
            return matcher.group(1).trim();
        }
        
        // Look for "As a... I want... So that..." pattern
        pattern = Pattern.compile("(?i)(as a .+?(?:i want|i need).+?(?:so that|in order to).+?)(?=\\n\\n|$)", Pattern.DOTALL);
        matcher = pattern.matcher(description);
        
        if (matcher.find()) {
            return matcher.group(1).trim();
        }
        
        // Fallback: return first paragraph
        String[] paragraphs = description.split("\\n\\n");
        return paragraphs.length > 0 ? paragraphs[0].trim() : description;
    }

    private List<String> extractAcceptanceCriteria(String description) {
        List<String> criteria = new ArrayList<>();
        
        // Look for "Acceptance Criteria:" section
        Pattern sectionPattern = Pattern.compile("(?i)acceptance criteria:?\\s*(.+?)(?=business rules|assumptions|constraints|pre-?conditions|$)", Pattern.DOTALL);
        Matcher sectionMatcher = sectionPattern.matcher(description);
        
        if (sectionMatcher.find()) {
            String acSection = sectionMatcher.group(1).trim();
            
            // Extract numbered items or bullet points
            Pattern itemPattern = Pattern.compile("(?m)^\\s*(?:\\d+\\.|[-*•])\\s*(.+?)(?=\\n\\s*(?:\\d+\\.|[-*•])|$)", Pattern.DOTALL);
            Matcher itemMatcher = itemPattern.matcher(acSection);
            
            while (itemMatcher.find()) {
                String criterion = itemMatcher.group(1).trim();
                if (!criterion.isEmpty()) {
                    criteria.add(criterion);
                }
            }
            
            // If no items found, look for "Given...When...Then" patterns
            if (criteria.isEmpty()) {
                Pattern gwtPattern = Pattern.compile("(?i)(given.+?when.+?then.+?)(?=given|$)", Pattern.DOTALL);
                Matcher gwtMatcher = gwtPattern.matcher(acSection);
                
                while (gwtMatcher.find()) {
                    criteria.add(gwtMatcher.group(1).trim());
                }
            }
            
            // If still no items found, split by lines and extract non-empty meaningful lines
            if (criteria.isEmpty()) {
                // Remove Given/When/Then headers if present
                String cleanedSection = acSection.replaceAll("(?i)^\\s*(given|when|then)\\s*$", "");
                
                // Split by newlines and extract meaningful criteria
                String[] lines = cleanedSection.split("\\n");
                for (String line : lines) {
                    String trimmedLine = line.trim();
                    // Keep lines that are meaningful (longer than 20 chars and not just headers)
                    if (trimmedLine.length() > 20 && 
                        !trimmedLine.matches("(?i)^(given|when|then|and|but)\\s*$")) {
                        criteria.add(trimmedLine);
                    }
                }
            }
        }
        
        return criteria;
    }

    private List<String> extractBusinessRules(String description) {
        List<String> rules = new ArrayList<>();
        
        // Look for "Business Rules:" section
        Pattern sectionPattern = Pattern.compile("(?i)business rules:?\\s*(.+?)(?=assumptions|constraints|acceptance criteria|pre-?conditions|$)", Pattern.DOTALL);
        Matcher sectionMatcher = sectionPattern.matcher(description);
        
        if (sectionMatcher.find()) {
            String brSection = sectionMatcher.group(1).trim();
            
            // Extract BR001, BR002 style or numbered items
            Pattern itemPattern = Pattern.compile("(?m)^\\s*(?:BR\\d+:|\\d+\\.|[-*•])\\s*(.+?)(?=\\n\\s*(?:BR\\d+:|\\d+\\.|[-*•])|$)", Pattern.DOTALL);
            Matcher itemMatcher = itemPattern.matcher(brSection);
            
            while (itemMatcher.find()) {
                String rule = itemMatcher.group(1).trim();
                if (!rule.isEmpty()) {
                    rules.add(rule);
                }
            }
        }
        
        return rules;
    }

}
