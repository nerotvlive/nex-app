package com.zyneonstudios.apex.nexapp.integrations.zyndex;

import com.zyneonstudios.apex.nexapp.integrations.zyndex.resource.ZyndexResource;
import tools.jackson.databind.node.ObjectNode;

import java.util.Collection;

public interface Zyndex {

    String getTitle();
    String getId();
    String getSlug();
    String getVersion();

    String getOwner();
    String[] getContributors();
    Collection<String> getContributorList();

    ZyndexResource[] getResources();
    Collection<ZyndexResource> getResourceList();
    ZyndexResource getResource(String identifier);

    ObjectNode getJson();
}