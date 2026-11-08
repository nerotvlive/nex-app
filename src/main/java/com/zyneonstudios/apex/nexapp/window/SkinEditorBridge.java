package com.zyneonstudios.apex.nexapp.window;

import com.zyneonstudios.apex.nexapp.Main;
import com.zyneonstudios.apex.nexapp.springboot.controllers.ApiController;
import io.avaje.webview.Webview;

import java.io.IOException;
import java.lang.foreign.MemorySegment;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.attribute.FileTime;
import java.time.Duration;
import java.util.*;
import java.util.concurrent.ConcurrentLinkedQueue;
import java.util.function.Supplier;
import java.util.stream.Stream;

public class SkinEditorBridge {

    public static final String WINDOW_ID = "/skineditor";

    private static final Queue<Path> pendingFiles = new ConcurrentLinkedQueue<>();
    private static final Set<String> EXTENSIONS = Set.of("png", "nexskin");
    private static final long MAX_FILE_SIZE = 16L * 1024 * 1024;
    private static final String OS = System.getProperty("os.name").toLowerCase(Locale.ROOT);
    private static final String SESSION_SERVER = "https://sessionserver.mojang.com/session/minecraft/profile/";
    private static final String PROFILE_SERVICE = "https://api.minecraftservices.com/minecraft/profile";
    private static volatile Supplier<String> accessTokenProvider = () -> null;
    private static final HttpClient HTTP = HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(10)).followRedirects(HttpClient.Redirect.NORMAL).build();

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

        webview.bind("skinEditorPendingFiles", (args) -> {
            List<?> params = parse(args);
            String requestId = string(params, 0);
            if (requestId == null) return null;
            Thread.ofPlatform().name("nex-skin-pending").start(() -> bridge.resolve(requestId, takePendingFiles()));
            return null;
        });

        webview.bind("skinLibraryList", (args) -> {
            List<?> params = parse(args);
            String requestId = string(params, 0);
            if (requestId == null) return null;
            Thread.ofPlatform().name("nex-skin-library").start(() -> bridge.resolve(requestId, listLibrary()));
            return null;
        });

        webview.bind("skinLibraryWrite", (args) -> {
            List<?> params = parse(args);
            String requestId = string(params, 0);
            if (requestId == null) return null;
            boolean overwrite = params.size() > 4 && Boolean.TRUE.equals(params.get(4));
            Thread.ofPlatform().name("nex-skin-library").start(() -> bridge.resolve(requestId, writeOutfit(string(params, 1), string(params, 2), string(params, 3), overwrite)));
            return null;
        });

        webview.bind("skinLibraryCreateCharacter", (args) -> {
            List<?> params = parse(args);
            String requestId = string(params, 0);
            if (requestId == null) return null;
            Thread.ofPlatform().name("nex-skin-library").start(() -> bridge.resolve(requestId, createCharacter(string(params, 1))));
            return null;
        });

        webview.bind("skinLibraryRename", (args) -> {
            List<?> params = parse(args);
            String requestId = string(params, 0);
            if (requestId == null) return null;
            Thread.ofPlatform().name("nex-skin-library").start(() -> bridge.resolve(requestId, renameEntry(string(params, 1), string(params, 2))));
            return null;
        });

        webview.bind("skinLibraryDelete", (args) -> {
            List<?> params = parse(args);
            String requestId = string(params, 0);
            if (requestId == null) return null;
            Thread.ofPlatform().name("nex-skin-library").start(() -> bridge.resolve(requestId, deleteEntry(string(params, 1))));
            return null;
        });

        webview.bind("skinLibraryOpenInEditor", (args) -> {
            List<?> params = parse(args);
            List<Path> files = new ArrayList<>();
            for (Object value : params) {
                Path file = libraryPath(value == null ? null : value.toString());
                if (file != null && Files.isRegularFile(file)) files.add(file);
            }
            if (files.isEmpty()) return null;
            Thread.ofPlatform().name("nex-skin-library").start(() -> {
                queueFiles(files);
                WebviewWindow.openSecondary(WINDOW_ID);
                notifyPendingFiles();
            });
            return null;
        });

        webview.bind("skinLibraryPlayerSkin", (args) -> {
            List<?> params = parse(args);
            String requestId = string(params, 0);
            if (requestId == null) return null;
            Thread.ofPlatform().name("nex-skin-player").start(() -> bridge.resolve(requestId, fetchPlayerSkin(string(params, 1))));
            return null;
        });

        webview.bind("skinLibraryPlayerCapes", (args) -> {
            List<?> params = parse(args);
            String requestId = string(params, 0);
            if (requestId == null) return null;
            Thread.ofPlatform().name("nex-skin-capes").start(() -> bridge.resolve(requestId, fetchPlayerCapes(string(params, 1), accessToken())));
            return null;
        });

        webview.bind("skinEditorOpenFolder", (_) -> {
            Thread.ofPlatform().name("nex-skin-folder").start(SkinEditorBridge::openSkinsDirectory);
            return null;
        });

        webview.bind("skinLibraryOpenFolder", (args) -> {
            Path directory = libraryPath(string(parse(args), 0));
            if (directory == null || !Files.isDirectory(directory)) return null;
            Thread.ofPlatform().name("nex-skin-folder").start(() -> openDirectory(directory));
            return null;
        });
    }

    public static void setAccessTokenProvider(Supplier<String> provider) {
        accessTokenProvider = provider == null ? () -> null : provider;
    }

    private static String accessToken() {
        try {
            return accessTokenProvider.get();
        } catch (Exception e) {
            System.err.println("[SkinLibrary] Failed to get access token: " + e.getMessage());
            return null;
        }
    }

    public static Path getSkinsDirectory() {
        return Main.getAppDirectory().resolve("skins");
    }

    public static void queueFiles(Collection<Path> files) {
        pendingFiles.addAll(files);
    }

    public static void notifyPendingFiles() {
        if (pendingFiles.isEmpty()) return;
        WebviewWindow window = WebviewWindow.getWindow(WINDOW_ID);
        Webview webview = window == null ? null : window.getWebview();
        if (webview == null) return;
        webview.dispatch(() -> webview.eval("window.nexSkinEditorFilesAvailable && window.nexSkinEditorFilesAvailable();"));
    }

    private static Map<String, Object> takePendingFiles() {
        List<Map<String, Object>> files = new ArrayList<>();
        Path file;
        while ((file = pendingFiles.poll()) != null) {
            Map<String, Object> entry = new LinkedHashMap<>();
            entry.put("name", file.getFileName().toString());
            entry.put("path", file.toAbsolutePath().toString());
            try {
                if (!hasValidExtension(file.getFileName().toString())) throw new IOException("Only .png and .nexskin files are supported");
                if (Files.size(file) > MAX_FILE_SIZE) throw new IOException("The file is too large");
                entry.put("data", Base64.getEncoder().encodeToString(Files.readAllBytes(file)));
            } catch (Exception e) {
                entry.put("error", e.getMessage() == null ? "Unknown error" : e.getMessage());
            }
            files.add(entry);
        }
        Map<String, Object> result = result("ok");
        result.put("files", files);
        return result;
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

    private static Map<String, Object> listLibrary() {
        try {
            Path root = getSkinsDirectory();
            Files.createDirectories(root);
            List<Map<String, Object>> characters = new ArrayList<>();
            List<Map<String, Object>> loose = new ArrayList<>();
            try (Stream<Path> entries = Files.list(root)) {
                for (Path entry : entries.sorted(Comparator.comparing(path -> path.getFileName().toString().toLowerCase(Locale.ROOT))).toList()) {
                    if (Files.isDirectory(entry)) {
                        Map<String, Object> character = new LinkedHashMap<>();
                        character.put("name", entry.getFileName().toString());
                        character.put("path", entry.toAbsolutePath().toString());
                        character.put("outfits", listOutfits(entry));
                        characters.add(character);
                    } else if (isNexSkin(entry)) {
                        loose.add(outfitEntry(entry));
                    }
                }
            }
            Map<String, Object> result = result("ok");
            result.put("path", root.toAbsolutePath().toString());
            result.put("characters", characters);
            result.put("loose", loose);
            return result;
        } catch (Exception e) {
            System.err.println("[SkinLibrary] Failed to list skins: " + e.getMessage());
            return error(e.getMessage());
        }
    }

    private static List<Map<String, Object>> listOutfits(Path directory) throws IOException {
        List<Map<String, Object>> outfits = new ArrayList<>();
        try (Stream<Path> files = Files.list(directory)) {
            for (Path file : files.filter(SkinEditorBridge::isNexSkin).sorted(Comparator.comparing(path -> path.getFileName().toString().toLowerCase(Locale.ROOT))).toList()) {
                outfits.add(outfitEntry(file));
            }
        }
        return outfits;
    }

    private static Map<String, Object> outfitEntry(Path file) throws IOException {
        Map<String, Object> outfit = new LinkedHashMap<>();
        String name = file.getFileName().toString();
        outfit.put("name", name.substring(0, name.length() - ".nexskin".length()));
        outfit.put("path", file.toAbsolutePath().toString());
        outfit.put("modified", Files.getLastModifiedTime(file).toMillis());
        outfit.put("data", Files.size(file) <= MAX_FILE_SIZE ? Base64.getEncoder().encodeToString(Files.readAllBytes(file)) : null);
        return outfit;
    }

    private static boolean isNexSkin(Path file) {
        return Files.isRegularFile(file) && file.getFileName().toString().toLowerCase(Locale.ROOT).endsWith(".nexskin");
    }

    private static Map<String, Object> writeOutfit(String characterName, String outfitName, String data, boolean overwrite) {
        try {
            if (data == null) return error("No data");
            byte[] bytes = Base64.getDecoder().decode(data);
            if (bytes.length > MAX_FILE_SIZE) return error("The file is too large");
            Path directory = getSkinsDirectory().resolve(sanitizeName(characterName, "Skins"));
            Files.createDirectories(directory);
            Path target = directory.resolve(sanitizeName(outfitName, "Outfit") + ".nexskin");
            if (!overwrite) target = uniqueFile(target);
            Files.write(target, bytes);
            Map<String, Object> result = result("ok");
            result.put("name", target.getFileName().toString());
            result.put("path", target.toAbsolutePath().toString());
            return result;
        } catch (Exception e) {
            System.err.println("[SkinLibrary] Failed to write outfit: " + e.getMessage());
            return error(e.getMessage());
        }
    }

    private static Map<String, Object> createCharacter(String name) {
        try {
            Path directory = uniqueFile(getSkinsDirectory().resolve(sanitizeName(name, "Skins")));
            Files.createDirectories(directory);
            Map<String, Object> result = result("ok");
            result.put("name", directory.getFileName().toString());
            result.put("path", directory.toAbsolutePath().toString());
            return result;
        } catch (Exception e) {
            System.err.println("[SkinLibrary] Failed to create character: " + e.getMessage());
            return error(e.getMessage());
        }
    }

    private static Map<String, Object> renameEntry(String path, String name) {
        try {
            Path source = libraryPath(path);
            if (source == null || !Files.exists(source)) return error("Unknown skin");
            boolean directory = Files.isDirectory(source);
            String fileName = sanitizeName(name, directory ? "Skins" : "Outfit") + (directory ? "" : ".nexskin");
            Path target = source.resolveSibling(fileName);
            if (!target.equals(source)) {
                if (Files.exists(target) && !target.toString().equalsIgnoreCase(source.toString())) target = uniqueFile(target);
                Files.move(source, target);
            }
            Map<String, Object> result = result("ok");
            result.put("name", target.getFileName().toString());
            result.put("path", target.toAbsolutePath().toString());
            return result;
        } catch (Exception e) {
            System.err.println("[SkinLibrary] Failed to rename: " + e.getMessage());
            return error(e.getMessage());
        }
    }

    private static Map<String, Object> deleteEntry(String path) {
        try {
            Path target = libraryPath(path);
            if (target == null || !Files.exists(target)) return error("Unknown skin");
            if (Files.isDirectory(target)) {
                try (Stream<Path> walk = Files.walk(target)) {
                    for (Path entry : walk.sorted(Comparator.reverseOrder()).toList()) Files.delete(entry);
                }
            } else {
                Files.delete(target);
            }
            return result("ok");
        } catch (Exception e) {
            System.err.println("[SkinLibrary] Failed to delete: " + e.getMessage());
            return error(e.getMessage());
        }
    }

    private static Path libraryPath(String path) {
        if (path == null || path.isBlank()) return null;
        try {
            Path root = getSkinsDirectory().toAbsolutePath().normalize();
            Path target = Path.of(path).toAbsolutePath().normalize();
            return target.startsWith(root) && !target.equals(root) ? target : null;
        } catch (Exception e) {
            return null;
        }
    }

    private static Map<String, Object> fetchPlayerSkin(String uuid) {
        try {
            if (uuid == null || !uuid.replace("-", "").matches("[0-9a-fA-F]{32}")) return error("Invalid UUID");
            Map<?, ?> profile = ApiController.getObjectMapper().readValue(new String(download(SESSION_SERVER + uuid.replace("-", "")), StandardCharsets.UTF_8), Map.class);
            String encoded = null;
            if (profile.get("properties") instanceof List<?> properties) {
                for (Object property : properties) {
                    if (property instanceof Map<?, ?> map && "textures".equals(map.get("name"))) encoded = String.valueOf(map.get("value"));
                }
            }
            if (encoded == null) return error("No skin found");
            Map<?, ?> textures = ApiController.getObjectMapper().readValue(new String(Base64.getDecoder().decode(encoded), StandardCharsets.UTF_8), Map.class);
            Map<?, ?> entries = textures.get("textures") instanceof Map<?, ?> map ? map : Map.of();
            Map<String, Object> result = result("ok");
            result.put("name", profile.get("name"));
            if (entries.get("SKIN") instanceof Map<?, ?> skin && skin.get("url") instanceof String url) {
                boolean slim = skin.get("metadata") instanceof Map<?, ?> metadata && "slim".equals(metadata.get("model"));
                result.put("url", url);
                result.put("model", slim ? "slim" : "classic");
                result.put("data", Base64.getEncoder().encodeToString(download(url)));
            }
            if (entries.get("CAPE") instanceof Map<?, ?> cape && cape.get("url") instanceof String url) {
                result.put("cape", Base64.getEncoder().encodeToString(download(url)));
            }
            return result;
        } catch (Exception e) {
            System.err.println("[SkinLibrary] Failed to load player skin: " + e.getMessage());
            return error(e.getMessage());
        }
    }

    private static Map<String, Object> fetchPlayerCapes(String uuid, String accessToken) {
        try {
            List<Map<String, Object>> capes = new ArrayList<>();
            if (accessToken != null && !accessToken.isBlank()) {
                HttpResponse<String> response = HTTP.send(HttpRequest.newBuilder(URI.create(PROFILE_SERVICE)).timeout(Duration.ofSeconds(15)).header("Authorization", "Bearer " + accessToken).header("User-Agent", "NEX App").GET().build(), HttpResponse.BodyHandlers.ofString());
                if (response.statusCode() != 200) return error("HTTP " + response.statusCode());
                Map<?, ?> profile = ApiController.getObjectMapper().readValue(response.body(), Map.class);
                if (profile.get("capes") instanceof List<?> owned) {
                    for (Object entry : owned) {
                        if (!(entry instanceof Map<?, ?> cape) || !(cape.get("url") instanceof String url)) continue;
                        capes.add(capeEntry(String.valueOf(cape.get("id")), cape.get("alias") instanceof String alias ? alias : null, url, "ACTIVE".equals(cape.get("state"))));
                    }
                }
            } else {
                if (uuid == null || !uuid.replace("-", "").matches("[0-9a-fA-F]{32}")) return error("Invalid UUID");
                Map<?, ?> profile = ApiController.getObjectMapper().readValue(new String(download(SESSION_SERVER + uuid.replace("-", "")), StandardCharsets.UTF_8), Map.class);
                if (profile.get("properties") instanceof List<?> properties) {
                    for (Object property : properties) {
                        if (!(property instanceof Map<?, ?> map) || !"textures".equals(map.get("name"))) continue;
                        Map<?, ?> textures = ApiController.getObjectMapper().readValue(new String(Base64.getDecoder().decode(String.valueOf(map.get("value"))), StandardCharsets.UTF_8), Map.class);
                        if (textures.get("textures") instanceof Map<?, ?> entries && entries.get("CAPE") instanceof Map<?, ?> cape && cape.get("url") instanceof String url) {
                            capes.add(capeEntry(url, null, url, true));
                        }
                    }
                }
            }
            Map<String, Object> result = result("ok");
            result.put("capes", capes);
            result.put("complete", accessToken != null && !accessToken.isBlank());
            return result;
        } catch (Exception e) {
            System.err.println("[SkinLibrary] Failed to load capes: " + e.getMessage());
            return error(e.getMessage());
        }
    }

    private static Map<String, Object> capeEntry(String id, String alias, String url, boolean active) throws IOException, InterruptedException {
        Map<String, Object> cape = new LinkedHashMap<>();
        cape.put("id", id);
        cape.put("alias", alias);
        cape.put("url", url);
        cape.put("active", active);
        cape.put("data", Base64.getEncoder().encodeToString(download(url)));
        return cape;
    }

    private static byte[] download(String url) throws IOException, InterruptedException {
        URI uri = URI.create(url.startsWith("http://textures.minecraft.net") ? "https" + url.substring(4) : url);
        HttpResponse<byte[]> response = HTTP.send(HttpRequest.newBuilder(uri).timeout(Duration.ofSeconds(15)).header("User-Agent", "NEX App").GET().build(), HttpResponse.BodyHandlers.ofByteArray());
        if (response.statusCode() != 200) throw new IOException("HTTP " + response.statusCode() + " for " + uri);
        if (response.body().length > MAX_FILE_SIZE) throw new IOException("The file is too large");
        return response.body();
    }

    private static String sanitizeName(String name, String fallback) {
        String clean = name == null ? "" : name.replaceAll("[\\\\/:*?\"<>|]+", "_").replaceAll("^[.\\s]+|[.\\s]+$", "").trim();
        return clean.isBlank() ? fallback : clean;
    }

    private static void openSkinsDirectory() {
        try {
            Path directory = getSkinsDirectory();
            Files.createDirectories(directory);
            openDirectory(directory);
        } catch (IOException e) {
            System.err.println("[SkinEditor] Failed to open skins folder: " + e.getMessage());
        }
    }

    private static void openDirectory(Path directory) {
        try {
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
