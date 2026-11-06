package com.zyneonstudios.apex.nexapp;

import com.zyneonstudios.apex.nexapp.main.InstanceManager;
import com.zyneonstudios.apex.nexapp.main.LaunchRequest;
import com.zyneonstudios.apex.nexapp.main.NEXApp;
import com.zyneonstudios.apex.nexapp.window.SkinEditorBridge;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

import java.lang.foreign.*;
import java.lang.invoke.MethodHandle;
import java.nio.file.Path;
import java.util.Collections;
import java.util.Locale;

@SpringBootApplication
public class Main {

    private static int port = 8274;
    private static String[] args;
    private static NEXApp nexApp;
    private static SpringApplication springApp;
    private static String url = "http://localhost:"+port;
    private static String updateMetaUrl = null;
    private static boolean dev = false;
    private static boolean nativeFrame = false;
    private static boolean shutdown = false;
    private static String mode = "";

    static void main(String[] args) {
        Main.args = args;
        String[] launchArgs = args.clone();
        resolveArgs();
        if(!InstanceManager.claim(port, launchArgs)) {
            return;
        }
        LaunchRequest launchRequest = LaunchRequest.parse(launchArgs, Path.of("").toAbsolutePath());
        if(launchRequest.skinEditor()) {
            mode = "se";
        }
        SkinEditorBridge.queueFiles(launchRequest.files());
        springApp = new SpringApplication(Main.class);
        springApp.setHeadless(false);
        initNativeAppName();
        nexApp = new NEXApp();
        InstanceManager.setHandler(nexApp::handleLaunchRequest);
        springApp.setDefaultProperties(Collections.singletonMap("server.port", String.valueOf(port)));
        springApp.run(args);
        nexApp.setStartMode(mode);
        nexApp.launch();
    }

    public static void stop(int exitCode) {
        if(shutdown) return;
        shutdown = true;
        if(nexApp!=null) {
            if(nexApp.getWindow()!=null) {
                try {
                    nexApp.getWindow().loadUrl(getBaseUrl() + "/loader?shutdown=true");
                } catch (Exception e) {
                    System.err.println("Failed to load shutdown URL: " + e.getMessage());
                }
            }
            if(nexApp.getModuleLoader()!=null) {
                try {
                    nexApp.getModuleLoader().deactivateModules();
                    nexApp.getModuleLoader().unloadModules();
                } catch (Exception e) {
                    System.err.println("Failed to deactivate modules: " + e.getMessage());
                }
            }
        }
        System.exit(exitCode);
    }

    private static void resolveArgs() {
        for(int i=0;i<args.length;i++) {
            switch (args[i]) {
                case "-v", "--vite" -> url = "http://localhost:5278";
                case "-d", "--dev" -> dev = true;
                case "-se", "--skineditor" -> mode = "se";
                case "-u", "--url" -> {
                    if (args.length > i + 1) {
                        url = args[i + 1];
                        args[i] = "";
                        args[i + 1] = "";
                    }
                }
                case "-p", "--port" -> {
                    if (args.length > i + 1) {
                        port = Integer.parseInt(args[i + 1]);
                        args[i] = "";
                        args[i + 1] = "";
                    }
                }
                case "-nF", "--nativeFrame" -> nativeFrame = true;
                case "-uM", "--updateMeta" -> {
                    if (args.length > i + 1) {
                        updateMetaUrl = args[i + 1];
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

    public static int getPort() {
        return port;
    }

    public static Path getAppDirectory() {
        String os = System.getProperty("os.name").toLowerCase(Locale.ROOT);
        String home = System.getProperty("user.home");
        if (os.contains("win")) {
            String appData = System.getenv("APPDATA");
            return Path.of(appData != null && !appData.isBlank() ? appData : home, "Zyneon Apex", "NEX App");
        } else if (os.contains("mac")) {
            return Path.of(home, "Library", "Application Support", "Zyneon Apex", "NEX App");
        }
        String dataHome = System.getenv("XDG_DATA_HOME");
        return Path.of(dataHome != null && !dataHome.isBlank() ? dataHome : Path.of(home, ".local", "share").toString(), "zyneonapex", "nex-app");
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

    public static String getUpdateMetaUrl() {
        return updateMetaUrl;
    }

    public static boolean isDev() {
        return dev;
    }

    public static void setUseNativeFrame(boolean useNativeFrame) {
        Main.nativeFrame = useNativeFrame;
    }

    public static boolean useNativeFrame() {
        return nativeFrame;
    }
}