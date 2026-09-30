package com.zyneonstudios.apex.nexapp.springboot.controllers;

import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/curseforge")
public class CurseforgeController {

    private static String API_KEY = "";

    public static void setApiKey(String apiKey) {
        API_KEY = apiKey;
    }
}
