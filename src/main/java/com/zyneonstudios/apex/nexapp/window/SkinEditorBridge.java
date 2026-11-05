package com.zyneonstudios.apex.nexapp.window;

import com.zyneonstudios.apex.nexapp.springboot.controllers.ApiController;
import io.avaje.webview.Webview;

import java.io.IOException;
import java.lang.foreign.MemorySegment;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.*;

public class SkinEditorBridge {

    private static final Set<String> EXTENSIONS = Set.of("png", "nexskin");
    private static final long MAX_FILE_SIZE = 16L * 1024 * 1024;
    private static final String OS = System.getProperty("os.name").toLowerCase(Locale.ROOT);

    private final Webview webview;

    private SkinEditorBridge(Webview webview) {
        this.webview = webview;
    }

    public static void register(Webview webview) {
        SkinEditorBridge bridge = new SkinEditorBridge(webview);

        webview.bind("skinEditorOpenFile", (args) -> {
            List<?> params = parse(args);
            String requestId = string(params, 0);
            if (requestId == null) return null;
            Thread.ofPlatform().name("nex-skin-open").start(() -> bridge.resolve(requestId, bridge.openFile()));
            return null;
        });

        webview.bind("skinEditorSaveFile", (args) -> {
            List<?> params = parse(args);
            String requestId = string(params, 0);
            if (requestId == null) return null;
            String fileName = string(params, 1);
            String data = string(params, 2);
            String path = string(params, 3);
            boolean saveAs = params.size() > 4 && Boolean.TRUE.equals(params.get(4));
            Thread.ofPlatform().name("nex-skin-save").start(() -> bridge.resolve(requestId, bridge.saveFile(fileName, data, path, saveAs)));
            return null;
        });

        webview.bind("skinEditorOpenFolder", (_) -> {
            Thread.ofPlatform().name("nex-skin-folder").start(SkinEditorBridge::openSkinsDirectory);
            return null;
        });
    }

    public static Path getSkinsDirectory() {
        String home = System.getProperty("user.home");
        if (OS.contains("win")) {
            String appData = System.getenv("APPDATA");
            return Path.of(appData != null && !appData.isBlank() ? appData : home, "Zyneon Apex", "NEX App", "skins");
        } else if (OS.contains("mac")) {
            return Path.of(home, "Library", "Application Support", "Zyneon Apex", "NEX App", "skins");
        }
        String dataHome = System.getenv("XDG_DATA_HOME");
        return Path.of(dataHome != null && !dataHome.isBlank() ? dataHome : Path.of(home, ".local", "share").toString(), "zyneonapex", "nex-app", "skins");
    }

    private Map<String, Object> openFile() {
        try {
            NativeFileDialog.Result dialog = NativeFileDialog.open(options("Open skin", null, null), owner());
            if (!dialog.available()) return result("unavailable");
            if (dialog.cancelled()) return result("cancelled");
            Path file = dialog.path();
            if (!hasValidExtension(file.getFileName().toString())) return error("Only .png and .nexskin files are supported");
            if (Files.size(file) > MAX_FILE_SIZE) return error("The file is too large");
            Map<String, Object> result = result("ok");
            result.put("name", file.getFileName().toString());
            result.put("path", file.toAbsolutePath().toString());
            result.put("data", Base64.getEncoder().encodeToString(Files.readAllBytes(file)));
            return result;
        } catch (Exception e) {
            System.err.println("[SkinEditor] Failed to open file: " + e.getMessage());
            return error(e.getMessage());
        }
    }

    private Map<String, Object> saveFile(String fileName, String data, String path, boolean saveAs) {
        try {
            if (data == null) return error("No data");
            String suggestedName = sanitizeFileName(fileName == null || fileName.isBlank() ? "skin.nexskin" : fileName);
            Path target = null;
            Path known = path == null || path.isBlank() ? null : Path.of(path);
            if (!saveAs && known != null && hasValidExtension(known.getFileName().toString())) {
                target = known;
            }
            if (target == null) {
                NativeFileDialog.Result dialog = NativeFileDialog.save(options("Save skin", suggestedName, known != null ? known.getParent() : null), owner());
                if (dialog.cancelled()) return result("cancelled");
                target = dialog.available() ? dialog.path() : uniqueFile(skinsDirectoryOrHome().resolve(suggestedName));
            }
            if (!hasValidExtension(target.getFileName().toString())) {
                target = target.resolveSibling(target.getFileName() + "." + extensionOf(suggestedName, "nexskin"));
            }
            byte[] bytes = Base64.getDecoder().decode(data);
            if (bytes.length > MAX_FILE_SIZE) return error("The file is too large");
            Path parent = target.toAbsolutePath().getParent();
            if (parent != null) Files.createDirectories(parent);
            Files.write(target, bytes);
            Map<String, Object> result = result("ok");
            result.put("name", target.getFileName().toString());
            result.put("path", target.toAbsolutePath().toString());
            return result;
        } catch (Exception e) {
            System.err.println("[SkinEditor] Failed to save file: " + e.getMessage());
            return error(e.getMessage());
        }
    }

    private static void openSkinsDirectory() {
        try {
            Path directory = getSkinsDirectory();
            Files.createDirectories(directory);
            String path = directory.toAbsolutePath().toString();
            if (OS.contains("win")) {
                new ProcessBuilder("explorer.exe", path).start();
            } else if (OS.contains("mac")) {
                new ProcessBuilder("open", path).start();
            } else {
                new ProcessBuilder("xdg-open", path).start();
            }
        } catch (IOException e) {
            System.err.println("[SkinEditor] Failed to open skins folder: " + e.getMessage());
        }
    }

    private void resolve(String requestId, Map<String, Object> result) {
        try {
            String script = "window.nexSkinBridgeResolve && window.nexSkinBridgeResolve("
                    + ApiController.getObjectMapper().writeValueAsString(requestId) + ","
                    + ApiController.getObjectMapper().writeValueAsString(result) + ");";
            webview.dispatch(() -> webview.eval(script));
        } catch (Exception e) {
            System.err.println("[SkinEditor] Failed to answer request: " + e.getMessage());
        }
    }

    private static NativeFileDialog.Options options(String title, String fileName, Path directory) {
        Path start = directory != null && Files.isDirectory(directory) ? directory : skinsDirectoryOrHome();
        List<String> extensions = fileName == null ? List.of("png", "nexskin") : List.of(extensionOf(fileName, "nexskin"));
        String filterName = fileName == null ? "Skins" : extensions.getFirst().equals("png") ? "PNG" : "NEX Skin";
        return new NativeFileDialog.Options(title, filterName, extensions, start, fileName);
    }

    private static Path skinsDirectoryOrHome() {
        Path directory = getSkinsDirectory();
        try {
            Files.createDirectories(directory);
            return directory;
        } catch (IOException e) {
            return Path.of(System.getProperty("user.home"));
        }
    }

    private static Path uniqueFile(Path file) {
        if (!Files.exists(file)) return file;
        String name = file.getFileName().toString();
        int dot = name.lastIndexOf('.');
        String base = dot > 0 ? name.substring(0, dot) : name;
        String extension = dot > 0 ? name.substring(dot) : "";
        for (int i = 2; ; i++) {
            Path candidate = file.resolveSibling(base + " (" + i + ")" + extension);
            if (!Files.exists(candidate)) return candidate;
        }
    }

    private MemorySegment owner() {
        try {
            return webview.nativeWindowPointer();
        } catch (Throwable e) {
            return MemorySegment.NULL;
        }
    }

    private static List<?> parse(String args) {
        try {
            List<?> list = ApiController.getObjectMapper().readValue(args, List.class);
            return list != null ? list : List.of();
        } catch (Exception e) {
            return List.of();
        }
    }

    private static String string(List<?> params, int index) {
        if (params.size() <= index) return null;
        Object value = params.get(index);
        return value == null ? null : value.toString();
    }

    private static boolean hasValidExtension(String name) {
        return EXTENSIONS.contains(extensionOf(name, ""));
    }

    private static String extensionOf(String name, String fallback) {
        int dot = name.lastIndexOf('.');
        return dot >= 0 && dot < name.length() - 1 ? name.substring(dot + 1).toLowerCase(Locale.ROOT) : fallback;
    }

    private static String sanitizeFileName(String name) {
        String clean = name.replaceAll("[\\\\/:*?\"<>|]+", "_").trim();
        return clean.isBlank() ? "skin.nexskin" : clean;
    }

    private static Map<String, Object> result(String status) {
        Map<String, Object> result = new LinkedHashMap<>();
        result.put("status", status);
        return result;
    }

    private static Map<String, Object> error(String message) {
        Map<String, Object> result = result("error");
        result.put("message", message == null ? "Unknown error" : message);
        return result;
    }
}
