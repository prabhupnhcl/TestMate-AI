package com.hcl.testmate.controller;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.hcl.testmate.model.DashboardMetrics;
import com.hcl.testmate.service.AnalyticsService;

/**
 * REST controller for analytics and dashboard endpoints
 */
@RestController
@RequestMapping("/api/analytics")
public class AnalyticsController {
    private static final Logger log = LoggerFactory.getLogger(AnalyticsController.class);
    
    private final AnalyticsService analyticsService;
    
    public AnalyticsController(AnalyticsService analyticsService) {
        this.analyticsService = analyticsService;
    }
    
    /**
     * Get comprehensive dashboard metrics
     */
    @GetMapping("/dashboard")
    public ResponseEntity<DashboardMetrics> getDashboardMetrics() {
        try {
            log.info("Received request for dashboard metrics");
            
            DashboardMetrics metrics = analyticsService.getDashboardMetrics();
            
            log.info("Returning dashboard metrics: {} stories, {} test cases, {} users",
                    metrics.getTotalStoriesProcessed(),
                    metrics.getTotalTestCasesGenerated(),
                    metrics.getTotalActiveUsers());
            
            return ResponseEntity.ok(metrics);
            
        } catch (Exception e) {
            log.error("Error retrieving dashboard metrics", e);
            return ResponseEntity.status(500).body(null);
        }
    }
    
    /**
     * Get health check for analytics service
     */
    @GetMapping("/health")
    public ResponseEntity<String> getAnalyticsHealth() {
        try {
            DashboardMetrics metrics = analyticsService.getDashboardMetrics();
            return ResponseEntity.ok("Analytics service healthy - tracking " + 
                    metrics.getTotalStoriesProcessed() + " stories");
        } catch (Exception e) {
            log.error("Analytics health check failed", e);
            return ResponseEntity.status(500).body("Analytics service unavailable");
        }
    }
}