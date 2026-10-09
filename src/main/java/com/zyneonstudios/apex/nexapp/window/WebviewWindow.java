package com.zyneonstudios.apex.nexapp.window;

import com.zyneonstudios.apex.nexapp.Main;
import io.avaje.webview.Webview;

import java.awt.*;
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
    private final boolean isBorderless =  !Main.useNativeFrame();

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
        if(!url.toLowerCase().contains("borderless="+isBorderless)) {
            if (url.contains("?")) {
                this.url = url + "&borderless="+isBorderless;
            } else {
                this.url = url + "?borderless="+isBorderless;
            }
        }
        System.out.println("Setting URL to: " + this.url);
        windows.put(this.id, this);
    }

    @SuppressWarnings("all")
    public void launchWindow() {
        try {
            Thread.ofPlatform().start(() -> {
                try {
                    this.webview = Webview.builder()
                            .title("NEX App")
                            .minSize(1024, 576)
                            .width(width)
                            .height(height)
                            .enableDeveloperTools(Main.isDev())
                            .navigate(url)
                            .borderless(isBorderless, isBorderless)
                            .build();

                    initWindowControls();
                    initBindings();
                    initIcon();
                    this.webview.run();
                    windows.remove(this.id);
                    if(windows.isEmpty()) {
                        System.exit(0);
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
            if(Main.useNativeFrame()) {
                return null;
            }
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

        this.webview.bind("unminimizeWindow", (_) -> {
            unminimize();
            return null;
        });

        this.webview.bind("toggleMinimizeWindow", (_) -> {
            toggleMinimize();
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
                    toolWindow.webview.showWindow();
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
        if(!url.toLowerCase().contains("borderless="+isBorderless)) {
            if (url.contains("?")) {
                this.url = url + "&borderless="+isBorderless;
            } else {
                this.url = url + "?borderless="+isBorderless;
            }
        }
        System.out.println("Setting URL to: " + this.url);
        if(webview != null) {
            webview.navigate(this.url);
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

    public void minimize() {
        webview.minimizeWindow();
    }

    public void unminimize() {
        webview.unminimizeWindow();
    }

    public boolean isMinimized() {
        return webview.isMinimized();
    }

    public void toggleMinimize() {
        if(isMinimized()) {
            unminimize();
        } else {
            minimize();
        }
    }

    public Webview getWebview() {
        return webview;
    }
}