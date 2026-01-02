package com.hcl.testmate.service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicInteger;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import com.hcl.testmate.model.DashboardMetrics;
import com.hcl.testmate.model.DashboardMetrics.RecentActivity;

/**
 * Service for tracking and providing analytics dashboard metrics
 */
@Service
public class AnalyticsService {
    private static final Logger log = LoggerFactory.getLogger(AnalyticsService.class);
    
    // In-memory storage for demo purposes
    private final Map<LocalDate, AtomicInteger> dailyStoryCount = new ConcurrentHashMap<>();
    private final Map<LocalDate, AtomicInteger> dailyTestCaseCount = new ConcurrentHashMap<>();
    private final Map<LocalDate, Set<String>> dailyUsers = new ConcurrentHashMap<>();
    private final List<RecentActivity> recentActivities = Collections.synchronizedList(new ArrayList<>());
    
    private final AtomicInteger totalStoriesProcessed = new AtomicInteger(0);
    private final AtomicInteger totalTestCasesGenerated = new AtomicInteger(0);
    private final AtomicInteger positiveTestCases = new AtomicInteger(0);
    private final AtomicInteger negativeTestCases = new AtomicInteger(0);
    private final AtomicInteger criticalTestCases = new AtomicInteger(0);
    
    public AnalyticsService() {
        initializeSampleData();
    }
    
    /**
     * Track test case generation event
     */
    public void trackTestCaseGeneration(int testCaseCount, String userIdentifier, String storyType) {
        LocalDate today = LocalDate.now();
        
        // Update daily counters
        dailyStoryCount.computeIfAbsent(today, k -> new AtomicInteger(0)).incrementAndGet();
        dailyTestCaseCount.computeIfAbsent(today, k -> new AtomicInteger(0)).addAndGet(testCaseCount);
        dailyUsers.computeIfAbsent(today, k -> Collections.synchronizedSet(new HashSet<>())).add(userIdentifier);
        
        // Update totals
        totalStoriesProcessed.incrementAndGet();
        totalTestCasesGenerated.addAndGet(testCaseCount);
        
        // Estimate test case types (simplified logic)
        int positiveCases = (int) (testCaseCount * 0.7); // 70% positive
        int negativeCases = (int) (testCaseCount * 0.3); // 30% negative
        int criticalCases = (int) (testCaseCount * 0.4); // 40% critical
        
        positiveTestCases.addAndGet(positiveCases);
        negativeTestCases.addAndGet(negativeCases);
        criticalTestCases.addAndGet(criticalCases);
        
        // Add recent activity
        addRecentActivity(
            "Test Cases Generated",
            LocalDateTime.now().format(DateTimeFormatter.ofPattern("MMM dd, HH:mm")),
            testCaseCount + " test cases generated for " + (storyType != null ? storyType : "manual") + " story",
            "🧪"
        );
        
        log.info("Analytics: Tracked generation of {} test cases for user {}", testCaseCount, userIdentifier);
    }
    
    /**
     * Get comprehensive dashboard metrics
     */
    public DashboardMetrics getDashboardMetrics() {
        // Convert atomic counters to regular maps for the last 7 days
        Map<LocalDate, Integer> storyCountMap = new LinkedHashMap<>();
        Map<LocalDate, Integer> testCaseCountMap = new LinkedHashMap<>();
        Map<LocalDate, Integer> userCountMap = new LinkedHashMap<>();
        
        LocalDate today = LocalDate.now();
        for (int i = 6; i >= 0; i--) {
            LocalDate date = today.minusDays(i);
            storyCountMap.put(date, dailyStoryCount.getOrDefault(date, new AtomicInteger(0)).get());
            testCaseCountMap.put(date, dailyTestCaseCount.getOrDefault(date, new AtomicInteger(0)).get());
            userCountMap.put(date, dailyUsers.getOrDefault(date, Collections.emptySet()).size());
        }
        
        // Calculate total active users (unique across all days)
        Set<String> allUsers = new HashSet<>();
        dailyUsers.values().forEach(allUsers::addAll);
        
        DashboardMetrics metrics = new DashboardMetrics(
            storyCountMap,
            testCaseCountMap,
            userCountMap,
            totalStoriesProcessed.get(),
            totalTestCasesGenerated.get(),
            allUsers.size()
        );
        
        // Set additional metrics
        metrics.setCriticalTestCases(criticalTestCases.get());
        metrics.setPositiveTestCases(positiveTestCases.get());
        metrics.setNegativeTestCases(negativeTestCases.get());
        
        // Set recent activities (last 10)
        List<RecentActivity> recentList = new ArrayList<>(recentActivities);
        if (recentList.size() > 10) {
            recentList = recentList.subList(Math.max(0, recentList.size() - 10), recentList.size());
        }
        Collections.reverse(recentList); // Most recent first
        metrics.setRecentActivities(recentList);
        
        return metrics;
    }
    
    /**
     * Add a recent activity
     */
    private void addRecentActivity(String activity, String timestamp, String details, String icon) {
        recentActivities.add(new RecentActivity(activity, timestamp, details, icon));
        
        // Keep only the last 50 activities to prevent memory issues
        if (recentActivities.size() > 50) {
            recentActivities.remove(0);
        }
    }
    
    /**
     * Initialize sample data for demonstration
     */
    private void initializeSampleData() {
        // Add some historical data for demo
        LocalDate today = LocalDate.now();
        Random random = new Random();
        
        for (int i = 30; i >= 0; i--) {
            LocalDate date = today.minusDays(i);
            
            // Generate realistic sample data
            int stories = random.nextInt(5) + 1; // 1-5 stories per day
            int testCases = stories * (random.nextInt(5) + 3); // 3-8 test cases per story
            
            dailyStoryCount.put(date, new AtomicInteger(stories));
            dailyTestCaseCount.put(date, new AtomicInteger(testCases));
            
            // Add sample users
            Set<String> users = new HashSet<>();
            for (int j = 0; j < random.nextInt(3) + 1; j++) {
                users.add("user" + (random.nextInt(10) + 1) + "@sarb.co.za");
            }
            dailyUsers.put(date, users);
            
            totalStoriesProcessed.addAndGet(stories);
            totalTestCasesGenerated.addAndGet(testCases);
            positiveTestCases.addAndGet((int) (testCases * 0.7));
            negativeTestCases.addAndGet((int) (testCases * 0.3));
            criticalTestCases.addAndGet((int) (testCases * 0.4));
        }
        
        // Add sample recent activities with proper datetime formatting
        LocalDateTime now = LocalDateTime.now();
        addRecentActivity("System Initialized", now.format(DateTimeFormatter.ofPattern("MMM dd, HH:mm")), "TestMate AI dashboard started with sample data", "🚀");
        addRecentActivity("JIRA Integration", now.minusDays(1).format(DateTimeFormatter.ofPattern("MMM dd, HH:mm")), "JIRA integration tested successfully", "🔗");
        addRecentActivity("Bulk Generation", now.minusDays(2).format(DateTimeFormatter.ofPattern("MMM dd, HH:mm")), "15 test cases generated from document upload", "📄");
        
        log.info("Analytics: Sample data initialized with {} total stories and {} test cases", 
                totalStoriesProcessed.get(), totalTestCasesGenerated.get());
    }
}