package com.zyneonstudios.apex.nexapp.springboot.controllers;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/v1")
public class StatusController {

    @GetMapping("/status")
    public Map<String, Object> getStatus() {
        return Map.of(
                "service", "NEX App API by Zyneon Apex, a Zyneon Studios Division",
                "status", "online",
                "version", "26.0.0-revision.1"
        );
    }
}