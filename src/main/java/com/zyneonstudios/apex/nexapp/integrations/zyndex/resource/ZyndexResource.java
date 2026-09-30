package com.zyneonstudios.apex.nexapp.integrations.zyndex.resource;

public interface ZyndexResource {

    String getTitle();
    String getId();
    String getSlug();
    String getVersion();

    String getSummary();
    String getDescription();

    ZyndexResourceCategory[] getCategories();
    ZyndexResourceEnvironment getEnvironment();

    enum ZyndexResourceType {
        CUSTOM,
        DATAPACK,
        FILE,
        MOD,
        MOD_PACK,
        RESOURCE_PACK,
        SHADER_PACK,
        WORLD
    }

}
