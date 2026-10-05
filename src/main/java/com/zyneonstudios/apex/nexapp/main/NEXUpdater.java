package com.zyneonstudios.apex.nexapp.main;

import java.io.IOException;
import java.nio.file.Path;

public class NEXUpdater {

    static void main() {
        try {
            updateWindows();
        } catch (Exception e) {
            System.err.println("Could not update: " + e.getMessage());
        }
        System.exit(-1);
    }

    private static void updateWindows() throws IOException {
        Path installerPath = Path.of("C:\\Users\\nerotvlive\\Desktop\\NEX App-4.0.2.exe");
        String fileName = installerPath.getFileName().toString();

        String extension = "";
        int lastDot = fileName.lastIndexOf('.');
        if (lastDot > 0) {
            extension = fileName.substring(lastDot + 1).toLowerCase();
        }

        ProcessBuilder pb;
        if ("msi".equals(extension)) {
            pb = new ProcessBuilder(
                    "msiexec.exe",
                    "/i", installerPath.toAbsolutePath().toString(),
                    "/passive",
                    "/norestart"
            );
        } else if ("exe".equals(extension)) {
            pb = new ProcessBuilder(
                    installerPath.toAbsolutePath().toString(),
                    "/passive",
                    "/norestart"
            );
        } else {
            throw new IllegalArgumentException("Unknown installer type: ." + extension);
        }

        pb.start();
        System.exit(0);
    }
}