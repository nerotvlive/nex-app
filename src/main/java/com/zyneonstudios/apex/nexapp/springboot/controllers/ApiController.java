package com.zyneonstudios.apex.nexapp.springboot.controllers;

import com.zyneonstudios.apex.nexapp.Main;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import tools.jackson.databind.ObjectMapper;
import tools.jackson.databind.node.ObjectNode;

import java.util.Map;

@RestController
@RequestMapping("/api")
public class ApiController {

    private static final ObjectMapper objectMapper = new ObjectMapper();

    @GetMapping({"/status", "/state","/status/", "/state/", "/", ""})
    public Map<String, Object> getStatus() {
        return Map.of(
                "service", "NEX App API by Zyneon Apex, a Zyneon Studios Division",
                "status", "online",
                "system", Map.of(
                        "os", Map.of(
                                "name", System.getProperty("os.name"),
                                "version", System.getProperty("os.version"),
                                "arch", System.getProperty("os.arch")
                        )
                ),
                "version", Map.of(
                        "number", Main.getNEXApp().getVersion(),
                        "build", Main.getNEXApp().getVersionBuild(),
                        "name", Main.getNEXApp().getVersionName(),
                        "type", Main.getNEXApp().getVersionType()
                ),
                "scheme", "2026.09"
        );
    }

    @GetMapping("**")
    public ObjectNode getNotFound(HttpServletRequest request) {
        return error("404", "Not found...",request);
    }

    public static ObjectNode error(String errorId, String errorMessage) {
        ObjectNode error = objectMapper.createObjectNode();
        error.put("status", "error");
        error.put("errorId", errorId);
        error.put("errorMessage", errorMessage);
        return error;
    }

    public static ObjectNode error(String errorId, String errorMessage, HttpServletRequest request) {
        ObjectNode error = error(errorId, errorMessage);
        error.put("queryString", request.getQueryString());
        error.put("absolutePath", request.getServletPath());
        return error;
    }

    public static ObjectMapper getObjectMapper() {
        return objectMapper;
    }
}