package com.zyneonstudios.apex.nexapp.springboot.controllers;

import jakarta.servlet.http.HttpServletRequest;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;
import tools.jackson.databind.node.ArrayNode;
import tools.jackson.databind.node.ObjectNode;

import java.io.File;
import java.lang.reflect.Array;
import java.net.URI;
import java.nio.file.Path;
import java.sql.*;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;

@RestController
@RequestMapping("/api/v1")
public class InstanceController {

    private final ObjectMapper objectMapper;
    private ArrayNode nex = null;

    public InstanceController(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
    }

    @GetMapping("/instances")
    public ArrayNode getInstances() {
        if(nex == null) {
            nex = buildNEX();
        }
        return nex;
    }

    @GetMapping("/instance")
    public ArrayNode getInstance() {
        return getInstances();
    }

    @GetMapping("/instance/**")
    public ObjectNode getInstanceById(HttpServletRequest request) {
        if (nex == null) {
            nex = buildNEX();
        }

        String path = request.getRequestURI();
        String prefix = path.startsWith("/api/v1/instances/") ? "/api/v1/instances/" : "/api/v1/instance/";
        String id = path.substring(prefix.length());

        for (JsonNode instanceNode : nex) {
            JsonNode metaId = instanceNode.path("instance").path("meta").path("id");
            if (metaId.isString() && id.equals(metaId.asString())) {
                return (ObjectNode) instanceNode;
            }
        }

        return error("404", "Instance not found");
    }

    @GetMapping("/instances/**")
    public ObjectNode getInstancesById(HttpServletRequest request) {
        return getInstanceById(request);
    }

    public static ObjectNode fetchJsonObject(String url) {
        try {
            ObjectMapper mapper = new ObjectMapper();
            return (ObjectNode) mapper.readTree(URI.create(url).toURL().openStream());
        } catch ( Exception e ) {
            return null;
        }
    }

    private ArrayNode buildNEX() {
        ArrayNode nex = objectMapper.createArrayNode();
        for(JsonNode instanceString : fetchJsonObject("https://zyneonstudios.github.io/nexus-nex/zyndex").get("instances").deepCopy().asArray()) {
            String url = instanceString.asString();
            ObjectNode instance = fetchJsonObject(url);
            nex.add(instance);
        }
        return nex;
    }

    private ObjectNode error(String errorId, String errorMessage) {
        ObjectNode error = objectMapper.createObjectNode();
        error.put("errorId", errorId);
        error.put("errorMessage", errorMessage);
        return error;
    }
}