package com.hcl.testmate.model;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

public class DashboardMetrics {
    
    // Daily usage statistics
    private Map<LocalDate, Integer> dailyStoryCount;
    private Map<LocalDate, Integer> dailyTestCaseCount;
    private Map<LocalDate, Integer> dailyUserCount;
    
    // Overall statistics
    private int totalStoriesProcessed;
    private int totalTestCasesGenerated;
    private int totalActiveUsers;
    private double avgTestCasesPerStory;
    private double avgProcessingTimeSeconds;
    
    // Efficiency metrics
    private int manualTestCaseEstimate; // How many test cases would be written manually
    private double timeSavedHours;
    private double costSavedUSD;
    private double productivityGainPercent;
    
    // Quality metrics
    private double defectCatchRate;
    private int criticalTestCases;
    private int positiveTestCases;
    private int negativeTestCases;
    
    // Recent activity
    private List<RecentActivity> recentActivities;
    
    // Constructors
    public DashboardMetrics() {}
    
    public DashboardMetrics(Map<LocalDate, Integer> dailyStoryCount, 
                           Map<LocalDate, Integer> dailyTestCaseCount,
                           Map<LocalDate, Integer> dailyUserCount,
                           int totalStoriesProcessed,
                           int totalTestCasesGenerated,
                           int totalActiveUsers) {
        this.dailyStoryCount = dailyStoryCount;
        this.dailyTestCaseCount = dailyTestCaseCount;
        this.dailyUserCount = dailyUserCount;
        this.totalStoriesProcessed = totalStoriesProcessed;
        this.totalTestCasesGenerated = totalTestCasesGenerated;
        this.totalActiveUsers = totalActiveUsers;
        
        // Calculate derived metrics
        this.avgTestCasesPerStory = totalStoriesProcessed > 0 ? 
            (double) totalTestCasesGenerated / totalStoriesProcessed : 0;
        this.manualTestCaseEstimate = totalTestCasesGenerated * 3; // Assume 3x manual effort
        this.timeSavedHours = totalTestCasesGenerated * 0.5; // 30 minutes per test case
        this.costSavedUSD = timeSavedHours * 75; // $75/hour QA rate
        this.productivityGainPercent = manualTestCaseEstimate > 0 ? 
            ((double) (manualTestCaseEstimate - totalTestCasesGenerated) / manualTestCaseEstimate) * 100 : 0;
        this.avgProcessingTimeSeconds = 45.0; // Average AI processing time
        this.defectCatchRate = 85.5; // Estimated defect catch rate
    }
    
    // Getters and Setters
    public Map<LocalDate, Integer> getDailyStoryCount() { return dailyStoryCount; }
    public void setDailyStoryCount(Map<LocalDate, Integer> dailyStoryCount) { this.dailyStoryCount = dailyStoryCount; }
    
    public Map<LocalDate, Integer> getDailyTestCaseCount() { return dailyTestCaseCount; }
    public void setDailyTestCaseCount(Map<LocalDate, Integer> dailyTestCaseCount) { this.dailyTestCaseCount = dailyTestCaseCount; }
    
    public Map<LocalDate, Integer> getDailyUserCount() { return dailyUserCount; }
    public void setDailyUserCount(Map<LocalDate, Integer> dailyUserCount) { this.dailyUserCount = dailyUserCount; }
    
    public int getTotalStoriesProcessed() { return totalStoriesProcessed; }
    public void setTotalStoriesProcessed(int totalStoriesProcessed) { this.totalStoriesProcessed = totalStoriesProcessed; }
    
    public int getTotalTestCasesGenerated() { return totalTestCasesGenerated; }
    public void setTotalTestCasesGenerated(int totalTestCasesGenerated) { this.totalTestCasesGenerated = totalTestCasesGenerated; }
    
    public int getTotalActiveUsers() { return totalActiveUsers; }
    public void setTotalActiveUsers(int totalActiveUsers) { this.totalActiveUsers = totalActiveUsers; }
    
    public double getAvgTestCasesPerStory() { return avgTestCasesPerStory; }
    public void setAvgTestCasesPerStory(double avgTestCasesPerStory) { this.avgTestCasesPerStory = avgTestCasesPerStory; }
    
    public double getAvgProcessingTimeSeconds() { return avgProcessingTimeSeconds; }
    public void setAvgProcessingTimeSeconds(double avgProcessingTimeSeconds) { this.avgProcessingTimeSeconds = avgProcessingTimeSeconds; }
    
    public int getManualTestCaseEstimate() { return manualTestCaseEstimate; }
    public void setManualTestCaseEstimate(int manualTestCaseEstimate) { this.manualTestCaseEstimate = manualTestCaseEstimate; }
    
    public double getTimeSavedHours() { return timeSavedHours; }
    public void setTimeSavedHours(double timeSavedHours) { this.timeSavedHours = timeSavedHours; }
    
    public double getCostSavedUSD() { return costSavedUSD; }
    public void setCostSavedUSD(double costSavedUSD) { this.costSavedUSD = costSavedUSD; }
    
    public double getProductivityGainPercent() { return productivityGainPercent; }
    public void setProductivityGainPercent(double productivityGainPercent) { this.productivityGainPercent = productivityGainPercent; }
    
    public double getDefectCatchRate() { return defectCatchRate; }
    public void setDefectCatchRate(double defectCatchRate) { this.defectCatchRate = defectCatchRate; }
    
    public int getCriticalTestCases() { return criticalTestCases; }
    public void setCriticalTestCases(int criticalTestCases) { this.criticalTestCases = criticalTestCases; }
    
    public int getPositiveTestCases() { return positiveTestCases; }
    public void setPositiveTestCases(int positiveTestCases) { this.positiveTestCases = positiveTestCases; }
    
    public int getNegativeTestCases() { return negativeTestCases; }
    public void setNegativeTestCases(int negativeTestCases) { this.negativeTestCases = negativeTestCases; }
    
    public List<RecentActivity> getRecentActivities() { return recentActivities; }
    public void setRecentActivities(List<RecentActivity> recentActivities) { this.recentActivities = recentActivities; }
    
    // Inner class for recent activities
    public static class RecentActivity {
        private String activity;
        private String timestamp;
        private String details;
        private String icon;
        
        public RecentActivity() {}
        
        public RecentActivity(String activity, String timestamp, String details, String icon) {
            this.activity = activity;
            this.timestamp = timestamp;
            this.details = details;
            this.icon = icon;
        }
        
        // Getters and Setters
        public String getActivity() { return activity; }
        public void setActivity(String activity) { this.activity = activity; }
        
        public String getTimestamp() { return timestamp; }
        public void setTimestamp(String timestamp) { this.timestamp = timestamp; }
        
        public String getDetails() { return details; }
        public void setDetails(String details) { this.details = details; }
        
        public String getIcon() { return icon; }
        public void setIcon(String icon) { this.icon = icon; }
    }
}