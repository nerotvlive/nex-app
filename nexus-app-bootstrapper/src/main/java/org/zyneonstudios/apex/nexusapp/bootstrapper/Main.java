package org.zyneonstudios.apex.nexusapp.bootstrapper;

import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;

public class Main {

    private static String path = getDefaultPath();

    public static void main(String[] args) {
        resolveArguments(args);
        NexusAppBootstrapper bootstrapper = new NexusAppBootstrapper(path,args);
        bootstrapper.update();
        bootstrapper.launch();
    }

    private static void resolveArguments(String[] args) {
        for(int i = 0; i < args.length; ++i) {
            String arg = args[i];
            if(arg.equalsIgnoreCase("--b-path")||arg.equalsIgnoreCase("-bp")) {
                path = args[i + 1];
                return;
            } else if(arg.equalsIgnoreCase("--b-help")||arg.equalsIgnoreCase("-bh")) {
                System.out.println("NEXUS App bootstrapper help");
                System.out.println("-bh or --b-help: Shows this help message");
                System.out.println("-bp or --b-path <path>: Overrides the default running path of the bootstrapper.");
                System.exit(0);
            }
        }
    }

    private static String getDefaultPath() {
        String appData;
        String os = System.getProperty("os.name").toLowerCase();
        if (os.contains("win")) {
            appData = System.getenv("LOCALAPPDATA");
        } else if (os.contains("mac")) {
            appData = System.getProperty("user.home") + "/Library/Application Support";
        } else {
            appData = System.getProperty("user.home") + "/.local/share";
        }
        Path folderPath = Paths.get(appData, "Zyneon/NEXUS App/bootstrapper");
        try {
            Files.createDirectories(folderPath);
        } catch (Exception e) {
            throw new RuntimeException(e.getMessage());
        }
        return (folderPath + "/").replace("\\", "/");
    }
}