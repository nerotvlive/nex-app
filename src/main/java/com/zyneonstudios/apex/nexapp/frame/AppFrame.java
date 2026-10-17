package com.zyneonstudios.apex.nexapp.frame;

public interface AppFrame {

    String getURL();
    boolean isVisible();

    boolean isMinimized();
    boolean isMaximized();
    boolean isHidden();

    void rescale();
    void loadURL(String url);
    void setVisible(boolean visible);
    void executeJavaScript(String... scripts);
    void reload();

    void minimize();
    void unminimize();

    void maximize();
    void unmaximize();

    void hide();
    void show();
    void close();
}
