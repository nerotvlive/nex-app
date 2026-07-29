package com.zyneonstudios.apex.nexapp.main.console.commands;

import com.zyneonstudios.apex.nexapp.main.NEXApplication;
import com.zyneonstudios.apex.nexapp.main.console.NexusConsoleCommand;

public class ExitCommand extends NexusConsoleCommand {

    public ExitCommand() {
        super("exit");
        addAliases("quit","end","stop","shutdown","close");
    }

    @Override
    public boolean run(String[] args) {
        NEXApplication.stop(0);
        return true;
    }
}