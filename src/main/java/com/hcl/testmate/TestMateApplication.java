package com.hcl.testmate;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

/**
 * Main application class for TestMate AI Java
 * AI-Powered QA Agent for Test Case Generation
 */
@SpringBootApplication
public class TestMateApplication {

    public static void main(String[] args) {
        SpringApplication.run(TestMateApplication.class, args);
        System.out.println("=================================================");
        System.out.println("TestMate AI Java Application Started Successfully");
        System.out.println("Access the application at: http://localhost:8080/testmate");
        System.out.println("=================================================");
    }
}
