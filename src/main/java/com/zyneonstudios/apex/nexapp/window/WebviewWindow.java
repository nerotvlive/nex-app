package com.zyneonstudios.apex.nexapp.window;

import com.zyneonstudios.apex.nexapp.Main;
import io.avaje.webview.Webview;

import java.awt.*;
import java.io.IOException;

public class WebviewWindow {

    private Webview webview = null;

    private String url;
    private int width;
    private int height;

    public WebviewWindow() {
        width = 1280;
        height = 720;
    }

    @SuppressWarnings("all")
    public void launchWindow() {
        url = Main.getBaseUrl();
        try {
            Thread.ofPlatform().start(() -> {
                try {
                    this.webview = Webview.builder()
                            .title("NEX App")
                            .minSize(800, 480)
                            .width(width)
                            .height(height)
                            .enableDeveloperTools(true)
                            .navigate(url)
                            .borderless(true, true)
                            .build();

                    initWindowControls();
                    initBindings();
                    this.webview.run();
                    System.exit(0);
                } catch (Throwable e) {
                    throw new RuntimeException("Failed to launch native WebView", e);
                }
            });
        } catch (Exception e) {
            throw new RuntimeException("Failed to launch native WebView", e);
        }
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
                        System.err.println("[openUrl] Fehler: " + e.getMessage());
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

    public void minimize() {
        webview.minimizeWindow();
    }

    public Webview getWebview() {
        return webview;
    }
}