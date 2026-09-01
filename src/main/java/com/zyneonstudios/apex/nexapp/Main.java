package com.zyneonstudios.apex.nexapp;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

import java.util.Collections;

@SpringBootApplication
public class Main {

    private static String[] args;
    private static NEXApp nexApp;
    private static SpringApplication springApp;
    private static String url = "http://localhost:8274";

    static void main(String[] args) {
        Main.args = args;
        resolveArgs();
        nexApp = new NEXApp();
        springApp = new SpringApplication(Main.class);
        springApp.setHeadless(false);
        springApp.setDefaultProperties(Collections.singletonMap("server.port", "8274"));
        springApp.run(args);
        nexApp.launch();
    }

    private static void resolveArgs() {
        for(int i=0;i<args.length;i++) {
            if(args[i].equals("-v")||args[i].equals("--vite")) {
                url = "http://localhost:5173";
            } else if(args[i].equals("-u")||args[i].equals("--url")) {
                if(args.length>i+1) {
                    url = args[i+1];
                    args[i] = "";
                    args[i+1] = "";
                }
            }
        }
    }

    public static String[] getArgs() {
        return args;
    }

    public static NEXApp getNEXApp() {
        return nexApp;
    }

    public static SpringApplication getSpringApp() {
        return springApp;
    }

    public static String getBaseUrl() {
        return url;
    }

    public static void setBaseUrl(String url) {
        Main.url = url;
    }
}