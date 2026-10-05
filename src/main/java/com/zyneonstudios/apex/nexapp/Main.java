package com.zyneonstudios.apex.nexapp;

import com.google.gson.Gson;
import com.google.gson.JsonObject;
import com.zyneonstudios.nexus.desktop.NexusDesktop;
import com.zyneonstudios.nexus.utilities.file.FileGetter;
import com.zyneonstudios.nexus.utilities.json.GsonUtility;
import com.zyneonstudios.nexus.utilities.strings.StringGenerator;
import com.zyneonstudios.nexus.utilities.system.OperatingSystem;
import org.apache.commons.io.FileUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.builder.SpringApplicationBuilder;
import com.zyneonstudios.apex.nexapp.frame.ZyneonSplash;
import com.zyneonstudios.apex.nexapp.main.NEXApplication;
import com.zyneonstudios.apex.nexapp.utilities.ApplicationLogger;
import com.zyneonstudios.apex.nexapp.utilities.DiscordRichPresence;

import javax.swing.*;
import javax.swing.border.EmptyBorder;
import java.awt.*;
import java.io.*;
import java.lang.management.ManagementFactory;
import java.net.*;
import java.nio.charset.StandardCharsets;
import java.nio.file.*;
import java.util.*;
import java.util.List;
import java.util.concurrent.atomic.AtomicBoolean;

/**
 * The {@code Main} class is the primary entry point for the NEX App.
 * It initializes the application, parses command-line arguments, starts the web server (if necessary),
 * and launches the main application frame. It also handles the application's lifecycle and provides
 * access to the application's logger and port.
 */
@SpringBootApplication
public class Main {

    // Application Logger
    private static final ApplicationLogger logger = new ApplicationLogger("NEX");
    private static final Logger log = LoggerFactory.getLogger(Main.class);
    private static String[] args;

    // Application Configuration
    private static String path = getDefaultPath();
    private static String ui = null;
    private static int port = 8094;
    private static final String INSTANCE_LOCK_FILE = ".nex-app.instance";
    private static final String INSTANCE_PING_OK = "OK";
    private static final String INSTANCE_PING_HUNG = "HUNG";
    private static final String INSTANCE_PING_STARTING = "STARTING";
    private static final long EDT_PING_TIMEOUT_MS = 1000L;
    private static final String instanceId = UUID.randomUUID().toString();
    private static volatile boolean instanceOwner = false;
    private static ServerSocket focusServer;
    private static int focusPort = -1;
    private static String skippedUpdate = "0";

    private static String version = StringGenerator.generateAlphanumericString(12);

    /**
     * The main method, the entry point of the NEX App.
     *
     * @param args Command-line arguments passed to the application.
     */
    public static void main(String[] args) {
        // Display the splash screen.
        ZyneonSplash splash = new ZyneonSplash();
        splash.setVisible(true);
        loadVersion();
        checkExecutable();

        checkMigrate();
        checkAndUninstallNexus();

        // Enforce single-instance execution with hung detection and focus.
        if (!ensureSingleInstance()) {
            splash.dispose();
            return;
        }

        // Resolve command-line arguments.
        Main.args = args;
        resolveArguments(args);

        // Initialize the Nexus desktop environment.
        NexusDesktop.init();
        logger.setName("NEX",true);
        try {
            UIManager.put("TitlePane.menuBarEmbedded", true);
        } catch (Exception e) {
            logger.err(e.getMessage());
        }

        if(!logger.isDebugging()) {
            if (!checkVersion()) {
                System.exit(-1);
            }
        }

        // Create the main application instance.
        NEXApplication application = new NEXApplication(path, ui);

        // Start the web server if the application is not using the online UI.
        if (!application.isOnlineUI()) {
            try {
                startWebServer(args);
            } catch (Exception e) {
                System.exit(-1);
            }
        }

        // Launch the application and dispose of the splash screen if successful.
        if (application.launch()) {
            splash.dispose();
            System.gc();
        } else {
            // Stop the application if launching fails.
            NEXApplication.stop(1);
        }
    }

    /**
     * Loads the application version from the nexus.json file.
     */
    private static void loadVersion() {
        if(!getLogger().isDebugging()) {
            try {
                String data = new String(Thread.currentThread().getContextClassLoader().getResourceAsStream("nexus.json").readAllBytes());
                JsonObject nexus = new Gson().fromJson(data, JsonObject.class);
                version = nexus.get("version").getAsString();
            } catch (Exception e) {
                getLogger().err("Couldn't fetch version from nexus.json: " + e.getMessage());
            }
        }
    }

    /**
     * Returns the application version.
     * */
    public static String getVersion() {
        return version;
    }

    /**
     * Starts the embedded web server for the application.
     *
     * @param args Command-line arguments passed to the application.
     */
    private static void startWebServer(String[] args) {
        if(port > 65535) {
            throw new RuntimeException("Port range exceeded, cannot launch application web server. Try to restart your computer or stopping port using applications and try again.");
        }
        try {
            // Configure and start the Spring Boot web server.
            new SpringApplicationBuilder(Main.class)
                    .properties("logging.level.root=WARN", "logging.pattern.console=", "server.port=" + port)
                    .run(args);
        } catch (Exception e) {
            // Increment the port and retry if the initial port is in use.
            port++;
            startWebServer(args);
        }
    }

    /**
     * Resolves and processes command-line arguments.
     *
     * @param args Command-line arguments passed to the application.
     */
    private static void resolveArguments(String[] args) {
        for (int i = 0; i < args.length; i++) {
            try {
                String arg = args[i].toLowerCase();
                switch (arg) {
                    case "-h", "--help" -> {
                        // Display help message and exit.
                        logger.log("NEX App help:");
                        logger.log("  -d, --debug: Enables debug console output.");
                        logger.log("  -h, --help: This help message.");
                        logger.log("  -o, --online: Enables the connection to the online UI. Caution: This may cause problems with some modules.");
                        logger.log("  -p <path>, --path <path>: Lets you select the run folder.");
                        logger.log("  -u <path>, --ui <path>: Lets you select the folder where the user interface should be unpacked.");
                        System.exit(0);
                    }
                    case "-u", "--ui" -> ui = args[i + 1];
                    case "-p", "--path" -> path = args[i + 1];
                    case "-o", "--online" -> ui = "online";
                    case "-d", "--debug" -> logger.enableDebug();
                }
            } catch (Exception e) {
                // Handle argument parsing errors.
                logger.err(e.getMessage());
                logger.err("Use -h or --help at startup to view the startup arguments and their syntax.");
                System.exit(1);
            }
        }
    }

    /**
     * Gets the port used by the web server.
     *
     * @return The web server port.
     */
    public static int getPort() {
        return port;
    }

    public static String getDefaultPath() {
        String appData;
        String os = System.getProperty("os.name").toLowerCase();
        if (os.contains("win")) {
            appData = System.getenv("LOCALAPPDATA");
        } else if (os.contains("mac")) {
            appData = System.getProperty("user.home") + "/Library/Application Support";
        } else {
            appData = System.getProperty("user.home") + "/.local/share";
        }
        Path folderPath = Paths.get(appData, "Zyneon/NEXUS App");
        if(!folderPath.toFile().exists()) {
            folderPath = Paths.get(appData, "Zyneon/NEX App");
        }
        try {
            Files.createDirectories(folderPath);
        } catch (Exception e) {
            throw new RuntimeException(e.getMessage());
        }
        return (folderPath + "/").replace("\\", "/");
    }

    public static String[] getArgs() {
        return args;
    }

    public static ApplicationLogger getLogger() {
        return logger;
    }

    private static boolean ensureSingleInstance() {
        Path lockPath = Paths.get(path, INSTANCE_LOCK_FILE);
        try {
            Files.createDirectories(Paths.get(path));
        } catch (Exception e) {
            logger.err("Couldn't create app directory: " + e.getMessage());
        }

        InstanceInfo existing = readInstanceInfo(lockPath);
        if (existing != null) {
            if (isProcessAlive(existing.pid)) {
                InstancePing ping = pingInstance(existing.port);
                if (ping == InstancePing.OK || ping == InstancePing.STARTING) {
                    sendFocus(existing.port);
                    return false;
                }
                // Hung or unresponsive -> allow new instance
                logger.log("Detected unresponsive instance, starting a new one.");
            } else {
                logger.log("Detected stale instance lock, starting a new one.");
            }
            deleteInstanceLock(lockPath, existing.id);
        }

        if (!startFocusServer()) {
            logger.err("Couldn't start focus server.");
            return true;
        }

        if (!writeInstanceInfo(lockPath)) {
            closeFocusServer();
            InstanceInfo latest = readInstanceInfo(lockPath);
            if (latest != null) {
                if (isProcessAlive(latest.pid)) {
                    InstancePing ping = pingInstance(latest.port);
                    if (ping == InstancePing.OK || ping == InstancePing.STARTING) {
                        sendFocus(latest.port);
                        return false;
                    }
                }
            }
        }

        instanceOwner = true;
        Runtime.getRuntime().addShutdownHook(new Thread(Main::releaseInstanceResources));
        return true;
    }

    private static boolean startFocusServer() {
        try {
            focusServer = new ServerSocket(0, 50, InetAddress.getByName("127.0.0.1"));
            focusPort = focusServer.getLocalPort();
            Thread serverThread = new Thread(Main::runFocusServer, "nexus-focus-server");
            serverThread.setDaemon(true);
            serverThread.start();
            return true;
        } catch (Exception e) {
            logger.err("Failed to start focus server: " + e.getMessage());
            return false;
        }
    }

    private static void runFocusServer() {
        while (focusServer != null && !focusServer.isClosed()) {
            try (Socket socket = focusServer.accept()) {
                socket.setSoTimeout(1000);
                BufferedReader reader = new BufferedReader(new InputStreamReader(socket.getInputStream(), StandardCharsets.UTF_8));
                BufferedWriter writer = new BufferedWriter(new OutputStreamWriter(socket.getOutputStream(), StandardCharsets.UTF_8));
                String command = reader.readLine();
                if ("FOCUS".equalsIgnoreCase(command)) {
                    focusApplication();
                    writer.write(INSTANCE_PING_OK);
                } else if ("PING".equalsIgnoreCase(command)) {
                    writer.write(getInstanceStatus());
                } else {
                    writer.write(INSTANCE_PING_OK);
                }
                writer.newLine();
                writer.flush();
            } catch (IOException ignored) {
            }
        }
    }

    private static String getInstanceStatus() {
        try {
            if (NEXApplication.getInstance() == null
                    || !NEXApplication.getInstance().isLaunched()) {
                return INSTANCE_PING_STARTING;
            }
        } catch (Exception ignored) {
        }
        return isEdtResponsive(EDT_PING_TIMEOUT_MS) ? INSTANCE_PING_OK : INSTANCE_PING_HUNG;
    }

    private static boolean isEdtResponsive(long timeoutMs) {
        AtomicBoolean ran = new AtomicBoolean(false);
        try {
            SwingUtilities.invokeLater(() -> ran.set(true));
        } catch (Exception e) {
            return false;
        }
        long end = System.currentTimeMillis() + timeoutMs;
        while (!ran.get() && System.currentTimeMillis() < end) {
            try {
                Thread.sleep(25);
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
                break;
            }
        }
        return ran.get();
    }

    private static void focusApplication() {
        SwingUtilities.invokeLater(() -> {
            try {
                var app = NEXApplication.getInstance();
                if (app == null || app.getApplicationFrame() == null) {
                    return;
                }
                JFrame frame = app.getApplicationFrame().getAsJFrame();
                if (frame == null) {
                    return;
                }
                frame.setVisible(true);
                frame.setState(Frame.NORMAL);
                frame.toFront();
                frame.requestFocus();
                boolean rpc = true;
                if(NEXApplication.getInstance().getSettings().has("settings.discord.rpc")) {
                    try {
                        rpc = NEXApplication.getInstance().getSettings().getBool("settings.discord.rpc");
                    } catch (Exception ignore) {}
                }
                if(rpc) {
                    DiscordRichPresence.startRPC();
                }
            } catch (Exception ignored) {
            }
        });
    }

    private static boolean writeInstanceInfo(Path lockPath) {
        Properties props = new Properties();
        props.setProperty("pid", String.valueOf(ProcessHandle.current().pid()));
        props.setProperty("port", String.valueOf(focusPort));
        props.setProperty("id", instanceId);
        props.setProperty("ts", String.valueOf(System.currentTimeMillis()));
        try (BufferedWriter writer = Files.newBufferedWriter(
                lockPath,
                StandardCharsets.UTF_8,
                StandardOpenOption.CREATE_NEW,
                StandardOpenOption.WRITE
        )) {
            props.store(writer, "NEX App instance lock");
            return true;
        } catch (IOException e) {
            return false;
        }
    }

    private static InstanceInfo readInstanceInfo(Path lockPath) {
        if (!Files.exists(lockPath)) {
            return null;
        }
        Properties props = new Properties();
        try (BufferedReader reader = Files.newBufferedReader(lockPath, StandardCharsets.UTF_8)) {
            props.load(reader);
            long pid = parseLong(props.getProperty("pid"), -1L);
            int infoPort = (int) parseLong(props.getProperty("port"), -1L);
            String id = props.getProperty("id");
            long ts = parseLong(props.getProperty("ts"), 0L);
            if (pid <= 0 || infoPort <= 0) {
                return null;
            }
            return new InstanceInfo(pid, infoPort, id, ts);
        } catch (Exception e) {
            return null;
        }
    }

    private static void deleteInstanceLock(Path lockPath, String id) {
        if (!Files.exists(lockPath)) {
            return;
        }
        if (id != null) {
            InstanceInfo info = readInstanceInfo(lockPath);
            if (info != null && !id.equals(info.id)) {
                return;
            }
        }
        try {
            Files.deleteIfExists(lockPath);
        } catch (Exception ignored) {
        }
    }

    private static boolean isProcessAlive(long pid) {
        try {
            return ProcessHandle.of(pid).map(ProcessHandle::isAlive).orElse(false);
        } catch (Exception e) {
            return false;
        }
    }

    private static InstancePing pingInstance(int infoPort) {
        if (infoPort <= 0) {
            return InstancePing.NO_RESPONSE;
        }
        try (Socket socket = new Socket()) {
            socket.connect(new InetSocketAddress("127.0.0.1", infoPort), 400);
            socket.setSoTimeout(400);
            BufferedWriter writer = new BufferedWriter(new OutputStreamWriter(socket.getOutputStream(), StandardCharsets.UTF_8));
            BufferedReader reader = new BufferedReader(new InputStreamReader(socket.getInputStream(), StandardCharsets.UTF_8));
            writer.write("PING");
            writer.newLine();
            writer.flush();
            String response = reader.readLine();
            if (INSTANCE_PING_OK.equalsIgnoreCase(response)) {
                return InstancePing.OK;
            }
            if (INSTANCE_PING_HUNG.equalsIgnoreCase(response)) {
                return InstancePing.HUNG;
            }
            if (INSTANCE_PING_STARTING.equalsIgnoreCase(response)) {
                return InstancePing.STARTING;
            }
            return InstancePing.NO_RESPONSE;
        } catch (Exception e) {
            return InstancePing.NO_RESPONSE;
        }
    }

    private static void sendFocus(int infoPort) {
        if (infoPort <= 0) {
            return;
        }
        try (Socket socket = new Socket()) {
            socket.connect(new InetSocketAddress("127.0.0.1", infoPort), 400);
            BufferedWriter writer = new BufferedWriter(new OutputStreamWriter(socket.getOutputStream(), StandardCharsets.UTF_8));
            writer.write("FOCUS");
            writer.newLine();
            writer.flush();
        } catch (Exception ignored) {
        }
    }

    private static long parseLong(String value, long fallback) {
        if (value == null) {
            return fallback;
        }
        try {
            return Long.parseLong(value.trim());
        } catch (NumberFormatException e) {
            return fallback;
        }
    }

    private static void closeFocusServer() {
        try {
            if (focusServer != null) {
                focusServer.close();
            }
        } catch (Exception ignored) {
        }
    }

    private static void releaseInstanceResources() {
        if (instanceOwner) {
            deleteInstanceLock(Paths.get(path, INSTANCE_LOCK_FILE), instanceId);
        }
        closeFocusServer();
    }

    private enum InstancePing {
        OK,
        HUNG,
        STARTING,
        NO_RESPONSE
    }

    private record InstanceInfo(long pid, int port, String id, long ts) {
    }

    public static boolean checkVersion() {
        return checkVersionWin();
    }

    private static boolean checkVersionWin() {
        if(OperatingSystem.getType() == OperatingSystem.Type.Windows) {
            try {
                JsonObject jsonMeta = GsonUtility.getObject("https://zyneonstudios.github.io/apex-metadata/nexus-app/win-files/win-metadata.json");
                String latestVersion = jsonMeta.get("version").getAsString();
                if(latestVersion.equals(skippedUpdate())) {
                    return true;
                }

                String data = new String(Thread.currentThread().getContextClassLoader().getResourceAsStream("nexus.json").readAllBytes());
                JsonObject nexus = new Gson().fromJson(data, JsonObject.class);
                String currentVersion = nexus.get("version").getAsString();

                JFrame parent = null;
                if(NEXApplication.getInstance() != null) {
                    if(NEXApplication.getInstance().getApplicationFrame() != null) {
                        parent = NEXApplication.getInstance().getApplicationFrame();
                    }
                }

                if(!latestVersion.equals(currentVersion)&&isWindowsEXE()) {
                    int update = JOptionPane.showConfirmDialog(
                            parent,
                            "Do you want to update to the latest version?\n\nCurrent version: " + currentVersion+"\nLatest version: "+latestVersion,
                            "NEX App update available!",
                            JOptionPane.YES_NO_OPTION,
                            JOptionPane.QUESTION_MESSAGE
                    );

                    if (update == JOptionPane.YES_OPTION) {
                        File tempDir = new File(getDefaultPath()+"temp/");
                        logger.deb("Created temp folder: "+tempDir.mkdirs());
                        tempDir.deleteOnExit();

                        JDialog frame = new JDialog(parent);
                        frame.setTitle("NEX App updater");
                        frame.setLayout(new BorderLayout());
                        frame.setDefaultCloseOperation(JFrame.DO_NOTHING_ON_CLOSE);
                        frame.setSize(400, 100);
                        frame.setLocationRelativeTo(null);
                        frame.setResizable(false);

                        JProgressBar indeterminator = new JProgressBar();
                        indeterminator.setIndeterminate(true);
                        indeterminator.setStringPainted(true);
                        indeterminator.setString("Downloading NEX App v"+latestVersion+"...");
                        indeterminator.setBorder(new EmptyBorder(10, 10, 10, 10));
                        frame.add(indeterminator, BorderLayout.CENTER);

                        frame.setVisible(true);

                        File updater = FileGetter.downloadFile(jsonMeta.get("downloadUrl").getAsString(), getDefaultPath()+"temp/"+ StringGenerator.generateAlphanumericString(12) +"-nex-app-"+latestVersion+"-setup.exe");
                        if (updater != null && updater.exists()) {
                            try {
                                Path installerPath = updater.toPath();
                                String fileName = installerPath.getFileName().toString();

                                String extension = "";
                                int lastDot = fileName.lastIndexOf('.');
                                if (lastDot > 0) {
                                    extension = fileName.substring(lastDot + 1).toLowerCase();
                                }

                                ProcessBuilder pb;
                                boolean forceOldUpdateBehavior = false;
                                if ("msi".equals(extension)&&!forceOldUpdateBehavior) {
                                    pb = new ProcessBuilder(
                                            "msiexec.exe",
                                            "/i", installerPath.toAbsolutePath().toString(),
                                            "/passive",
                                            "/norestart"
                                    );
                                } else if ("exe".equals(extension)&&!forceOldUpdateBehavior) {
                                    pb = new ProcessBuilder(
                                            installerPath.toAbsolutePath().toString(),
                                            "/passive",
                                            "/norestart"
                                    );
                                } else {
                                    pb = new ProcessBuilder(
                                            updater.getAbsolutePath()
                                    ).directory(updater.getParentFile());
                                }

                                pb.start();
                                System.exit(0);
                                System.exit(0);
                            } catch (IOException e) {
                                logger.err(e.getMessage());
                                return true;
                            }
                            return false;
                        }
                    } else {
                        skippedUpdate = latestVersion;
                    }
                }
            } catch (Exception e) {
                logger.err(e.getMessage());
            }
        }
        return true;
    }

    public static String skippedUpdate() {
        return skippedUpdate;
    }

    private static String executablePath = null;
    private static boolean isWindowsEXE = false;
    private static void checkExecutable() {
        if(OperatingSystem.getType().equals(OperatingSystem.Type.Windows)) {
            try {
                String jpackagePath = System.getProperty("jpackage.app-path");
                if (jpackagePath != null && !jpackagePath.isBlank()) {
                    logger.log("Running as Windows executable...");
                    isWindowsEXE = true;
                    executablePath = jpackagePath;
                }
            } catch (Exception e) {
                logger.err("Failed to get native windows executable path: " + e.getMessage(),false);
            }
        }
        if(executablePath == null) {
            try {
                File jarFile = new File(Main.class.getProtectionDomain().getCodeSource().getLocation().toURI());
                String fullPath = jarFile.getAbsolutePath();
                if(!fullPath.isBlank() && fullPath.toLowerCase().endsWith(".jar")) {
                    logger.log("Running as Java .jar executable...");
                    executablePath = fullPath;
                }
            } catch (Exception e) {
                logger.err("Failed to get java .jar executable path: " + e.getMessage(),false);
            }
        }
        if(executablePath == null) {
            try {
                File target = new File("target");
                if(target.exists()&&target.isDirectory()) {
                    String targetPath = target.getAbsolutePath()+File.separator+"nex-app-"+version+".jar";
                    if(new File(targetPath).exists()) {
                        logger.log("Running as Java .jar executable (dev env)...");
                        executablePath = targetPath;
                    }
                }
            } catch (Exception e) {
                logger.err("Failed to get executable path from target directory: " + e.getMessage(),false);
            }
        }
        if(executablePath == null) {
            logger.log("Running without executable...");
            logger.err("Failed to get executable path. If you are running this application inside a development environment, first run \"mvn clean package\" and try again or skip migration.",false);
        } else {
            logger.log("Executable path: "+executablePath);
        }
    }

    public static String getExecutablePath() {
        return executablePath;
    }

    public static boolean isWindowsEXE() {
        return isWindowsEXE;
    }

    private static boolean needAdmin = false;
    private static boolean needMigration = false;
    private static void checkMigrate() {
        logger.log("Checking for migration...");
        if(OperatingSystem.getType().equals(OperatingSystem.Type.Windows)&&executablePath!=null&&!executablePath.isBlank()) {
            logger.log("OS: Windows | executable path found...");
            try {
                if(needMigration(Paths.get("C:\\Users","Public","Desktop"))) {
                    needMigration = true;
                    needAdmin = true;
                }
            } catch (Exception e) {
                logger.err("Failed to check public desktop path for shortcut migration: "+e.getMessage(),false);
            }
            try {
                if(needMigration(Paths.get("C:\\ProgramData","Microsoft","Windows","Start Menu","Programs"))) {
                    needMigration = true;
                    needAdmin = true;
                }
            } catch (Exception e) {
                logger.err("Failed to check public start menu for shortcut migration: "+e.getMessage(),false);
            }
            try {
                if(needMigration(Paths.get(System.getProperty("user.home"),"AppData","Roaming","Microsoft","Windows","Start Menu","Programs"))) {
                    needMigration = true;
                }
            } catch (Exception e) {
                logger.err("Failed to check private start menu path for shortcut migration: "+e.getMessage(),false);
            }
            try {
                if(needMigration(Paths.get(System.getProperty("user.home"),"Desktop"))) {
                    needMigration = true;
                }
            } catch (Exception e) {
                logger.err("Failed to check private desktop path for shortcut migration: "+e.getMessage(),false);
            }
        }
        if(needMigration) {
            logger.log("Migration needed!");
            try {
                migrate(Paths.get(System.getProperty("user.home"),"Desktop"));
            } catch (Exception e) {
                logger.err("Failed to migrate private desktop shortcut: "+e.getMessage(),false);
            }
            try {
                migrate(Paths.get(System.getProperty("user.home"),"AppData","Roaming","Microsoft","Windows","Start Menu","Programs"));
            } catch (Exception e) {
                logger.err("Failed to migrate private start menu shortcut: "+e.getMessage(),false);
            }
            try {
                migrate(Paths.get(System.getProperty("user.home"),"AppData","Roaming","Microsoft","Windows","Start Menu","Programs","Zyneon Apex"));
            } catch (Exception e) {
                logger.err("Failed to migrate private start menu shortcut: "+e.getMessage(),false);
            }
            if(needAdmin&&isAdmin()) {
                try {
                    migrate(Paths.get("C:\\Users","Public","Desktop"));
                } catch (Exception e) {
                    logger.err("Failed to migrate private desktop shortcut: "+e.getMessage(),false);
                }
                try {
                    try {
                        FileUtils.forceDelete(Paths.get("C:\\ProgramData","Microsoft","Windows","Start Menu","Programs","NEXUS App.lnk").toFile());
                    } catch ( Exception e) {
                        FileUtils.forceDeleteOnExit(Paths.get("C:\\ProgramData","Microsoft","Windows","Start Menu","Programs","NEXUS App.lnk").toFile());
                    }
                } catch (Exception e) {
                    logger.err("Failed to migrate private desktop shortcut: "+e.getMessage(),false);
                }
                try {
                    migrate(Paths.get("C:\\ProgramData","Microsoft","Windows","Start Menu","Programs","Zyneon Apex"));
                } catch (Exception e) {
                    logger.err("Failed to migrate private desktop shortcut: "+e.getMessage(),false);
                }
            } else if(needAdmin&&!isAdmin()) {
                logger.log("Admin rights needed for migration!");
                logger.log("Requesting admin rights...");
                requestAdmin();
            }
            restartAfterMigration();
        } else {
            logger.log("No migration needed!");
        }
    }

    private static void requestAdmin() {
        try {
            String executablePath = getExecutablePath();
            String command = "";
            if(isWindowsEXE) {
                command = "powershell -Command \"Start-Process -FilePath '"+executablePath+"' -Verb RunAs\"";
            } else {
                Optional<String> javaPath = ProcessHandle.current().info().command();
                if (javaPath.isPresent()) {
                    String java = javaPath.get();
                    command = "powershell -Command \"Start-Process -FilePath '"+java+"' -ArgumentList '-jar \""+executablePath+"\"' -Verb RunAs\"";
                } else {
                    logger.err("Failed to retrieve Java executable path!",false);
                    return;
                }
            }
            Runtime.getRuntime().exec(command);
            System.exit(0);
        } catch (Exception e) {
            logger.err("Failed to request admin privileges: "+e,false);
            System.exit(1);
        }
        System.exit(-1);
    }

    private static void restartAfterMigration() {
        try {
            String executablePath = getExecutablePath();
            String command = "";
            if(isWindowsEXE) {
                command = "powershell -Command \"Start-Process explorer.exe '"+executablePath+"'\"";
            } else {
                Optional<String> javaPath = ProcessHandle.current().info().command();
                if (javaPath.isPresent()) {
                    String java = javaPath.get().replace("java.exe","javaw.exe");
                    command = "powershell -Command \"(New-Object -ComObject Shell.Application).ShellExecute('" + java + "', '-jar \"" + executablePath + "\"', '', 'open', 1)\"";                } else {
                    logger.err("Failed to retrieve Java executable path!",false);
                    return;
                }
            }
            Runtime.getRuntime().exec(command);
            System.exit(0);
        } catch (Exception e) {
            logger.err("Failed to drop admin privileges: "+e,false);
            System.exit(1);
        }
        System.exit(-1);
    }

    @SuppressWarnings("deprecation")
    private static boolean isAdmin() {
        try {
            Process process = Runtime.getRuntime().exec("net session");
            process.waitFor();
            return process.exitValue() == 0;
        } catch (Exception e) {
            return false;
        }
    }

    private static void migrate(Path path) {
        logger.log("Migrating "+path.toString()+"...");
        if(path.toFile().exists()&&path.toFile().isDirectory()) {
            File folder = path.toFile();
            File oldShortcut = new File(folder.getAbsolutePath()+File.separator+"NEXUS App.lnk");
            File shortcut = new File(folder.getAbsolutePath()+File.separator+"NEX App (Legacy).lnk");
            File leveled_shortcut = new File(folder.getAbsolutePath()+File.separator+"Zyneon Apex"+File.separator+"NEX App (Legacy).lnk");
            if(oldShortcut.exists()) {
                if(shortcut.exists()||leveled_shortcut.exists()) {
                    try {
                        FileUtils.forceDelete(oldShortcut);
                        if(oldShortcut.exists()) {
                            FileUtils.forceDeleteOnExit(oldShortcut);
                            logger.log("Trying to delete old shortcut on application exit...");
                        } else {
                            logger.log("Successfully migrated old shortcut by deleting it!");
                        }
                    } catch (Exception e) {
                        logger.err("Failed to delete old shortcut: "+e.getMessage(),false);
                    }
                } else {
                    try {
                        String oldPath = oldShortcut.getAbsolutePath();
                        String newPath = oldPath + File.separator + "Zyneon Apex" + File.separator + "NEX App (Legacy).lnk";
                        try {
                            if(new File(newPath).exists()) {
                                FileUtils.forceDelete(oldShortcut);
                                if(oldShortcut.exists()) {
                                    FileUtils.forceDeleteOnExit(oldShortcut);
                                    logger.log("Trying to delete old shortcut on application exit...");
                                } else {
                                    logger.log("Successfully migrated old shortcut by deleting it!");
                                }
                            }
                            if(path.endsWith("Desktop")&&!path.toString().contains(File.separator+"Public"+File.separator+"Desktop")) {
                                newPath = Paths.get("C:\\Users","Public","Desktop","NEX App (Legacy).lnk").toString();
                                if(new File(newPath).exists()) {
                                    FileUtils.forceDelete(oldShortcut);
                                    if(oldShortcut.exists()) {
                                        FileUtils.forceDeleteOnExit(oldShortcut);
                                        logger.log("Trying to delete old shortcut on application exit...");
                                    } else {
                                        logger.log("Successfully migrated old shortcut by deleting it!");
                                    }
                                }
                            } else if(path.endsWith("Programs")&&path.toString().contains(File.separator+"AppData"+File.separator+"Roaming")) {
                                newPath = Paths.get("C:\\ProgramData","Microsoft","Windows","Start Menu","Programs","Zyneon Apex","NEX App (Legacy).lnk").toString();
                                if(new File(newPath).exists()) {
                                    FileUtils.forceDelete(oldShortcut);
                                    if(oldShortcut.exists()) {
                                        FileUtils.forceDeleteOnExit(oldShortcut);
                                        logger.log("Trying to delete old shortcut on application exit...");
                                    } else {
                                        logger.log("Successfully migrated old shortcut by deleting it!");
                                    }
                                }
                            }
                        } catch (Exception e) {
                            logger.err("Failed to detect new shortcut: "+e.getMessage(),false);
                        }
                        FileUtils.moveFile(oldShortcut,shortcut);
                        if(new File(oldPath).exists()) {
                            throw new IOException("Failed to rename shortcut "+oldPath+" to "+shortcut.getAbsolutePath());
                        } else {
                            logger.log("Successfully migrated old shortcut by renaming it!");
                        }
                    } catch (Exception e) {
                        logger.err("Failed to rename shortcut: "+e.getMessage(),false);
                    }
                }
                logger.log(" ");
            }
        }
    }

    private static boolean needMigration(Path path) {
        logger.log("Checking for migration need in "+path.toString()+"...");
        if(path.toFile().exists()&&path.toFile().isDirectory()) {
            logger.log("...path exists and is a directory...");
            File folder = path.toFile();
            File shortcut = new File(folder.getAbsolutePath()+File.separator+"NEXUS App.lnk");
            boolean value =  shortcut.exists();
            logger.log("...migration need check complete, needed: "+value);
            logger.log(" ");
            return value;
        }
        return false;
    }

    public static boolean checkAndUninstallNexus() {
        String targetProgram = "NEXUS App Version";

        String[] registryPaths = {
                "HKLM\\Software\\Microsoft\\Windows\\CurrentVersion\\Uninstall",
                "HKLM\\Software\\Wow6432Node\\Microsoft\\Windows\\CurrentVersion\\Uninstall",
                "HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Uninstall"
        };

        String uninstallCommand = null;

        for (String regPath : registryPaths) {
            try {
                Process process = new ProcessBuilder("reg", "query", regPath, "/s").start();
                try (BufferedReader reader = new BufferedReader(new InputStreamReader(process.getInputStream()))) {
                    String line;
                    boolean matchFound = false;
                    String currentUninstallString = null;

                    while ((line = reader.readLine()) != null) {
                        line = line.trim();

                        if (line.contains("DisplayName") && line.contains(targetProgram)) {
                            matchFound = true;
                        }

                        if (line.contains("UninstallString")) {
                            String[] parts = line.split("REG_SZ", 2);
                            if (parts.length > 1) {
                                currentUninstallString = parts[1].trim();
                            }
                        }

                        if (line.isEmpty()) {
                            if (matchFound && currentUninstallString != null) {
                                uninstallCommand = currentUninstallString;
                                break;
                            }
                            matchFound = false;
                            currentUninstallString = null;
                        }
                    }
                }
                if (uninstallCommand != null) break;
            } catch (Exception e) {}
        }

        if (uninstallCommand == null) {
            return false;
        }

        String silentArgs = "";
        if (uninstallCommand.toLowerCase().contains("msiexec")) {
            silentArgs = " /qn /norestart";
        } else {
            silentArgs = " /VERYSILENT /SUPPRESSMSGBOXES /NORESTART /S";
        }

        String finalCommand = uninstallCommand + silentArgs;

        try {
            ProcessBuilder pb = new ProcessBuilder("cmd.exe", "/c", finalCommand);
            pb.start();
            return true;
        } catch (Exception e) {
            return false;
        }
    }
}