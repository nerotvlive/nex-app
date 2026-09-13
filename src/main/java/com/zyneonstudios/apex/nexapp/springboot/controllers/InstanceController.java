package com.zyneonstudios.apex.nexapp.springboot.controllers;

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

    @GetMapping("/instance")
    public ArrayNode getInstance() {
        if(nex == null) {
            nex = buildNEX();
        }
        return nex;
    }

    @GetMapping("/instances")
    public ArrayNode getInstances() {
        return getInstance();
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
}