package com.zyneonstudios.apex.nexapp.modules;

import com.zyneonstudios.apex.nexapp.events.module.ModuleDisableEvent;
import com.zyneonstudios.apex.nexapp.events.module.ModuleEnableEvent;
import com.zyneonstudios.apex.nexapp.events.module.ModuleLoadEvent;
import com.zyneonstudios.apex.nexapp.main.NEXApp;

import java.io.File;
import java.util.Collection;
import java.util.HashMap;
import java.util.Set;

/**
 * The {@code ModuleLoader} class is responsible for loading, managing, and unloading modules within the NEX App.
 * It handles reading module information from JAR files, instantiating module classes, and managing their lifecycle.
 * It also provides methods to activate and deactivate modules.
 */
public class ModuleLoader {

    // Map to store loaded modules, keyed by their unique ID.
    private final HashMap<String, AppModule> modules = new HashMap<>();

    // Map to store the paths of module JAR files, keyed by module ID.
    private final HashMap<String, String> moduleJars = new HashMap<>();

    /**
     * Constructor for the ModuleLoader.
     *
     * @param application The main NexusApplication instance.
     */
    public ModuleLoader(NEXApp application) {
        // Check for modules marked for uninstallation and delete them.

    }

    /**
     * Gets a collection of all loaded Nexus modules.
     *
     * @return A collection of NexusModule instances.
     */
    public Collection<AppModule> getNexusModules() {
        return modules.values();
    }

    /**
     * Gets a map of all loaded Nexus modules, keyed by their IDs.
     *
     * @return A map of module IDs to NexusModule instances.
     */
    public HashMap<String, AppModule> getNexusModulesById() {
        return modules;
    }

    /**
     * Gets a set of all loaded Nexus module IDs.
     *
     * @return A set of module IDs.
     */
    public Set<String> getNexusModuleIds() {
        return modules.keySet();
    }

    /**
     * Reads module information from a JAR file.
     *
     * @param moduleJar The JAR file containing the module.
     * @return The NexusModule instance if successful, null otherwise.
     */
    public AppModule readModule(File moduleJar) {
        /*try {
            String mainPath;
            String id;
            // Read module information from nexus-module.json within the JAR.
            try (JarFile jarFile = new JarFile(moduleJar.getAbsolutePath())) {
                InputStream is = jarFile.getInputStream(jarFile.getJarEntry("nexus-module.json"));
                BufferedReader reader = new BufferedReader(new InputStreamReader(is));
                JsonObject jsonObject = NEXApp.getInstance().getFastGson().fromJson(reader, JsonObject.class);
                JsonArray array = jsonObject.getAsJsonArray("modules");
                mainPath = array.get(0).getAsJsonObject().get("main").getAsString();
                id = array.get(0).getAsJsonObject().get("id").getAsString();
                // Check if a module with the same ID is already loaded.
                if (moduleJars.containsKey(id)) {
                    NEXApp.getLogger().deb("Module with ID '" + id + "' is already loaded. Skipping duplicate.");
                    return null;
                }
            } catch (Exception e) {
                System.err.println("Couldn't read module " + moduleJar.getPath() + ": " + e.getMessage());
                return null;
            }
            // Load the module class using a URLClassLoader.
            URLClassLoader classLoader = new URLClassLoader(new URL[]{moduleJar.toURI().toURL()});
            Class<?> moduleClass = classLoader.loadClass(mainPath);
            Constructor<?> constructor = moduleClass.getConstructor();
            NEXModule module = (NEXModule) constructor.newInstance();
            // Validate the module ID and store the module path.
            if (id.equals(module.getModuleId())) {
                moduleJars.put(id, moduleJar.getAbsolutePath().replace("\\", "/"));
                return module;
            } else {
                System.err.println("Module ID mismatch in " + moduleJar.getPath() + ". Expected: " + id + ", Found: " + module.getModuleId());
            }
        } catch (Exception e) {
            System.err.println("Couldn't read module " + moduleJar.getPath() + ": " + e.getMessage());
        }*/
        return null;
    }

    /**
     * Loads a module into the application.
     *
     * @param module The NexusModule instance to load.
     */
    public void loadModule(AppModule module) {
        // Check if a module with the same ID is already loaded.
        if (!modules.containsKey(module.getModuleId())) {
            System.out.println("Loading module " + module.getModuleId() + " v" + module.getModuleVersion() + " by " + module.getModuleOwner() + "...");
            modules.put(module.getModuleId(), module);
            if(module.load().execute()) {
                for(ModuleLoadEvent event : module.loadEvents()) {
                    event.execute();
                }
                System.out.println("Module " + module.getModuleId() + " loaded successfully.");
            } else {
                System.err.println("Module " + module.getModuleId() + " failed to load.");
            }
        } else {
            System.err.println("Module with ID '" + module.getModuleId() + "' is already loaded. Skipping.");
        }
    }

    /**
     * Activates all loaded modules.
     */
    public void activateModules() {
        for (AppModule module : modules.values()) {
            if(module.enable().execute()) {
                for(ModuleEnableEvent event : module.enableEvents()) {
                    event.execute();
                }
                System.out.println("Module " + module.getModuleId() + " activated successfully.");
            } else {
                System.err.println("Module " + module.getModuleId() + " failed to activate.");
            }
        }
    }

    /**
     * Deactivates all loaded modules.
     */
    public void deactivateModules() {
        for (AppModule module : modules.values()) {
            if(module.disable().execute()) {
                for(ModuleDisableEvent event : module.disableEvents()) {
                    event.execute();
                }
                System.out.println("Module " + module.getModuleId() + " deactivated successfully.");
            } else {
                System.err.println("Module " + module.getModuleId() + " failed to deactivate.");
            }
        }
    }

    /**
     * Unloads a specific module.
     *
     * @param module The NexusModule instance to unload.
     */
    public void unloadModule(AppModule module) {
        modules.remove(module.getModuleId());
    }

    /**
     * Unloads all loaded modules.
     */
    public void unloadModules() {
        for (AppModule module : modules.values()) {
            unloadModule(module);
        }
        modules.clear();
        moduleJars.clear();
        System.gc();
    }
}