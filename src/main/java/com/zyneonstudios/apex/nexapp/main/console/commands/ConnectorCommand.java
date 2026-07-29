package com.zyneonstudios.apex.nexapp.main.console.commands;

import com.zyneonstudios.apex.nexapp.main.NEXApplication;
import com.zyneonstudios.apex.nexapp.main.console.NexusConsoleCommand;

import java.util.Arrays;

public class ConnectorCommand extends NexusConsoleCommand {

    public ConnectorCommand() {
        super("connector");
        addAliases("resolve");
    }

    @Override
    public boolean run(String[] args) {
        if(args.length > 0) {
            String command = Arrays.toString(args).replace("[", "").replace("]", "").replace(", ", " ");
            NEXApplication.getInstance().getApplicationFrame().executeJavaScript("console.log(\"[CONNECTOR] " + command+"\");");
            return true;
        }
        return false;
    }
}