package com.zyneonstudios.apex.nexapp;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import java.util.Collections;

@SpringBootApplication
public class Main {

    private static String[] args;
    private static NEXApp nexApp;
    private static SpringApplication springApp;

    static void main(String[] args) {
        Main.args = args;
        System.setProperty("prism.order", "sw");
        nexApp = new NEXApp();
        springApp = new SpringApplication(Main.class);
        springApp.setHeadless(false);
        springApp.setDefaultProperties(Collections.singletonMap("server.port", "8274"));
        springApp.run(args);
        nexApp.launch();
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
}