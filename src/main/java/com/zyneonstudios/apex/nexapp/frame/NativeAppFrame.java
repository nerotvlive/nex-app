package com.zyneonstudios.apex.nexapp.frame;

import com.zyneonstudios.apex.nexapp.Main;
import com.zyneonstudios.apex.nexapp.listeners.AsyncConnectorListener;
import com.zyneonstudios.apex.nexapp.main.NEXApplication;
import io.avaje.webview.Webview;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.concurrent.CompletableFuture;

public class NativeAppFrame implements AppFrame {

    private final AsyncConnectorListener connectorListener;
    private Webview webview;
    private String url;

    public NativeAppFrame(String url) throws Exception {
        try {
            this.url = url;
            Thread.ofPlatform().start(() -> {
                try {
                    this.webview = Webview.builder()
                            .title("NEX App")
                            .minSize(1024, 576)
                            .width(1280)
                            .height(720)
                            .enableDeveloperTools(Main.getLogger().isDebugging())
                            .navigate(url)
                            .borderless(true,true)
                            .transparent(true)
                            .build();

                    initWindowControls();
                    initBindings();
                    initIcon();

                    this.webview.run();

                    NEXApplication.stop(0);
                } catch (Throwable e) {
                    throw new RuntimeException("Failed to build or launch native webview", e);
                }
            });
        } catch (Exception e) {
            throw new Exception("Could not open native webview frame: "+ e);
        }
        connectorListener = new AsyncConnectorListener();
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
        } catch (IOException e) {
            if(System.getProperty("os.name").toLowerCase().contains("windows")) {
                System.err.println("Failed to load icon: " + e.getMessage());
            }
        }
    }

    private void initWindowControls() {
        this.webview.bind("resolve", (s) -> {
            CompletableFuture.runAsync(()->{
                String r = s.replace("[\"","").replace("\"]","");
                connectorListener.resolveMessage(r);
            });
            return null;
        });

        this.webview.bind("startWindowDrag", (s) -> {
            this.webview.startWindowDrag();
            return null;
        });

        this.webview.bind("closeWindow", (s) -> {
            close();
            return null;
        });

        this.webview.bind("minimizeWindow", (s) -> {
            minimize();
            return null;
        });

        this.webview.bind("unminimizeWindow", (s) -> {
            unminimize();
            return null;
        });

        this.webview.bind("toggleMinimizeWindow", (s) -> {
            if(isMinimized()) {
                setVisible(true);
            } else {
                minimize();
            }
            return null;
        });

        this.webview.bind("maximizeWindow", (s) -> {
            maximize();
            return null;
        });

        this.webview.bind("unmaximizeWindow", (s) -> {
            unmaximize();
            return null;
        });

        this.webview.bind("toggleMaximizeWindow", (s) -> {
            if(isMaximized()) {
                unmaximize();
            } else {
                maximize();
            }
            return null;
        });

        this.webview.bind("hideWindow", (s) -> {
            hide();
            return null;
        });

        this.webview.bind("showWindow", (s) -> {
            setVisible(true);
            return null;
        });

        this.webview.bind("toggleHideWindow", (s) -> {
            if(isHidden()) {
                setVisible(true);
            } else {
                hide();
            }
            return null;
        });

        this.webview.bind("reloadWindow", (s) -> {
            reload();
            return null;
        });
    }

    private void initBindings() {
        webview.bind("getUrl", href -> {
            href = href.replace("[\"","").replace("\"]","");
            this.url = href;
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
                        System.err.println("[openUrl] Error: " + e.getMessage());
                    }
                });
            }
            return null;
        });
    }

    @Override
    public String getURL() {
        return url;
    }

    @Override
    public boolean isVisible() {
        return !isMinimized() && !isHidden();
    }

    @Override
    public boolean isMinimized() {
        return webview.isMinimized();
    }

    @Override
    public boolean isMaximized() {
        return webview.isMaximized();
    }

    @Override
    public boolean isHidden() {
        return webview.isHidden();
    }

    @Override
    public void rescale() {
        //no
    }

    @Override
    public void loadURL(String url) {
        this.url = url;
        webview.navigate(this.url);
    }

    @Override
    public void setVisible(boolean visible) {
        if(visible) {
            show();
            unminimize();
        } else {
            hide();
        }
    }

    @Override
    public void executeJavaScript(String... scripts) {
        for(String script : scripts) {
            webview.eval(script);
        }
    }

    @Override
    public void reload() {
        webview.navigate(this.url);
    }

    @Override
    public void minimize() {
        webview.minimizeWindow();
    }

    @Override
    public void unminimize() {
        webview.unminimizeWindow();
    }

    @Override
    public void maximize() {
        webview.maximizeWindow();
    }

    @Override
    public void unmaximize() {
        webview.unmaximizeWindow();
    }

    @Override
    public void hide() {
        webview.hideWindow();
    }

    @Override
    public void show() {
        webview.showWindow();
    }

    @Override
    public void close() {
        webview.close();
    }
}