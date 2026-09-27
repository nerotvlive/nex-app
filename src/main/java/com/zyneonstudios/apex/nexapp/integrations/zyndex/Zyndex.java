package com.zyneonstudios.apex.nexapp.integrations.zyndex;

import com.zyneonstudios.apex.nexapp.integrations.zyndex.resource.ZyndexResource;

public interface Zyndex {

    String getTitle();
    String getId();
    String getSlug();
    String getVersion();

    String getOwner();
    String[] getContributors();

    ZyndexResource[] getResources();
}