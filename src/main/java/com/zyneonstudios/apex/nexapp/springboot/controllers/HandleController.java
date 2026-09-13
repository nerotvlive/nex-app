package com.zyneonstudios.apex.nexapp.springboot.controllers;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/v1")
public class HandleController {

    @GetMapping("/handle")
    public Map<String, Object> getStatus() {
        return Map.of(
                "service", "unavailable/todo"
        );
    }
}