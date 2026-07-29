package com.zyneonstudios.apex.nexapp.main.console.commands;

import com.zyneonstudios.apex.nexapp.main.NEXApplication;
import com.zyneonstudios.apex.nexapp.main.console.NexusConsoleCommand;

import java.util.Arrays;

public class GetCommand extends NexusConsoleCommand {

    public GetCommand() {
        super("get");
        addAliases("download","search","install");
    }

    @Override
    public boolean run(String[] args) {
        if(args.length>0) {
            String query = Arrays.toString(args).replace("[", "").replace("]", "").replace(", ", " ");
            NEXApplication.getInstance().getApplicationFrame().executeJavaScript("loadPage('discover.html',false,\"&dt=search&q=" + query + "\");");
            return true;
        }
        NEXApplication.getLogger().err("Syntax error: get <identifier>");
        return false;
    }
}
