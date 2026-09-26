package com.zyneonstudios.apex.nexapp.springboot.controllers;

import com.zyneonstudios.apex.nexapp.integrations.zyndex.local.LocalZyndex;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import tools.jackson.databind.ObjectMapper;
import tools.jackson.databind.node.ObjectNode;

import java.net.URI;
import java.util.Collection;
import java.util.HashMap;

@RestController
@RequestMapping("/api/v1")
public class ZyndexController {

    private final ObjectMapper objectMapper;
    private static HashMap<String, LocalZyndex> indexes = new HashMap<>();

    public ZyndexController(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
    }

    @GetMapping({"/zyndex", "/index", "/zyndexes", "/indexes"})
    public ObjectNode getZyndex() {
        return error("null", "not implemented");
    }

    @GetMapping({"/zyndex/**", "/index/**", "/zyndexes/**", "/indexes/**"})
    public ObjectNode getZyndexById(HttpServletRequest request) {
        ObjectNode debug = objectMapper.createObjectNode();
        debug.put("contextPath",request.getContextPath());
        debug.put("queryString",request.getQueryString());
        debug.put("servletPath",request.getServletPath());
        debug.put("requestURI",request.getRequestURI());
        debug.put("servletBasedPath",getPath(request.getServletPath()));
        debug.put("requestBasedPath",getPath(request.getRequestURI()));
        return debug;
    }

    private String getPath(String servletPathOrRequestURI) {
        return servletPathOrRequestURI.replace("/api/v1/zyndexes","").replace("/api/v1/zyndex","").replace("/api/v1/indexes","").replace("/api/v1/index","");
    }

    public static ObjectNode fetchJsonObject(String url) {
        try {
            ObjectMapper mapper = new ObjectMapper();
            return (ObjectNode) mapper.readTree(URI.create(url).toURL().openStream());
        } catch ( Exception e ) {
            return null;
        }
    }

    private ObjectNode error(String errorId, String errorMessage) {
        ObjectNode error = objectMapper.createObjectNode();
        error.put("errorId", errorId);
        error.put("errorMessage", errorMessage);
        return error;
    }

    public static HashMap<String, LocalZyndex> getIndexes() {
        return indexes;
    }

    public static void setIndexes(HashMap<String, LocalZyndex> indexes) {
        ZyndexController.indexes = indexes;
    }

    public static void setIndexes(LocalZyndex... indexes) {
        ZyndexController.indexes.clear();
        for(LocalZyndex index : indexes) {
            try {
                ZyndexController.addIndex(index);
            } catch (IllegalArgumentException e) {
                System.err.println("Skipping index with identifier \""+index.getSlug()+"\"||\""+index.getId()+"\": "+e.getMessage());
            }
        }
    }

    public static void setIndexes(Collection<LocalZyndex> indexes) {
        setIndexes(indexes.toArray(new LocalZyndex[0]));
    }

    public static LocalZyndex getIndex(String identifier) {
        return indexes.get(identifier);
    }

    public static void addIndex(LocalZyndex index) {
        String slug = index.getSlug();
        String identifier = indexes.containsKey(slug) ? index.getId() : slug;
        if(indexes.containsKey(identifier)) {
            throw new IllegalArgumentException("Index with identifier \"%s\"||\"%s\" already exists!".formatted(slug, index.getId()));
        }
        indexes.put(identifier, index);
    }

    public static void addIndex(String identifier, LocalZyndex index) {
        if(indexes.containsKey(identifier)) {
            throw new IllegalArgumentException("Index with identifier \"%s\" already exists!".formatted(identifier));
        }
        index.setId(identifier);
        indexes.put(identifier, index);
    }

    public static void removeIndex(String identifier) {
        indexes.remove(identifier);
    }

    public static void removeIndex(LocalZyndex index) {
        indexes.remove(index.getId(),index);
        indexes.remove(index.getSlug(),index);
    }

    public static void removeIndex(String identifier, LocalZyndex index) {
        indexes.remove(identifier,index);
    }

}