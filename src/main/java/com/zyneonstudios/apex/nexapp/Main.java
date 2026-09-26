package com.zyneonstudios.apex.nexapp;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

import java.awt.*;
import java.lang.foreign.*;
import java.lang.invoke.MethodHandle;
import java.util.ArrayList;
import java.util.Collections;

@SpringBootApplication
public class Main {

    private static String[] args;
    private static NEXApp nexApp;
    private static SpringApplication springApp;
    private static String url = "http://localhost:8274";
    private static ArrayList<String> thingsToHandle = new ArrayList<>();

    static void main(String[] args) {
        Main.args = args;
        resolveArgs();
        springApp = new SpringApplication(Main.class);
        springApp.setHeadless(false);
        initNativeAppName();
        nexApp = new NEXApp();
        springApp.setDefaultProperties(Collections.singletonMap("server.port", "8274"));
        springApp.run(args);
        nexApp.launch();
    }

    private static void resolveArgs() {
        for(int i=0;i<args.length;i++) {
            switch (args[i]) {
                case "-v", "--vite" -> url = "http://localhost:5173";
                case "-m", "--mime" -> {
                    if (args.length > i + 1) {
                        thingsToHandle.add(args[i + 1]);
                        args[i] = "";
                        args[i + 1] = "";
                    }
                }
                case "-u", "--url" -> {
                    if (args.length > i + 1) {
                        url = args[i + 1];
                        args[i] = "";
                        args[i + 1] = "";
                    }
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

    public static ArrayList<String> getThingsToHandle() {
        return thingsToHandle;
    }

    private static void initNativeAppName() {
        if (System.getProperty("os.name").toLowerCase().contains("linux")) {
            try {
                SymbolLookup glib = SymbolLookup.libraryLookup("libglib-2.0.so.0", Arena.global());
                java.util.Optional<MemorySegment> gSetPrgnameSymbol = glib.find("g_set_prgname");
                if (gSetPrgnameSymbol.isPresent()) {
                    Linker linker = Linker.nativeLinker();
                    MethodHandle gSetPrgname = linker.downcallHandle(
                            gSetPrgnameSymbol.get(),
                            FunctionDescriptor.ofVoid(ValueLayout.ADDRESS)
                    );
                    try (Arena arena = Arena.ofConfined()) {
                        MemorySegment cString = arena.allocateFrom("nex-app");
                        gSetPrgname.invokeExact(cString);
                    }
                }
            } catch (Throwable e) {
                System.err.println("Failed to initialize app name: " + e.getMessage());
            }
        }
    }
}