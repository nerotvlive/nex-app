package com.zyneonstudios.apex.nexapp.window;

import com.zyneonstudios.apex.nexapp.Main;
import io.avaje.webview.Webview;

import java.awt.*;
import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.HashMap;

public class WebviewWindow {

    private static HashMap<String,WebviewWindow> windows = new HashMap<>();
    private Webview webview = null;

    private final String id;
    private String url = Main.getBaseUrl();
    private int width;
    private int height;
    private boolean isToolWindow = false;

    public WebviewWindow() {
        this("main");
    }

    public WebviewWindow(String id) {
        this.width = 1280;
        this.height = 720;
        this.id = id;
        if(!this.id.equals("main")) {
            this.isToolWindow = true;
        }
        windows.put(this.id, this);
    }

    @SuppressWarnings("all")
    public void launchWindow() {
        System.out.println("Launching webview window with URL: " + url);
        try {
            Thread.ofPlatform().start(() -> {
                try {
                    this.webview = Webview.builder()
                            .title("nex-app")
                            .minSize(800, 480)
                            .width(width)
                            .height(height)
                            .enableDeveloperTools(true)
                            .navigate(url)
                            .borderless(true, true)
                            .build();

                    initWindowControls();
                    initBindings();
                    initIcon();
                    this.webview.run();

                    if (!isToolWindow) {
                        System.exit(0);
                    } else {
                        windows.remove(this.id);
                    }
                } catch (Throwable e) {
                    throw new RuntimeException("Failed to launch native WebView", e);
                }
            });
        } catch (Exception e) {
            throw new RuntimeException("Failed to launch native WebView", e);
        }
    }

    private void initIcon() {
        try {
            var iconStream = getClass().getResourceAsStream("/icon.ico");
            if (iconStream != null) {
                Path tempIcon = Files.createTempFile("icon", ".ico");
                tempIcon.toFile().deleteOnExit();
                try (iconStream) {
                    Files.copy(iconStream, tempIcon, java.nio.file.StandardCopyOption.REPLACE_EXISTING);
                }
                this.webview.setIcon(tempIcon);
            }
        } catch (IOException e) {e.printStackTrace();}
    }

    private void initWindowControls() {
        this.webview.bind("startWindowDrag", (_) -> {
            this.webview.startWindowDrag();
            return null;
        });

        this.webview.bind("closeWindow", (_) -> {
            this.webview.close();
            return null;
        });

        this.webview.bind("minimizeWindow", (_) -> {
            minimize();
            return null;
        });

        this.webview.bind("maximizeWindow", (_) -> {
            maximize();
            return null;
        });

        this.webview.bind("unmaximizeWindow", (_) -> {
            unmaximize();
            return null;
        });

        this.webview.bind("toggleMaximizeWindow", (_) -> {
            toggleMaximize();
            return null;
        });
    }

    private void initBindings() {
        if (!isToolWindow) {
            this.webview.bind("openTool", (tool) -> {
                tool = tool.replace("[\"","").replace("\"]","");
                if(!windows.containsKey(tool)) {
                    WebviewWindow toolWindow = new WebviewWindow(tool);
                    toolWindow.setUrl(Main.getBaseUrl() + "?" + tool + "=true");
                    toolWindow.launchWindow();
                } else {
                    WebviewWindow toolWindow = windows.get(tool);
                    toolWindow.unminimize();
                }
                return null;
            });
        }

        this.webview.bind("openUrl", (args) -> {
            if (args != null && !args.isBlank()) {
                String cleanUrl = args.replaceAll("[\\[\\]\"]", "").trim();
                Thread.ofPlatform().start(() -> {
                    try {
                        String os = System.getProperty("os.name").toLowerCase();
                        if (os.contains("win")) {
                            new ProcessBuilder("rundll32", "url.dll,FileProtocolHandler", cleanUrl).start();
                        } else if (os.contains("mac")) {
                            new ProcessBuilder("open", cleanUrl).start();
                        } else {
                            new ProcessBuilder("xdg-open", cleanUrl).start();
                        }
                    } catch (IOException e) {
                        System.err.println("[openUrl] Error: " + e.getMessage());
                    }
                });
            }
            return null;
        });
    }

    public void setUrl(String url) {
        this.url = url;
        if(webview != null) {
            webview.navigate(url);
        }
    }

    public String getUrl() {
        return url;
    }

    public void setSize(Dimension dimension) {
        setSize(dimension.width, dimension.height);
    }

    public void setSize(int width, int height) {
        this.width = width;
        this.height = height;
        if(webview != null) {
            webview.setSize(width,height);
        }
    }

    public void setWidth(int width) {
        setSize(width,this.height);
    }

    public void setHeight(int height) {
        setSize(width,height);
    }

    public Dimension getSize() {
        return new Dimension(width, height);
    }

    public int getWidth() {
        return width;
    }

    public int getHeight() {
        return height;
    }

    public void maximize() {
        webview.maximizeWindow();
    }

    public void unmaximize() {
        webview.unmaximizeWindow();
    }

    public boolean isMaximized() {
        return webview.isMaximized();
    }

    public void toggleMaximize() {
        if(isMaximized()) {
            unmaximize();
        } else {
            maximize();
        }
    }

    private boolean minimized = false;
    public void minimize() {
        minimized = true;
        webview.minimizeWindow();
    }

    public void unminimize() throws InterruptedException {
        if (isMaximized()) {
            webview.unmaximizeWindow();
        } else {
            webview.maximizeWindow();
        }
        Thread.sleep(1);
        toggleMaximize();
        minimized = false;
    }

    public boolean isMinimized() {
        return minimized;
    }

    public Webview getWebview() {
        return webview;
    }
}