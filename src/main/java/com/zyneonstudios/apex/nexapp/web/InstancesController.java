package com.zyneonstudios.apex.nexapp.web;

import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.zyneonstudios.apex.nexapp.main.NEXApplication;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api")
public class InstancesController {

    @GetMapping({"/instance", "/instances","/instance/", "/instances/"})
    public ResponseEntity<Object> handleRequest(HttpServletRequest request) {
        if(RootController.isAllowedRequest(request.getRequestURL().toString())) {
            ObjectNode root = RootController.OBJECT_MAPPER.createObjectNode();
            ArrayNode keys = RootController.OBJECT_MAPPER.createArrayNode();
            ArrayNode values = RootController.OBJECT_MAPPER.createArrayNode();

            NEXApplication.getInstance().getInstanceManager().getInstances().keySet().forEach(keys::add);

            NEXApplication.getInstance().getInstanceManager().getInstances().values().forEach(localInstance -> {
                try {
                    String jsonString = localInstance.getInstance().getJson();
                    values.add(RootController.OBJECT_MAPPER.readTree(jsonString));
                } catch (Exception ignore) {}
            });

            root.set("keys", keys);
            root.set("values", values);
            root.put("scheme", "LEGACY");

            return ResponseEntity.ok(root);
        }
        return ResponseEntity.status(403).build();
    }
}