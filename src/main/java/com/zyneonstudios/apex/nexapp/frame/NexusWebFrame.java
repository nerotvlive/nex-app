//
// Source code recreated from a .class file by IntelliJ IDEA
// (powered by Fernflower decompiler)
//

package com.zyneonstudios.apex.nexapp.frame;

import com.zyneonstudios.nexus.desktop.NexusDesktop;
import com.zyneonstudios.nexus.desktop.events.AsyncWebFrameConnectorEvent;
import com.zyneonstudios.nexus.desktop.events.WebFrameConnectorEvent;
import com.zyneonstudios.nexus.desktop.frame.nexus.NexusFrame;
import com.zyneonstudios.nexus.desktop.frame.web.WebFrame;
import java.awt.KeyboardFocusManager;
import org.cef.CefClient;
import org.cef.CefSettings;
import org.cef.browser.CefBrowser;
import org.cef.handler.CefDisplayHandlerAdapter;
import org.cef.handler.CefFocusHandlerAdapter;

public class NexusWebFrame extends NexusFrame implements WebFrame {
    private final CefBrowser browser;
    private boolean browserFocus;
    private AsyncWebFrameConnectorEvent asyncWebFrameConnectorEvent;
    private WebFrameConnectorEvent webFrameConnectorEvent;

    public NexusWebFrame(CefClient webClient, String url, boolean titlebar, boolean systemStyle) {
        super(systemStyle);
        this.setTitle("New NEXUS Web Frame");
        this.browser = webClient.createBrowser(url, false, false);
        webClient.addFocusHandler(new CefFocusHandlerAdapter() {
            public void onTakeFocus(CefBrowser browser, boolean next) {
                NexusWebFrame.this.browserFocus = false;
            }

            public void onGotFocus(CefBrowser browser) {
                if (!NexusWebFrame.this.browserFocus) {
                    NexusWebFrame.this.browserFocus = true;
                    KeyboardFocusManager.getCurrentKeyboardFocusManager().clearGlobalFocusOwner();
                    browser.setFocus(true);
                }
            }
        });
        webClient.addDisplayHandler(new CefDisplayHandlerAdapter() {
            public boolean onConsoleMessage(CefBrowser browser, CefSettings.LogSeverity level, String message, String source, int line) {
                if (message.startsWith("[CONNECTOR] async.")) {
                    String request = message.replace("[CONNECTOR] async.", "");
                    if (NexusWebFrame.this.asyncWebFrameConnectorEvent != null) {
                        NexusWebFrame.this.asyncWebFrameConnectorEvent.setMessage(request);
                        NexusWebFrame.this.asyncWebFrameConnectorEvent.execute();
                    } else if (NexusWebFrame.this.webFrameConnectorEvent != null) {
                        NexusWebFrame.this.webFrameConnectorEvent.setMessage(request);
                        NexusWebFrame.this.webFrameConnectorEvent.execute();
                    }
                } else if (message.startsWith("[CONNECTOR] ")) {
                    String request = message.replace("[CONNECTOR] ", "");
                    if (NexusWebFrame.this.webFrameConnectorEvent != null) {
                        NexusWebFrame.this.webFrameConnectorEvent.setMessage(request);
                        NexusWebFrame.this.webFrameConnectorEvent.execute();
                    } else if (NexusWebFrame.this.asyncWebFrameConnectorEvent != null) {
                        NexusWebFrame.this.asyncWebFrameConnectorEvent.setMessage(request);
                        NexusWebFrame.this.asyncWebFrameConnectorEvent.execute();
                    }
                } else if (message.startsWith("[LOG] ")) {
                    NexusDesktop.getLogger().log(message.replace("[LOG] ", "[FRAME] "));
                } else if (message.startsWith("[ERR] ")) {
                    NexusDesktop.getLogger().err(message.replace("[ERR] ", "[FRAME] "));
                } else if (message.startsWith("[DEB] ")) {
                    NexusDesktop.getLogger().dbg(message.replace("[DEB] ", "[FRAME] "));
                } else {
                    NexusDesktop.getLogger().dbg("[FRAME] (Console) " + message);
                }

                return super.onConsoleMessage(browser, level, message, source, line);
            }
        });
        this.getContentPane().add(this.browser.getUIComponent(), "Center");
        if (!titlebar) {
            this.setUndecorated(true);
        }

    }

    public AsyncWebFrameConnectorEvent getAsyncWebFrameConnectorEvent() {
        return this.asyncWebFrameConnectorEvent;
    }

    public WebFrameConnectorEvent getWebFrameConnectorEvent() {
        return this.webFrameConnectorEvent;
    }

    public void setAsyncWebFrameConnectorEvent(AsyncWebFrameConnectorEvent asyncWebFrameConnectorEvent) {
        this.asyncWebFrameConnectorEvent = asyncWebFrameConnectorEvent;
    }

    public void setWebFrameConnectorEvent(WebFrameConnectorEvent webFrameConnectorEvent) {
        this.webFrameConnectorEvent = webFrameConnectorEvent;
    }

    public CefBrowser getBrowser() {
        return this.browser;
    }

    public boolean isBrowserFocussed() {
        return this.browserFocus;
    }

    public void executeJavaScript(String... scripts) {
        for(String script : scripts) {
            this.browser.executeJavaScript(script, this.browser.getURL(), 0);
        }

    }
}
