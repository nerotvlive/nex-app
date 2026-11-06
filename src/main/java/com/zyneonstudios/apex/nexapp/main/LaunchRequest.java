package com.zyneonstudios.apex.nexapp.main;

import java.net.URI;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;

public record LaunchRequest(boolean skinEditor, List<Path> files) {

    public static LaunchRequest parse(String[] args, Path workingDirectory) {
        boolean skinEditor = false;
        List<Path> files = new ArrayList<>();
        for (int i = 0; i < args.length; i++) {
            String arg = args[i];
            if (arg == null || arg.isBlank()) continue;
            switch (arg) {
                case "-se", "--skineditor" -> skinEditor = true;
                case "-u", "--url", "-p", "--port", "-uM", "--updateMeta" -> i++;
                default -> {
                    if (arg.startsWith("-")) continue;
                    Path file = resolveSkinFile(arg, workingDirectory);
                    if (file != null && !files.contains(file)) files.add(file);
                }
            }
        }
        return new LaunchRequest(skinEditor || !files.isEmpty(), List.copyOf(files));
    }

    private static Path resolveSkinFile(String arg, Path workingDirectory) {
        try {
            Path path = arg.regionMatches(true, 0, "file:", 0, 5) ? Path.of(URI.create(arg)) : Path.of(arg);
            if (!path.isAbsolute() && workingDirectory != null) path = workingDirectory.resolve(path);
            path = path.toAbsolutePath().normalize();
            String name = path.getFileName() == null ? "" : path.getFileName().toString().toLowerCase(Locale.ROOT);
            if (!name.endsWith(".png") && !name.endsWith(".nexskin")) return null;
            return Files.isRegularFile(path) ? path : null;
        } catch (Exception e) {
            return null;
        }
    }
}
