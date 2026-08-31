package com.zyneonstudios.apex.nexapp.window;

import com.zyneonstudios.apex.nexapp.Main;
import io.avaje.webview.Webview;
import java.awt.*;
import java.io.IOException;

public class ApplicationWindowLauncher {

    private Webview webview = null;

    private String title;
    private String url;
    private int width;
    private int height;

    public ApplicationWindowLauncher() {
        title = "NEX App";
        width = 1280;
        height = 720;
    }


    @SuppressWarnings("all")
    public void launchWindow() {
        url = Main.getBaseUrl();
        try {
            launchNativeWebView();
        } catch (Exception e) {
            System.err.println("Failed to launch native WebView: " + e.getMessage());
            e.printStackTrace();
            System.exit(-1);
        }
    }

    public void launchNativeWebView() {
        Thread.ofPlatform().start(() -> {
            try {
                this.webview = Webview.builder()
                        .title(title + " (WebView)")
                        .width(width)
                        .height(height)
                        .enableDeveloperTools(true)
                        .navigate(url)
                        .borderless(true, true)
                        .build();

                this.webview.bind("startWindowDrag", (_) -> {
                    this.webview.startWindowDrag();
                    return null;
                });

                this.webview.bind("closeWindow", (_) -> {
                    System.exit(0);
                    return null;
                });

                this.webview.bind("minimizeWindow", (_) -> {
                    this.webview.minimizeWindow();
                    return null;
                });

                this.webview.bind("maximizeWindow", (_) -> {
                    if(this.webview.isMaximized()) {
                        this.webview.unmaximizeWindow();
                    } else {
                        this.webview.maximizeWindow();
                    }
                    return null;
                });

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

                this.webview.run();
                System.exit(0);
            } catch (Throwable e) {
                throw new RuntimeException("Failed to launch native WebView", e);
            }
        });
    }

    public void setTitle(String title) {
        this.title = title;
        if(webview != null) {
            webview.setTitle(title+" (WebView)");
        }
    }

    public String getTitle() {
        return title;
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
}