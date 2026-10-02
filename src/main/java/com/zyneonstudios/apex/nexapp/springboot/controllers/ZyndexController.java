package com.zyneonstudios.apex.nexapp.springboot.controllers;

import com.zyneonstudios.apex.nexapp.Main;
import com.zyneonstudios.apex.nexapp.integrations.zyndex.Zyndex;
import com.zyneonstudios.apex.nexapp.integrations.zyndex.local.LocalZyndex;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;
import tools.jackson.databind.node.ArrayNode;
import tools.jackson.databind.node.ObjectNode;

import java.net.URI;
import java.util.Collection;
import java.util.HashMap;

@RestController
@RequestMapping({"/api/zyndex", "/api/index", "/api/zyndexes", "/api/indexes"})
public class ZyndexController {

    private static final HashMap<String, Zyndex> indexes = new HashMap<>();

    public ZyndexController() {
        LocalZyndex main = new LocalZyndex();
        main.setSlug("main");
        main.setId("0");
        main.setTitle("NEX App "+main.getSlug()+" Zyndex ("+main.getId()+")");
        main.setVersion(Main.getNEXApp().getVersionBuild());
        main.setOwner("NEX App "+Main.getNEXApp().getVersion());
        addIndex(main);
    }

    @GetMapping({"","/"})
    public ObjectNode getZyndex() {
        ObjectNode zyndexes = ApiController.getObjectMapper().createObjectNode();
        ArrayNode zyndexArray = ApiController.getObjectMapper().createArrayNode();
        for(Zyndex test : indexes.values()) {
            zyndexArray.add(test.getJson());
        }
        zyndexes.set("indexes", zyndexArray);

        return zyndexes;
    }

    @GetMapping("**")
    public JsonNode getZyndexById(HttpServletRequest request) {
        String[] path_ = getPath(request.getServletPath()).split("/");
        String id = path_[1];

        StringBuilder path = null;
        if(path_.length>2) {
            path = new StringBuilder();
            for(int i = 2; i < path_.length; i++) {
                path.append("/").append(path_[i]);
            }
        }

        if(path == null) {
            if (!id.isBlank() && !id.equals("/") && indexes.containsKey(id.replaceFirst("/", ""))) {
                Zyndex zyndex = indexes.get(id.replaceFirst("/", ""));
                return zyndex.getJson();
            } else {
                ObjectNode error = ApiController.error("404", "Zyndex with identifier " + id + " not found...", request);
                error.put("relativePath", id);
                return error;
            }
        } else {
            return ApiController.getObjectMapper().createArrayNode();
        }
    }

    private String getPath(String servletPathOrRequestURI) {
        return servletPathOrRequestURI.replace("/api/zyndexes","").replace("/api/zyndex","").replace("/api/indexes","").replace("/api/index","");
    }

    public static ObjectNode fetchJsonObject(String url) {
        try {
            ObjectMapper mapper = new ObjectMapper();
            return (ObjectNode) mapper.readTree(URI.create(url).toURL().openStream());
        } catch ( Exception e ) {
            return null;
        }
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