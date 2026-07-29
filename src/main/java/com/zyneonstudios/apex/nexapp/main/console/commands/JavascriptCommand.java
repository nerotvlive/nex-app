package com.zyneonstudios.apex.nexapp.main.console.commands;

import com.zyneonstudios.apex.nexapp.main.NEXApplication;
import com.zyneonstudios.apex.nexapp.main.console.NexusConsoleCommand;

import java.util.Arrays;

public class JavascriptCommand extends NexusConsoleCommand {

    public JavascriptCommand() {
        super("javascript");
        addAliases("js");
    }

    @Override
    public boolean run(String[] args) {
        if(args.length == 0) {
            return false;
        } else {
            String command = Arrays.toString(args).replace("[", "").replace("]", "").replace(", ", " ");
            NEXApplication.getInstance().getApplicationFrame().executeJavaScript(command);
            return true;
        }
    }
}
