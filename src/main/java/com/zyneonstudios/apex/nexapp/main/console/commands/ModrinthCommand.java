package com.zyneonstudios.apex.nexapp.main.console.commands;

import com.zyneonstudios.apex.nexapp.main.NEXApplication;
import com.zyneonstudios.apex.nexapp.main.console.NexusConsoleCommand;
import com.zyneonstudios.apex.nexapp.search.modrinth.ModrinthIntegration;

import java.io.File;
import java.util.concurrent.CompletableFuture;

public class ModrinthCommand extends NexusConsoleCommand {

    public ModrinthCommand() {
        super("modrinth-install");
        addAlias("labrinth-install");
    }

    @Override
    public boolean run(String[] args) {
        if(args.length>1) {
            String projectId = args[0];
            String versionId = args[1];
            CompletableFuture.runAsync(()-> ModrinthIntegration.installModpack(new File(NEXApplication.getInstance().getLocalSettings() .getDefaultMinecraftPath()),projectId,versionId));
            return true;
        }
        NEXApplication.getLogger().err("Syntax error: modrinth-install <project_id_or_slug> <versionId>");
        return false;
    }
}
