package com.zyneonstudios.apex.nexapp.main.console.commands;

import com.zyneonstudios.apex.nexapp.main.NEXApplication;
import com.zyneonstudios.apex.nexapp.main.console.NexusConsoleCommand;

public class SettingsCommand extends NexusConsoleCommand {

    public SettingsCommand() {
        super("settings");
    }

    @Override
    public boolean run(String[] args) {
        if(args.length==3) {
            if(args[0].equalsIgnoreCase("set")) {
                NEXApplication.getInstance().getSettings().set(args[1], args[2]);
                return true;
            }
        }
        return false;
    }
}
