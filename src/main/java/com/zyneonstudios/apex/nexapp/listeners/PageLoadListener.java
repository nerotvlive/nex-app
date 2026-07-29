package com.zyneonstudios.apex.nexapp.listeners;

import com.zyneonstudios.apex.nexapp.utilities.DiscordRichPresence;
import com.zyneonstudios.apex.nexapp.utilities.MicrosoftAuthenticator;
import com.zyneonstudios.apex.nexapp.events.PageLoadedEvent;
import com.zyneonstudios.apex.nexapp.main.NEXApplication;

public class PageLoadListener extends PageLoadedEvent {

    public PageLoadListener() {
        super(null);
    }

    @Override
    public boolean onLoad() {
        NEXApplication.getInstance().getApplicationFrame().executeJavaScript("enableDevTools("+ NEXApplication.getLogger().isDebugging()+");","app = true;","localStorage.setItem('enabled','true');","version = 'Desktop v"+ NEXApplication.getInstance().getVersion()+"';");
        if(getUrl().toLowerCase().contains("page=library")) {
            if(MicrosoftAuthenticator.isLoggedIn()) {
                NEXApplication.getInstance().getApplicationFrame().executeJavaScript("document.querySelector('.menu-panel').querySelector('.card-body').innerHTML = \"<div style='margin-left: 0.5rem;'><img src='https://cravatar.eu/helmhead/"+MicrosoftAuthenticator.getUUID()+"/128.png'></div><div class='w-100 h-100 p-2 d-flex flex-column'><p>Account: <label><select id='authenticatedAccounts' onchange=\\\"console.log('[CONNECTOR] login.'+this.value); document.getElementById('login-overlay').innerText = 'Please wait...';\\\"><option value='"+MicrosoftAuthenticator.getUUID()+"'>"+MicrosoftAuthenticator.getUsername()+"</option></select></label><br><a onclick=\\\"loadPage('settings.html',menu,'&st=account-settings&app=true');\\\">Manage account(s)</a></p></div>\";");
                for(String u:MicrosoftAuthenticator.getDecryptedAuthenticatedUUIDs()) {
                    if (!u.equals(MicrosoftAuthenticator.getUUID())) {
                        String n = MicrosoftAuthenticator.getDecryptedAuthenticatedUsername(u);
                        NEXApplication.getInstance().getApplicationFrame().executeJavaScript("document.getElementById('authenticatedAccounts').innerHTML += \"<option value='" + u + "'>" + n + "</option>\"");
                    }
                }
                NEXApplication.getInstance().getApplicationFrame().executeJavaScript("document.getElementById('authenticatedAccounts').innerHTML += \"<option value='new'>Add account</option>\"");
            } else {
                NEXApplication.getInstance().getApplicationFrame().executeJavaScript("loadPage('login.html');");
            }
            DiscordRichPresence.setDetails("Looking at their library...");
        }
        if(getUrl().toLowerCase().contains("page=login")) {
            if(MicrosoftAuthenticator.isLoggedIn()) {
                NEXApplication.getInstance().getApplicationFrame().executeJavaScript("loadPage('library.html');");
            }
            DiscordRichPresence.setDetails("Looking at their library...");
        }
        if(getUrl().toLowerCase().contains("page=discover")) {
            DiscordRichPresence.setDetails("Exploring resources...");
        }
        if(getUrl().toLowerCase().contains("page=settings")) {
            DiscordRichPresence.setDetails("Customizing their settings...");
        }
        if(getUrl().toLowerCase().contains("page=downloads")) {
            DiscordRichPresence.setDetails("Looking at downloads...");
        }
        return true;
    }
}
