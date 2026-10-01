package com.zyneonstudios.apex.nexapp.springboot.controllers;

import jakarta.servlet.http.HttpServletRequest;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import tools.jackson.databind.node.ArrayNode;
import tools.jackson.databind.node.ObjectNode;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;

@RestController
@RequestMapping("/api/curseforge")
public class CurseforgeController {

    private static String API_KEY = "";

    public static void setApiKey(String apiKey) {
        API_KEY = apiKey;
    }

    //@GetMapping("/r/**")
    public ObjectNode redirect(HttpServletRequest request) {
        String path = request.getServletPath().replaceFirst("/api/curseforge", "");
        if(request.getQueryString() != null) {
            path += "?" + request.getQueryString();
        }
        return sendRequest(path, true);
    }

    @GetMapping({"/categories","/categories/","/category","/category/"})
    public ArrayNode getCategories(HttpServletRequest request) {
        String query = "?gameId=432";
        if(request.getQueryString() != null) {
            query += "&" + request.getQueryString();
        }
        ObjectNode response = sendRequest("/categories" + query, false);
        if (response.has("data")) {
            return (ArrayNode)response.get("data");
        } else {
            ArrayNode errorResponse = ApiController.getObjectMapper().createArrayNode();
            errorResponse.add(response);
            return errorResponse;
        }
    }

    @GetMapping("/search")
    public ObjectNode search(HttpServletRequest request) {
        String query = "";
        if(request.getQueryString() != null) {
            query += "&" + request.getQueryString();
        }
        return sendRequest("/mods/search?gameId=432" + query, true);
    }

    private static ObjectNode sendRequest(String path, boolean authorize) {
        String url = "https://api.curseforge.com/v1";
        if(path.toLowerCase().startsWith("https://")) {
            url = path;
        } else if(path.toLowerCase().startsWith("http://")) {
            url = path.replaceFirst("http://","https://");
        } else {
            url = url + path;
        }
        String response;
        if(authorize) {
            response = requestAuthorized(url);
        } else {
            response = request(url);
        }
        if(response == null) {
            return ApiController.error("500", "Failed to send request");
        } else {
            return ApiController.getObjectMapper().readValue(response, ObjectNode.class);
        }
    }

    private static String requestAuthorized(String url) {
        try (HttpClient client = HttpClient.newBuilder()
                .followRedirects(HttpClient.Redirect.NORMAL)
                .build()) {
            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(url))
                    .header("x-api-key", API_KEY)
                    .header("Accept", "application/json")
                    .GET()
                    .build();
            HttpResponse<String> response = client.send(
                    request,
                    HttpResponse.BodyHandlers.ofString()
            );
            if (response.statusCode() >= 200 && response.statusCode() < 300) {
                return response.body();
            } else {
                throw new RuntimeException("API request failed with status code: " +
                        response.statusCode() + " | response: " + response.body());
            }
        } catch (Exception e) {
            System.err.println("Failed to execute API request with curseforge token: "+e.getMessage());
            return null;
        }
    }

    private static String request(String url) {
        try (HttpClient client = HttpClient.newBuilder()
                .followRedirects(HttpClient.Redirect.NORMAL)
                .build()) {
            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(url))
                    .header("Accept", "application/json")
                    .GET()
                    .build();
            HttpResponse<String> response = client.send(
                    request,
                    HttpResponse.BodyHandlers.ofString()
            );
            if (response.statusCode() >= 200 && response.statusCode() < 300) {
                return response.body();
            } else {
                throw new RuntimeException("API request failed with status code: " +
                        response.statusCode() + " | response: " + response.body());
            }
        } catch (Exception e) {
            System.err.println("Failed to execute API request with curseforge token: "+e.getMessage());
            return null;
        }
    }
}
