package com.zyneonstudios.apex.nexapp.integrations.zyndex;

public interface Zyndex {

    String getTitle();
    String getId();
    String getSlug();
    String getVersion();

    String getOwner();
    String[] getContributors();
}