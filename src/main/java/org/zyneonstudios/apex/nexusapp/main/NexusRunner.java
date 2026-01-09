package org.zyneonstudios.apex.nexusapp.main;

import com.google.gson.JsonObject;
import com.zyneonstudios.nexus.utilities.json.GsonUtility;
import org.zyneonstudios.apex.nexusapp.downloads.Download;
import org.zyneonstudios.apex.nexusapp.downloads.DownloadManager;

import java.util.*;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.TimeUnit;

/**
 * The {@code NexusRunner} class is responsible for running tasks at a fixed rate.
 * It uses a {@link ScheduledExecutorService} to schedule the execution of the {@link #run()} method.
 */
public class NexusRunner {

    /**
     * The unique identifier for this runner instance.
     */
    private final UUID runnerID = UUID.randomUUID();

    private UUID downloading = null;
    private double maxSpeedMbps = 0;
    private final int MAX_SAMPLES = 20;

    /**
     * Indicates whether the runner has been started.
     */
    private boolean started = false;

    /**
     * The executor service used to schedule tasks.
     */
    private ScheduledExecutorService executor;

    /**
     * Gets the unique identifier of this runner.
     *
     * @return The UUID of the runner.
     */
    public UUID getRunnerID() {
        return runnerID;
    }

    /**
     * Checks if the runner has been started.
     *
     * @return {@code true} if the runner has been started, {@code false} otherwise.
     */
    public boolean isStarted() {
        return started;
    }

    /**
     * Gets the executor service used by this runner.
     *
     * @return The {@link ScheduledExecutorService} instance.
     */
    public ScheduledExecutorService getExecutor() {
        return executor;
    }

    /**
     * Starts the runner, scheduling the {@link #run()} method to be executed at a fixed rate.
     * If the runner is already started, this method does nothing.
     */
    public void start() {
        if (!started) {
            started = true;
            executor = Executors.newScheduledThreadPool(1);
            executor.scheduleAtFixedRate(this::run, 0, 1, TimeUnit.SECONDS);
            NexusApplication.getLogger().log("Started runner with ID: " + runnerID);
        }
    }

    /**
     * The method that is executed periodically by the runner.
     * Currently, it does nothing but can be extended to perform specific tasks.
     */
    int c = 0; int u = 119;
    protected void run() {
        if (!started) {
            started = true;
            return;
        }

        if(c == 300) {
            c = 0;
            System.gc();
        }

        CompletableFuture.runAsync(()-> {
            if(downloading != null) {
                NexusApplication.getInstance().getApplicationFrame().executeJavaScript("document.getElementById('downloads-button').style.color = 'var(--nex-primary)';");
                NexusApplication.getInstance().getApplicationFrame().executeJavaScript("document.getElementById('downloads-button').querySelector('span').style.textShadow = '0 0 0.3rem var(--nex-primary)';");
                NexusApplication.getInstance().getApplicationFrame().executeJavaScript("document.getElementById('downloads-button').querySelector('i').style.textShadow = '0 0 0.3rem var(--nex-primary)';");
                NexusApplication.getInstance().getApplicationFrame().executeJavaScript("document.getElementById('downloads-icon').classList.add('downloading');");
            } else {
                NexusApplication.getInstance().getApplicationFrame().executeJavaScript("document.getElementById('downloads-button').style.color = '';");
                NexusApplication.getInstance().getApplicationFrame().executeJavaScript("document.getElementById('downloads-button').querySelector('span').style.textShadow = '';");
                NexusApplication.getInstance().getApplicationFrame().executeJavaScript("document.getElementById('downloads-button').querySelector('i').style.textShadow = '';");
                NexusApplication.getInstance().getApplicationFrame().executeJavaScript("document.getElementById('downloads-icon').classList.remove('downloading');");
            }

            if (downloading != null) {
                Download download = NexusApplication.getInstance().getDownloadManager().getDownloads().get(downloading);
                double speed = download.getSpeedMbps();
                addSample(download.getUuid(), speed);
                if (download.isFinished()) {
                    downloading = null;
                }
            } else {
                NexusApplication.getInstance().getDownloadManager().getDownloads().forEach((uuid, download) -> {
                    if (download.getState().equals(DownloadManager.DownloadState.WAITING)) {
                        downloading = uuid;
                        download.start();
                    }
                });
            }
        });

        if (NexusApplication.getInstance().getApplicationFrame().getBrowser().getURL().contains("page=downloads")) {
            NexusApplication.getInstance().getDownloadManager().getDownloads().forEach((uuid, download) -> {
                if (download.getState().equals(DownloadManager.DownloadState.WAITING)) {
                    String id = download.getUuid()+"";
                    String name = download.getName();
                    String url = download.getUrl().toString();
                    String path = download.getPath().toString().replace("\\","/");
                    NexusApplication.getInstance().getApplicationFrame().executeJavaScript("addWaitingDownload(\""+id+"\",\""+name+"\",\""+url+"\",\""+path+"\",'Discover')");
                } else if (download.getState().equals(DownloadManager.DownloadState.RUNNING)) {
                    String id = download.getUuid()+"";
                    String name = download.getName();
                    String timeElapsed = download.getElapsedTime().getSeconds() + " seconds";
                    String timeRemaining = download.getEstimatedRemainingTime().getSeconds() + " seconds";
                    String sizeDownload = download.getFileSize()/1024/1024+" MB";
                    String sizeFile = download.getLastBytesRead()/1024/1024+" MB";
                    String progress = ((int)download.getPercent())+"";
                    String speedMbps = download.getSpeedMbps()+" MB/s";
                    String url = download.getUrl().toString();
                    String path = download.getPath().toString().replace("\\","/");
                    NexusApplication.getInstance().getApplicationFrame().executeJavaScript(
                            "updateRunningDownload(\""+id+"\",\""+name+"\",\""+timeElapsed+"\",\""+timeRemaining+"\",\""+sizeDownload+"\",\""+sizeFile+"\",\""+progress+"\",\""+speedMbps+"\",\""+url+"\",\""+path+"\")"
                    );
                } else if (download.getState().equals(DownloadManager.DownloadState.FINISHED) || download.getState().equals(DownloadManager.DownloadState.FAILED)) {
                    String id = download.getUuid()+"";
                    String name = download.getName();
                    boolean success = download.getState().equals(DownloadManager.DownloadState.FINISHED);
                    NexusApplication.getInstance().getApplicationFrame().executeJavaScript("addHistoryDownload(\""+id+"-history\",\""+name+"\","+success+")");
                }
                NexusApplication.getInstance().getApplicationFrame().executeJavaScript("document.getElementById('max-speed').innerText = '"+maxSpeedMbps+" MB/s';");
                NexusApplication.getInstance().getApplicationFrame().executeJavaScript("document.getElementById('avg-speed').innerText = '"+getGlobalAverage()+" MB/s';");
            });
        }

        try {
            JsonObject json = NexusApplication.getInstance().getFastGson().fromJson(GsonUtility.getFromURL("https://raw.githubusercontent.com/zyneonstudios/nexus-nex/main/application/index.json"), JsonObject.class).getAsJsonArray("versions").get(0).getAsJsonObject();
            checkVersion(json);
        } catch (Exception ignore) {
        }
    }

    private boolean runUpdateCheck(JsonObject json) {
        /*NexusApplication.getLogger().dbg("[RUNNER] Checking for Updates...");
        NexusApplication.getLogger().dbg("[RUNNER] Parsed JSON Data...");
        String v = json.get("info").getAsJsonObject().get("version").getAsString();
        NexusApplication.getLogger().dbg("[RUNNER] Latest version: " + v + "...");
        NexusApplication.getLogger().dbg("[RUNNER] Current version: " + NexusApplication.getInstance().getVersion() + "...");
        if (!v.equals(NexusApplication.getInstance().getVersion())) {
            NexusApplication.getLogger().dbg("[RUNNER] The application is not up to date!");
            return true;
        }*/

        return false;
    }

    private void checkVersion(JsonObject json) {
        u++;
        if (u > 120) {
            u = 0;
            if (runUpdateCheck(json)) {
                NexusApplication.getLogger().dbg("[RUNNER] Sending notification...");
                //TODO: Application.getFrame().sendNotification("Update available!", "Version " + v + " has been released!", "<a onclick=\"callJavaMethod('button.exit');\" class='button'>Install</a><a onclick=\"callJavaMethod('button.online');\" class='button'>Dynamic update</a>", v, true);
            }
        }
    }

    private final Map<UUID, Double> lastMeasurements =
            Collections.synchronizedMap(new LinkedHashMap<UUID, Double>(MAX_SAMPLES, 0.75f, true) {
                @Override
                protected boolean removeEldestEntry(Map.Entry<UUID, Double> eldest) {
                    return size() > MAX_SAMPLES;
                }
            });

    public void addSample(UUID downloadId, double speed) {
        lastMeasurements.put(downloadId, speed);
        if(speed>maxSpeedMbps) {
            maxSpeedMbps = speed;
        }
    }

    public double getGlobalAverage() {
        synchronized (lastMeasurements) {
            if (lastMeasurements.isEmpty()) return 0.0;

            double avg = lastMeasurements.values().stream()
                    .mapToDouble(Double::doubleValue)
                    .average()
                    .orElse(0.0);
            return Math.round(avg * 100.0) / 100.0;
        }
    }
}