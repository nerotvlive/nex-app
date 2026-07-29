package com.zyneonstudios.apex.nexapp.main.console.commands;

import com.zyneonstudios.apex.nexapp.main.NEXApplication;
import com.zyneonstudios.apex.nexapp.main.console.NexusConsoleCommand;
import com.zyneonstudios.apex.nexapp.utilities.ApplicationLogger;

public class HelpCommand extends NexusConsoleCommand {

    public HelpCommand() {
        super("help");
        addAliases("?","nexus","nexushelp","nexus?");
    }

    @Override
    public boolean run(String[] args) {
        ApplicationLogger logger = NEXApplication.getLogger();
        String separator = "============================================";

        logger.log(" ");
        logger.log("=(NEX APP)"+separator);
        logger.deb("NEX APP DEBUG MODE ENABLED");
        logger.log("NEX App version: "+ NEXApplication.getInstance().getVersion());
        logger.log("For more help: https://apex.zyneonstudios.org/nexus-app/");
        logger.log(separator+"(NEX APP)=");
        logger.log(" ");

        System.gc();
        return true;
    }
}