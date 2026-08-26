package com.zyneonstudios.apex.nexapp.search.technic;

import com.google.gson.Gson;
import com.google.gson.GsonBuilder;
import com.zyneonstudios.apex.nexapp.main.NEXApplication;
import org.json.JSONObject;

import java.net.URI;
import java.net.URLEncoder;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;

public class TechnicIntegration {

    private static HttpClient httpClient;

    public static String search(String query) {
        return accessAPI("https://api.technicpack.net/search?build=999&q=" + URLEncoder.encode(query, StandardCharsets.UTF_8));
    }

    public static String accessAPI(String url) {
        try {
            if (TechnicIntegration.httpClient == null) {
                TechnicIntegration.httpClient = HttpClient.newHttpClient();
            }
            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(url))
                    .GET()
                    .header("Accept", "application/json")
                    .header("User-Agent", "NexusPlatform-Launcher/1.0")
                    .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());

            if (response.statusCode() != 200) {
                throw new RuntimeException("API-Anfrage fehlgeschlagen. HTTP-Status: " + response.statusCode());
            }

            return response.body();
        } catch (Exception e) {
            NEXApplication.getLogger().err(e.getMessage());
            return null;
        }
    }

    public static void main(String[] args) {
        Gson gson = new GsonBuilder().setPrettyPrinting().create();
        String query = "tekkit";
        String response = search(query);
        JSONObject responseObject = gson.fromJson(response, JSONObject.class);
        System.out.println(response);
        System.out.println("===");
        System.out.println(responseObject);
    }
}