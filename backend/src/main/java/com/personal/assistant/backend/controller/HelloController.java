package com.personal.assistant.backend.controller;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.CrossOrigin;

@RestController
@CrossOrigin(origins = "*")
public class HelloController {

    @GetMapping("/api/health")
    public String health() {
        return "Backend is running!";
    }

    @GetMapping("/hello")
    public String hello() {
        return "Hello from Backend!";
    }
}
