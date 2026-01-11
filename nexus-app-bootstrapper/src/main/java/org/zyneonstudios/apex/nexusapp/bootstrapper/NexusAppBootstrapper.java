package org.zyneonstudios.apex.nexusapp.bootstrapper;

import org.zyneonstudios.apex.bootstrapper.ApexBootstrapper;

import java.io.File;

public class NexusAppBootstrapper {

    private final ApexBootstrapper bootstrapper;
    private final String path;
    private final String[] args;

    public NexusAppBootstrapper(String path, String[] args) {
        this.path = path; this.args = args;
        this.bootstrapper = new ApexBootstrapper("https://zyneonstudios.github.io/apex-metadata/nexus-app/bootstrapper-metadata.json",path,new File(path+"/bootstrapper-data.json"),args,true,true);
        bootstrapper.showFrame();
    }

    public void update() {
        bootstrapper.update();
    }

    public void launch() {
        bootstrapper.hideFrame();
        bootstrapper.launch();
    }

    public String getPath() {
        return path;
    }

    public String[] getArgs() {
        return args;
    }
}