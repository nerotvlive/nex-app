package com.zyneonstudios.apex.nexapp.window;

import io.avaje.webview.Webview;
import javafx.application.Platform;
import javafx.embed.swing.JFXPanel;
import javafx.scene.Scene;
import javafx.scene.web.WebView;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;

import javax.swing.*;
import java.awt.*;

@Component
public class ApplicationWindowLauncher {

    private Webview webview = null;
    private JFrame jFrame = null;
    private WebView fxWebView = null;

    private String title;
    private String url;
    private int width;
    private int height;

    public ApplicationWindowLauncher() {
        title = "NEX App";
        width = 1280;
        height = 720;
        url = "http://localhost:8274";
    }

    @EventListener(ApplicationReadyEvent.class)
    public void launchWindow() {
        try {
            launchNativeWebView();
        } catch (Exception e) {
            launchFallbackWebView();
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
                        .build();

                jFrame = null;
                fxWebView = null;

                this.webview.run();
                System.exit(0);
            } catch (Throwable e) {
                this.launchFallbackWebView();
            }
        });
    }

    public void launchFallbackWebView() {
        webview = null;
        SwingUtilities.invokeLater(() -> {
            JFrame frame = new JFrame(title+ " (Swing/JavaFX)");
            frame.setBackground(Color.BLACK);
            frame.getContentPane().setBackground(Color.BLACK);
            JFXPanel fxPanel = new JFXPanel();
            fxPanel.setBackground(Color.BLACK);
            frame.add(fxPanel, BorderLayout.CENTER);
            frame.setSize(width, height);
            frame.setLocationRelativeTo(null);
            frame.setDefaultCloseOperation(JFrame.EXIT_ON_CLOSE);
            frame.setVisible(true);
            Platform.runLater(() -> {
                fxWebView = new WebView();
                fxWebView.getEngine().load(url);
                Scene scene = new Scene(fxWebView);
                fxPanel.setScene(scene);
            });
        });
    }

    public void setTitle(String title) {
        this.title = title;
        if(jFrame != null) {
            jFrame.setTitle(title+" (Swing/JavaFX)");
        }
        if(webview != null) {
            webview.setTitle(title+" (WebView)");
        }
    }

    public String getTitle() {
        return title;
    }

    public void setUrl(String url) {
        this.url = url;
        if(fxWebView != null) {
            fxWebView.getEngine().load(url);
        }
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
        if (jFrame != null) {
            jFrame.setSize(width, height);
        }
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