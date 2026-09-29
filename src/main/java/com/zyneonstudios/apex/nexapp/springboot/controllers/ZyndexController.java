package com.zyneonstudios.apex.nexapp.springboot.controllers;

import com.zyneonstudios.apex.nexapp.Main;
import com.zyneonstudios.apex.nexapp.integrations.zyndex.Zyndex;
import com.zyneonstudios.apex.nexapp.integrations.zyndex.local.LocalZyndex;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import tools.jackson.databind.ObjectMapper;
import tools.jackson.databind.node.ArrayNode;
import tools.jackson.databind.node.ObjectNode;

import java.net.URI;
import java.util.Collection;
import java.util.HashMap;

@RestController
@RequestMapping("/api/v1")
public class ZyndexController {

    private final ObjectMapper objectMapper;
    private static final HashMap<String, Zyndex> indexes = new HashMap<>();

    public ZyndexController(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;

        LocalZyndex main = new LocalZyndex();
        main.setSlug("main");
        main.setId("0");
        main.setTitle("NEX App "+main.getSlug()+" Zyndex ("+main.getId()+")");
        main.setVersion(Main.getNEXApp().getVersionBuild());
        main.setOwner("NEX App "+Main.getNEXApp().getVersion());
        addIndex(main);
    }

    @GetMapping({"/zyndex", "/index", "/zyndexes", "/indexes"})
    public ObjectNode getZyndex() {
        ObjectNode zyndexes = objectMapper.createObjectNode();
        ArrayNode zyndexArray = objectMapper.createArrayNode();
        for(Zyndex test : indexes.values()) {
            zyndexArray.add(test.getJson());
        }
        zyndexes.set("indexes", zyndexArray);

        return zyndexes;
    }

    @GetMapping({"/zyndex/**", "/index/**", "/zyndexes/**", "/indexes/**"})
    public ObjectNode getZyndexById(HttpServletRequest request) {
        ObjectNode debug = objectMapper.createObjectNode();
        String id = getPath(request.getServletPath());
        if(!id.isBlank()&&!id.equals("/")&&indexes.containsKey(id.replaceFirst("/",""))) {
            Zyndex zyndex = indexes.get(id.replaceFirst("/",""));
            return zyndex.getJson();
        } else {
            debug.put("contextPath", request.getContextPath());
            debug.put("queryString", request.getQueryString());
            debug.put("servletPath", request.getServletPath());
            debug.put("requestURI", request.getRequestURI());
            debug.put("servletBasedPath", id);
            debug.put("requestBasedPath", getPath(request.getRequestURI()));
            return debug;
        }
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

    public static HashMap<String, Zyndex> getIndexes() {
        return indexes;
    }

    public static boolean setIndexes(HashMap<String, Zyndex> indexes) {
        return setIndexes(indexes.values());
    }

    public static boolean setIndexes(Zyndex... indexes) {
        ZyndexController.indexes.clear();
        boolean failed = false;
        try {
            for (Zyndex index : indexes) {
                if (!addIndex(index)) {
                    failed = true;
                }
            }
        } catch (Exception e) {
            System.err.println("Failed to set indexes: "+e.getMessage());
            failed = true;
        }
        return !failed;
    }

    public static boolean setIndexes(Collection<Zyndex> indexes) {
        return setIndexes(indexes.toArray(new Zyndex[0]));
    }

    public static Zyndex getIndex(String identifier) {
        return indexes.get(identifier);
    }

    public static boolean addIndex(Zyndex index) {
        String slug = index.getSlug();
        String id = index.getId();
        if(indexes.containsKey(slug)||indexes.containsKey(id)) {
            System.err.println("Index with identifiers \"%s\"&&\"%s\" already exists!".formatted(slug, id));
            return false;
        }
        indexes.put(slug, index);
        indexes.put(id, index);
        return true;
    }

    public static boolean removeIndex(String identifier) {
        if(indexes.containsKey(identifier)) {
            return removeIndex(getIndex(identifier));
        }
        return false;
    }

    public static boolean removeIndex(Zyndex index) {
        if(indexes.containsValue(index)) {
            indexes.remove(index.getId(), index);
            indexes.remove(index.getSlug(), index);
            return true;
        }
        return false;
    }

}