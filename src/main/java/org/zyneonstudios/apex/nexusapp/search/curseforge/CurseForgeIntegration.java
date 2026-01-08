package org.zyneonstudios.apex.nexusapp.search.curseforge;

import com.google.gson.JsonArray;
import com.google.gson.JsonElement;
import com.google.gson.JsonObject;
import com.zyneonstudios.nexus.instance.ZynstanceBuilder;
import com.zyneonstudios.nexus.utilities.file.FileActions;
import com.zyneonstudios.nexus.utilities.json.GsonUtility;
import com.zyneonstudios.nexus.utilities.strings.StringGenerator;
import fr.flowarg.flowupdater.utils.IOUtils;
import org.apache.commons.io.FileUtils;
import org.zyneonstudios.apex.nexusapp.downloads.Download;
import org.zyneonstudios.apex.nexusapp.events.DownloadFinishEvent;
import org.zyneonstudios.apex.nexusapp.main.NexusApplication;
import org.zyneonstudios.apex.nexusapp.search.curseforge.resource.CurseForgeResource;
import org.zyneonstudios.apex.nexusapp.search.curseforge.resource.CurseForgeResourceVersion;

import java.io.File;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.io.IOException;
import java.net.HttpURLConnection;
import java.net.URI;
import java.net.URL;
import java.util.ArrayList;
import java.util.Objects;
import java.util.zip.ZipEntry;
import java.util.zip.ZipInputStream;

public class CurseForgeIntegration {

    public static void installModpack(File installDir, int projectId, int versionId) {
        CurseForgeResource project = new CurseForgeResource(projectId);
        CurseForgeResourceVersion version = new CurseForgeResourceVersion(projectId, versionId);
        JsonObject data = version.getJson();

        String slug;
        if (project.getSlug() != null && !project.getSlug().isEmpty() && !project.getSlug().isBlank()) {
            slug = project.getSlug();
        } else {
            slug = project.getId() + "";
        }
        installDir = getInstallDir(installDir, slug);

        String versionName;
        if (version.getDisplayName() != null && !version.getDisplayName().isEmpty() && !version.getDisplayName().isBlank()) {
            versionName = version.getDisplayName();
        } else {
            versionName = versionId + "";
        }

        String fileName = "curseforge-" + slug + "-" + versionName.replace(".zip","") + ".zip";
        String downloadName = (NexusApplication.getInstance().getWorkingPath() + "/temp/" + fileName).replace("\\", "/").replace("//", "/");
        File download = new File(downloadName);
        if (download.exists()) {
            if (!download.delete()) {
                throw new RuntimeException("Failed to delete old download");
            }
        }

        try {
            Download metaDownload = new Download("CurseForge " + slug + "-" + versionName + " metadata", new URI(version.getDownloadUrl()).toURL(), download.toPath());
            NexusApplication.getInstance().getDownloadManager().addDownload(metaDownload);
            while (!metaDownload.isFinished()) {
                Thread.sleep(1000);
            }
        } catch (Exception e) {
            NexusApplication.getLogger().err(e.getMessage());
            throw new RuntimeException(e);
        }

        if (!download.exists()) {
            throw new NullPointerException("Downloaded file " + downloadName + " not found!");
        }

        String curseForgePackPath = installDir.getAbsolutePath();
        if (unzip(download.getAbsolutePath(), curseForgePackPath)) {
            File overrides = new File(curseForgePackPath + "/overrides/");
            if (overrides.exists() && overrides.isDirectory()) {
                if (overrides.listFiles() != null) {
                    for (File overrideFile : Objects.requireNonNull(overrides.listFiles())) {
                        if (overrideFile.isDirectory()) {
                            try {
                                File destFile = new File(overrides.getParent() + "/" + overrideFile.getName());
                                if (destFile.exists()) {
                                    FileActions.deleteFolder(destFile);
                                }
                                FileUtils.moveDirectory(overrideFile, destFile);
                            } catch (Exception e) {
                                NexusApplication.getLogger().err(e.getMessage());
                            }
                        }
                    }
                }
                FileActions.deleteFolder(overrides);
            }
            File index = new File(curseForgePackPath + "/manifest.json");
            if (index.exists()) {
                JsonObject indexJson = NexusApplication.getInstance().getFastGson().fromJson(GsonUtility.getFromFile(index), JsonObject.class);

                if (indexJson.has("files")) {
                    final double[] progress = {0};
                    final int[] finished = {0};
                    ArrayList<Download> fileDownloads = new ArrayList<>();
                    JsonArray files = indexJson.getAsJsonArray("files");
                    for (JsonElement file_ : files) {

                        JsonObject fileData = file_.getAsJsonObject();
                        int pId = fileData.get("projectID").getAsInt();
                        int fId = fileData.get("fileID").getAsInt();

                        CurseForgeResource resource = new CurseForgeResource(pId);
                        CurseForgeResourceVersion file = new CurseForgeResourceVersion(pId, fId);

                        String path = "mods/";
                        if (resource.getClassId() == 5) {
                            path = "plugins/";
                        } else if (resource.getClassId() == 12) {
                            path = "resourcepacks/";
                        } else if (resource.getClassId() == 17) {
                            path = "worlds/";
                        } else if (resource.getClassId() == 6552) {
                            path = "shaderpacks/";
                        } else if (resource.getClassId() == 6945) {
                            path = "datapacks/";
                        }


                        String url = file.getDownloadUrl();
                        try {
                            File filePath = new File(installDir.getAbsolutePath() + "/" + path + file.getFileName());
                            filePath.getParentFile().mkdirs();
                            Download fileDownload = new Download(project.getName() + " " + path + file.getFileName(), new URI(url).toURL(), filePath.toPath());
                            fileDownloads.add(fileDownload);
                        } catch (Exception e) {
                            NexusApplication.getLogger().err("Cannot download file \"" + path + file.getFileName() + "\" for modrinth pack \"" + project.getName() + "\": " + e.getMessage());
                        }

                    }

                    try {
                        CurseForgeDownload packDownload = new CurseForgeDownload(project, fileDownloads, installDir.toPath());
                        NexusApplication.getInstance().getDownloadManager().addDownload(packDownload);
                        File finalInstallDir = installDir;
                        packDownload.setFinishEvent(new DownloadFinishEvent(packDownload) {
                            @Override
                            public boolean onFinish() {
                                String title = project.getName();
                                ZynstanceBuilder instanceConverter = new ZynstanceBuilder(finalInstallDir + "/zyneonInstance.json");
                                instanceConverter.setName(title);
                                instanceConverter.setVersion(versionName);
                                instanceConverter.setId("curseforge-" + slug);
                                instanceConverter.setSummary(project.getSummary());
                                instanceConverter.setDescription(project.getSummary());
                                JsonObject dependencies = indexJson.get("minecraft").getAsJsonObject();
                                instanceConverter.setMinecraftVersion(dependencies.get("version").getAsString());

                                if(dependencies.has("modLoaders")) {
                                    JsonArray modLoaders = dependencies.getAsJsonArray("modLoaders");
                                    for(JsonElement loader_ : modLoaders) {
                                        JsonObject loader = loader_.getAsJsonObject();
                                        if(loader.has("primary")) {
                                            if(loader.get("primary").getAsBoolean()) {
                                                String[] mId = loader.get("id").getAsString().split("-",2);
                                                if(mId[0].equalsIgnoreCase("fabric")) {
                                                    instanceConverter.setMetaProperty("modloader", "fabric");
                                                    instanceConverter.setFabricVersion(mId[1]);
                                                } else if(mId[0].equalsIgnoreCase("forge")) {
                                                    instanceConverter.setMetaProperty("modloader", "forge");
                                                    instanceConverter.setForgeVersion(mId[1]);
                                                } else if(mId[0].equalsIgnoreCase("quilt")) {
                                                    instanceConverter.setMetaProperty("modloader", "quilt");
                                                    instanceConverter.setQuiltVersion(mId[1]);
                                                } else if(mId[0].equalsIgnoreCase("neoforge")) {
                                                    instanceConverter.setMetaProperty("modloader", "neoforge");
                                                    instanceConverter.setNeoForgeVersion(mId[1]);
                                                }
                                            }
                                        }
                                    }
                                }

                                instanceConverter.setDownloadUrl("curseforge");
                                instanceConverter.setOriginUrl("local");
                                ArrayList<String> tags = new ArrayList<>();

                                for(JsonElement category:project.getCategories()) {
                                    JsonObject cat = category.getAsJsonObject();
                                    tags.add(cat.get("name").getAsString());
                                }

                                tags.add("curseforge");
                                instanceConverter.setTags(tags);
                                ArrayList<String> authors = new ArrayList<>();

                                for(JsonElement author:project.getAuthors()) {
                                    JsonObject auth = author.getAsJsonObject();
                                    authors.add(auth.get("name").getAsString());
                                }

                                instanceConverter.setAuthors(authors);

                                if(project.getLogo()!=null) {
                                    if(project.getLogo().has("url")) {
                                        instanceConverter.setIconUrl(project.getLogo().get("url").getAsString());
                                    }
                                }

                                instanceConverter.create();
                                if (NexusApplication.getInstance().getApplicationFrame().getBrowser().getURL().toLowerCase().contains("page=library")) {
                                    NexusApplication.getInstance().getApplicationFrame().getBrowser().reload();
                                }
                                return false;
                            }
                        });
                    } catch (Exception e) {
                        NexusApplication.getLogger().err(e.getMessage());
                        throw new RuntimeException(e);
                    }
                }
            } else {
                NexusApplication.getLogger().err("Couldn't find CurseForge manifest json file: " + index.getAbsolutePath());
            }
        }

        System.gc();
        if (!download.delete()) {
            download.deleteOnExit();
        }
    }

    private static boolean unzip(String fileZip, String destDirPath) {
        File destDir = new File(destDirPath);
        if (!destDir.exists()) {
            NexusApplication.getLogger().deb("Created destination path: "+destDir.mkdirs());
        }
        try {
            byte[] buffer = new byte[1024];
            ZipInputStream zis = new ZipInputStream(new FileInputStream(fileZip));
            ZipEntry zipEntry = zis.getNextEntry();
            while (zipEntry != null) {
                String s = (destDir +"/"+ zipEntry.getName()).replace("\\","/").replace("//","/");
                File newFile = new File(s);
                if (zipEntry.isDirectory()) {
                    if (!newFile.isDirectory() && !newFile.mkdirs()) {
                        throw new IOException("Failed to create directory " + newFile);
                    }
                } else {
                    File parent = newFile.getParentFile();
                    if (!parent.isDirectory() && !parent.mkdirs()) {
                        throw new IOException("Failed to create directory " + parent);
                    }

                    FileOutputStream fos = new FileOutputStream(newFile);
                    int len;
                    while ((len = zis.read(buffer)) > 0) {
                        fos.write(buffer, 0, len);
                    }
                    fos.close();
                }
                zipEntry = zis.getNextEntry();
            }

            zis.closeEntry();
            zis.close();
            return true;
        } catch (Exception e) {
            NexusApplication.getLogger().err(e.getMessage());
        }
        return false;
    }

    private static File getInstallDir(File installDir, String id) {
        File bak = installDir;
        if(!installDir.getName().equalsIgnoreCase(id)) {
            installDir = new File(installDir.getAbsolutePath() + "/" + id.replace("/","-")+"/");
        }
        if(!installDir.exists()) {
            if(!installDir.mkdirs()) {
                throw new NullPointerException("Could not find or create instance directory \""+installDir.getAbsolutePath()+"\"");
            }
        } else {
            return getInstallDir(bak, id+"-"+ StringGenerator.generateAlphanumericString(8));
        }
        return installDir;
    }

    public static String accessAPI(String url) {
        HttpURLConnection connection = null;
        try {
            connection = (HttpURLConnection)new URL(url).openConnection();
            connection.setRequestMethod("GET");
            connection.setInstanceFollowRedirects(true);
            connection.setUseCaches(false);
            connection.setRequestProperty("Accept", "application/json");
            connection.setRequestProperty("x-api-key", "$2a$10$KasKOdKA23HXYEGVR5oml.T4cG.jFMZnLhpZLPH4sCMwiAkGd7BaK");
            return IOUtils.getContent(connection.getInputStream());
        } catch (Exception e) {
            return null;
        } finally {
            if(connection != null) {
                connection.disconnect();
            }
        }
    }
}