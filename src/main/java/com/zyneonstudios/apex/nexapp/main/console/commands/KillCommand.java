package com.zyneonstudios.apex.nexapp.main.console.commands;

import com.zyneonstudios.apex.nexapp.main.NEXApplication;
import com.zyneonstudios.apex.nexapp.main.console.NexusConsoleCommand;

public class KillCommand extends NexusConsoleCommand {

    public KillCommand() {
        super("kill");
        addAliases("forcestop");
    }

    @Override
    public boolean run(String[] args) {
        if(args.length==1) {
            if(args[0].equalsIgnoreCase("-f")) {
                System.exit(-10);
                return true;
            }
        }
        NEXApplication.stop(0);
        return false;
    }
}
