package com.hcl.testmate.controller;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

/**
 * Controller for serving the web UI
 */
@Controller
public class WebController {
    
    /**
     * Serve the main index page
     */
    @GetMapping("/")
    public String index() {
        return "index.html";
    }
}
