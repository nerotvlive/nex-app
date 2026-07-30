package com.zyneonstudios.apex.nexapp.utilities;

import com.google.gson.JsonArray;
import com.starxg.keytar.Keytar;
import com.zyneonstudios.apex.nexapp.Main;
import com.zyneonstudios.apex.nexapp.main.NEXApplication;
import fr.theshark34.openlauncherlib.minecraft.AuthInfos;
import live.nerotv.zyneon.auth.ZyneonAuth;

import java.util.*;

public class MicrosoftAuthenticator {

    private static AuthInfos authInfos = null;
    private static ArrayList<String> authenticatedUUIDs;

    public static void startLogin(boolean save) {
        showOverlay(false);

        try {
            setAuthInfos(ZyneonAuth.getAuthInfos(), save);
        } catch (Exception exception) {
            NEXApplication.getLogger().printErr("NEX","AUTHENTICATION","Couldn't fetch the Microsoft token.",exception.getMessage(), exception.getStackTrace());
        }

        refreshBrowser();
    }

    public static void refresh(String token, boolean save) {
        showOverlay(true);

        try {
            setAuthInfos(ZyneonAuth.getAuthInfos(token), save);
        } catch (Exception exception) {
            NEXApplication.getLogger().printErr("NEX","AUTHENTICATION","Couldn't refresh the Microsoft token.",exception.getMessage(), exception.getStackTrace());
        }

        refreshBrowser();
    }

    private static void setAuthInfos(HashMap<ZyneonAuth.AuthInfo, String> authData, boolean save) {
        authInfos = new AuthInfos(authData.get(ZyneonAuth.AuthInfo.USERNAME), authData.get(ZyneonAuth.AuthInfo.ACCESS_TOKEN), authData.get(ZyneonAuth.AuthInfo.UUID));
        NEXApplication.setAuthInfos(authInfos);
        if(save) {
            save(authData);
        }
    }

    private static void save(HashMap<ZyneonAuth.AuthInfo, String> authData) {
        try {
            String UUID = Base64.getEncoder().encodeToString(authData.get(ZyneonAuth.AuthInfo.UUID).getBytes());
            String token = Base64.getEncoder().encodeToString(authData.get(ZyneonAuth.AuthInfo.REFRESH_TOKEN).getBytes());
            Keytar.getInstance().setPassword("ZNA||00||00","0",UUID);
            Keytar.getInstance().setPassword("ZNA||01||00",UUID+"_0",token);
            NEXApplication.getInstance().getData().ensure("data.authentication.uuids",new JsonArray());
            if(!authenticatedUUIDs.contains(UUID)) {
                authenticatedUUIDs.add(UUID);
            }
            NEXApplication.getInstance().getData().set("data.authentication.uuids",authenticatedUUIDs);
            NEXApplication.getInstance().getData().set("data.authentication.names."+UUID,Base64.getEncoder().encodeToString(getUsername().getBytes()));
        } catch (Exception e) {
            NEXApplication.getLogger().printErr("NEX","AUTHENTICATION","Couldn't save credentials.",e.getMessage(), e.getStackTrace());
        }
    }

    public static void logout() {
        showOverlay(true);
        logout(authInfos.getUuid());
    }

    public static void logout(String decryptedUUID) {
        showOverlay(true);
        try {
            String encryptedUUID = Base64.getEncoder().encodeToString(decryptedUUID.getBytes());
            Keytar.getInstance().deletePassword("ZNA||00||00","0");
            Keytar.getInstance().deletePassword("ZNA||01||00",encryptedUUID+"_0");
            NEXApplication.getInstance().getData().ensure("data.authentication.uuids",new JsonArray());
            if(authenticatedUUIDs.contains(encryptedUUID)) {
                authenticatedUUIDs.remove(encryptedUUID);
                NEXApplication.getInstance().getData().set("data.authentication.uuids",authenticatedUUIDs);
            }
            NEXApplication.getInstance().getData().delete("data.authentication.names."+encryptedUUID);
        } catch (Exception e) {
            NEXApplication.getLogger().printErr("NEX","AUTHENTICATION","Couldn't delete credentials.",e.getMessage(), e.getStackTrace());
        }

        if(Objects.equals(getUUID(), decryptedUUID)) {
            authInfos = null;
            NEXApplication.setAuthInfos(null);
        }

        refreshBrowser();

        if(authInfos == null) {
            if (!authenticatedUUIDs.isEmpty()) {
                try {
                    refresh(new String(Base64.getDecoder().decode(Keytar.getInstance().getPassword("ZNA||01||00", authenticatedUUIDs.getFirst() + "_0"))), true);
                } catch (Exception e) {
                    NEXApplication.getLogger().printErr("NEX", "AUTHENTICATION", "Couldn't refresh the Microsoft token.", e.getMessage(), e.getStackTrace());
                }
            }
        }
    }

    public static String getUUID() {
        if(authInfos!=null) {
            return authInfos.getUuid();
        }
        return null;
    }

    public static String getUsername() {
        if(authInfos!=null) {
            return authInfos.getUsername();
        }
        return null;
    }

    public static boolean isLoggedIn() {
        return authInfos != null;
    }

    public static void init() {
        NEXApplication.getInstance().getData().ensure("data.authentication.uuids",new JsonArray());
        authenticatedUUIDs = (ArrayList<String>) NEXApplication.getInstance().getData().get("data.authentication.uuids");
    }

    public static List<String> getAuthenticatedUUIDs() {
        return List.copyOf(authenticatedUUIDs);
    }

    public static String getAuthenticatedUsername(String UUID) {
        if(authenticatedUUIDs.contains(UUID)) {
            return NEXApplication.getInstance().getData().getString("data.authentication.names."+UUID);
        }
        return null;
    }

    public static List<String> getDecryptedAuthenticatedUUIDs() {
        ArrayList<String> decryptedUUIDs = new ArrayList<>();
        for(String s:authenticatedUUIDs) {
            decryptedUUIDs.add(new String(Base64.getDecoder().decode(s)));
        }
        return decryptedUUIDs;
    }

    public static String getDecryptedAuthenticatedUsername(String UUID) {
        String name = null;
        if(authenticatedUUIDs.contains(UUID)) {
            name = NEXApplication.getInstance().getData().getString("data.authentication.names."+UUID);
        } else if(authenticatedUUIDs.contains(Base64.getEncoder().encodeToString(UUID.getBytes()))) {
            UUID = Base64.getEncoder().encodeToString(UUID.getBytes());
            name = NEXApplication.getInstance().getData().getString("data.authentication.names."+UUID);
        }
        return new String(Base64.getDecoder().decode(name));
    }

    private static void refreshBrowser() {
        if(NEXApplication.getInstance().getApplicationFrame() != null) {
            if(NEXApplication.getInstance().getApplicationFrame().getBrowser().getURL().contains("page=settings")) {
                NEXApplication.getInstance().getApplicationFrame().getBrowser().loadURL(NEXApplication.getInstance().isOnlineUI() ? "https://nerofynetwork.github.io/NEXUS-App/src/main/html/index.html?page=settings.html&st=account-settings&app=true" : "localhost:" + Main.getPort() + "/index.html?page=settings.html&st=account-settings&app=true");
            } else if(NEXApplication.getInstance().getApplicationFrame().getBrowser().getURL().contains("page=library")|| NEXApplication.getInstance().getApplicationFrame().getBrowser().getURL().contains("page=login")) {
                if(NEXApplication.getInstance().getLocalSettings().useNewUI()) {
                    NEXApplication.getInstance().getApplicationFrame().getBrowser().loadURL("http://localhost:"+Main.getPort()+"/index.html?page=library");
                } else {
                    NEXApplication.getInstance().getApplicationFrame().getBrowser().reload();
                }
            }
        }
    }

    private static void showOverlay(boolean pleaseWait) {
        if(NEXApplication.getInstance().getApplicationFrame()!=null) {
            if(pleaseWait) {
                NEXApplication.getInstance().getApplicationFrame().executeJavaScript("document.getElementById('login-overlay').innerText = 'Please wait...';");
            }
            NEXApplication.getInstance().getApplicationFrame().executeJavaScript("document.getElementById('login-overlay').classList.add('active');");
        }
    }
}