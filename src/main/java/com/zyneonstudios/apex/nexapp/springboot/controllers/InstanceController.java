package com.zyneonstudios.apex.nexapp.springboot.controllers;

import jakarta.servlet.http.HttpServletRequest;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import tools.jackson.databind.ObjectMapper;
import tools.jackson.databind.node.ArrayNode;
import tools.jackson.databind.node.ObjectNode;

@RestController
@RequestMapping("/api")
public class InstanceController {

    private final ObjectMapper objectMapper;

    public InstanceController(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
    }

    @GetMapping({"/instance", "/instances"})
    public ArrayNode getInstances() {
        return objectMapper.createArrayNode();
    }

    @GetMapping({"/instance/**", "/instances/**"})
    public ObjectNode getInstanceById(HttpServletRequest request) {
        return error("404", "Instance not found");
    }

    private ObjectNode error(String errorId, String errorMessage) {
        ObjectNode error = objectMapper.createObjectNode();
        error.put("errorId", errorId);
        error.put("errorMessage", errorMessage);
        return error;
    }
}