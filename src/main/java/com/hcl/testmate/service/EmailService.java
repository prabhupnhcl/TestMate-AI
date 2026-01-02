package com.hcl.testmate.service;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

@Service

public class EmailService {
    private static final Logger log = LoggerFactory.getLogger(EmailService.class);
    private final JavaMailSender mailSender;

    public EmailService(JavaMailSender mailSender) {
        this.mailSender = mailSender;
    }

    @Value("${spring.mail.from:testmate-ai@hcl.com}")
    private String fromEmail;
    
    @Value("${email.demo.mode:true}")
    private boolean demoMode;

    public void sendReviewNotification(String reviewerName, String creatorEmail, 
                                      String status, String comments, 
                                      int testCaseCount) throws MessagingException {
        log.info("Sending review notification to: {}", creatorEmail);
        
        if (demoMode) {
            // Demo mode - just log the email content
            log.info("=".repeat(80));
            log.info("📧 EMAIL DEMO MODE - Email content logged below (not actually sent)");
            log.info("=".repeat(80));
            log.info("From: {}", fromEmail);
            log.info("To: {}", creatorEmail);
            log.info("Subject: {}", getEmailSubject(status));
            log.info("-".repeat(80));
            log.info("Reviewer: {}", reviewerName);
            log.info("Status: {}", status.toUpperCase());
            log.info("Test Cases: {}", testCaseCount);
            log.info("Comments:\n{}", comments);
            log.info("=".repeat(80));
            log.info("✅ Email logged successfully! (Set email.demo.mode=false to actually send emails)");
            return;
        }
        
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setFrom(fromEmail);
            helper.setTo(creatorEmail);
            helper.setSubject(getEmailSubject(status));
            helper.setText(buildEmailContent(reviewerName, status, comments, testCaseCount), true);

            mailSender.send(message);
            log.info("Review notification sent successfully to: {}", creatorEmail);
        } catch (MessagingException e) {
            log.error("Failed to send email. Error: {}", e.getMessage());
            log.error("Please check your email configuration in application.properties");
            log.error("For Office 365, you may need to generate an App Password:");
            log.error("1. Visit https://account.microsoft.com/security");
            log.error("2. Go to 'Additional security options'");
            log.error("3. Create an App Password and use it in spring.mail.password");
            throw new MessagingException("Authentication failed. Please configure an App Password for Office 365. " + e.getMessage(), e);
        }
    }

    private String getEmailSubject(String status) {
        return switch (status.toLowerCase()) {
            case "approved" -> "✅ Test Cases Approved - TestMate AI";
            case "changes_requested", "changes-requested" -> "⚠️ Test Cases - Changes Requested - TestMate AI";
            case "rejected" -> "❌ Test Cases Rejected - TestMate AI";
            default -> "📋 Test Case Review Notification - TestMate AI";
        };
    }

    private String buildEmailContent(String reviewerName, String status, 
                                     String comments, int testCaseCount) {
        String timestamp = LocalDateTime.now()
            .format(DateTimeFormatter.ofPattern("MMMM dd, yyyy, hh:mm:ss a"));

        String statusIcon = switch (status.toLowerCase()) {
            case "approved" -> "✅";
            case "changes_requested", "changes-requested" -> "⚠️";
            case "rejected" -> "❌";
            default -> "📋";
        };

        String statusColor = switch (status.toLowerCase()) {
            case "approved" -> "#10b981";
            case "changes_requested", "changes-requested" -> "#f59e0b";
            case "rejected" -> "#ef4444";
            default -> "#3b82f6";
        };

        String statusText = status.replace("_", " ").replace("-", " ").toUpperCase();

        return String.format("""
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <style>
                    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; background-color: #f4f4f4; margin: 0; padding: 0; }
                    .container { max-width: 600px; margin: 20px auto; background: white; border-radius: 10px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.1); }
                    .header { background: linear-gradient(135deg, #667eea 0%%, #764ba2 100%%); color: white; padding: 30px; text-align: center; }
                    .logo { font-size: 28px; font-weight: bold; margin-bottom: 10px; }
                    .tagline { font-size: 14px; opacity: 0.9; }
                    .content { padding: 30px; }
                    .greeting { font-size: 18px; margin-bottom: 20px; }
                    .status-badge { display: inline-block; padding: 12px 24px; background: %s; color: white; border-radius: 25px; font-weight: bold; font-size: 16px; margin: 20px 0; }
                    .info-box { background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid %s; }
                    .info-row { display: flex; margin: 10px 0; padding: 8px 0; border-bottom: 1px solid #e9ecef; }
                    .info-row:last-child { border-bottom: none; }
                    .label { font-weight: bold; color: #666; min-width: 180px; }
                    .value { color: #333; flex: 1; }
                    .comments-box { background: linear-gradient(135deg, #fff3cd 0%%, #fff8e1 100%%); padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ffc107; }
                    .comments-title { font-size: 16px; font-weight: bold; margin-bottom: 12px; color: #856404; }
                    .comments-text { color: #333; white-space: pre-wrap; line-height: 1.8; }
                    .action-message { background: %s; color: white; padding: 20px; border-radius: 8px; margin: 25px 0; font-weight: 500; }
                    .footer { background: #f8f9fa; padding: 20px; text-align: center; color: #666; font-size: 12px; border-top: 1px solid #dee2e6; }
                    .footer p { margin: 5px 0; }
                    .divider { height: 2px; background: linear-gradient(to right, transparent, #667eea, transparent); margin: 25px 0; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <div class="logo">🤖 TestMate AI</div>
                        <div class="tagline">Exclusively for SARB - Quality Assurance Excellence</div>
                    </div>
                    <div class="content">
                        <div class="greeting">Hello,</div>
                        <p>Your test cases have been reviewed by <strong>%s</strong> (Test Lead/Manager).</p>
                        
                        <div style="text-align: center;">
                            <div class="status-badge">%s %s</div>
                        </div>
                        
                        <div class="divider"></div>
                        
                        <div class="info-box">
                            <div class="info-row">
                                <span class="label">👤 Reviewer:</span>
                                <span class="value">%s</span>
                            </div>
                            <div class="info-row">
                                <span class="label">📅 Review Date & Time:</span>
                                <span class="value">%s</span>
                            </div>
                            <div class="info-row">
                                <span class="label">📊 Total Test Cases:</span>
                                <span class="value">%d test case(s)</span>
                            </div>
                            <div class="info-row">
                                <span class="label">⚡ Status:</span>
                                <span class="value"><strong>%s</strong></span>
                            </div>
                        </div>
                        
                        <div class="comments-box">
                            <div class="comments-title">💬 Reviewer Comments & Feedback:</div>
                            <div class="comments-text">%s</div>
                        </div>
                        
                        <div class="action-message">
                            %s
                        </div>
                        
                        <div class="divider"></div>
                        
                        <p style="color: #666; font-size: 14px; margin-top: 30px;">
                            If you have any questions about this review, please contact <strong>%s</strong> directly.
                        </p>
                    </div>
                    <div class="footer">
                        <p><strong>This is an automated notification from TestMate AI</strong></p>
                        <p>© 2025 TestMate AI - SARB Quality Assurance Team</p>
                        <p style="margin-top: 10px; font-size: 11px;">
                            Generated on %s
                        </p>
                    </div>
                </div>
            </body>
            </html>
            """,
            statusColor, statusColor, statusColor,
            reviewerName, statusIcon, statusText,
            reviewerName, timestamp, testCaseCount, statusText,
            comments.isEmpty() ? "No additional comments provided." : comments,
            getActionMessage(status),
            reviewerName,
            timestamp
        );
    }

    private String getActionMessage(String status) {
        return switch (status.toLowerCase()) {
            case "approved" -> "✅ <strong>Excellent work!</strong> Your test cases have been approved and are ready for execution. You may proceed with test execution.";
            case "changes_requested", "changes-requested" -> "⚠️ <strong>Action Required:</strong> Please review the comments above and update your test cases accordingly. Resubmit for review after making the requested changes.";
            case "rejected" -> "❌ <strong>Revision Needed:</strong> The test cases require significant changes. Please review the feedback carefully and regenerate the test cases addressing all concerns.";
            default -> "📋 Please check TestMate AI application for more details and next steps.";
        };
    }
}
