package com.zyneonstudios.apex.nexapp.integrations.zyndex.local;

import com.zyneonstudios.apex.nexapp.integrations.zyndex.Zyndex;
import com.zyneonstudios.apex.nexapp.integrations.zyndex.resource.ZyndexResource;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collection;
import java.util.UUID;

public class LocalZyndex implements Zyndex {

    private String title = "New Zyndex";
    private String version = "0.0.1";

    private String id = UUID.randomUUID().toString();
    private String slug = "new-zyndex";

    private String owner = "Unknown";
    private ArrayList<String> contributors = new ArrayList<>();
    private ArrayList<ZyndexResource> resources = new ArrayList<>();

    @Override
    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    @Override
    public String getId() {
        return id;
    }

    public void setId(String id) {
        setId(id,false);
    }

    public void setId(UUID id) {
        setId(id,false);
    }

    public void setId(String id, boolean overrideSlug) {
        this.id = id;
        if(overrideSlug) {
            this.slug = id;
        }
    }

    public void setId(UUID id, boolean overrideSlug) {
        setId(id.toString(),overrideSlug);
    }

    @Override
    public String getSlug() {
        return slug;
    }

    public void setSlug(String slug) {
        setSlug(slug,false);
    }

    public void setSlug(String slug, boolean overrideId) {
        this.slug = slug;
        if(overrideId) {
            this.id = slug;
        }
    }

    @Override
    public String getVersion() {
        return version;
    }

    public void setVersion(String version) {
        this.version = version;
    }

    @Override
    public String getOwner() {
        return owner;
    }

    public void setOwner(String owner) {
        this.owner = owner;
    }

    @Override
    public String[] getContributors() {
        return contributors.toArray(new String[0]);
    }

    public ArrayList<String> getContributorList() {
        return contributors;
    }

    public void setContributors(String... contributors) {
        this.contributors = new ArrayList<>(Arrays.asList(contributors));
    }

    public void setContributors(Collection<String> contributors) {
        this.contributors = new ArrayList<>(contributors);
    }

    public void addContributor(String contributor) {
        if(!contributors.contains(contributor)) {
            contributors.add(contributor);
        }
    }

    public void addContributors(String... contributors) {
        for(String contributor : contributors) {
            addContributor(contributor);
        }
    }

    public void addContributors(Collection<String> contributors) {
        for(String contributor : contributors) {
            addContributor(contributor);
        }
    }

    public void removeContributor(String contributor) {
        contributors.remove(contributor);
    }

    public void removeContributors(String... contributors) {
        for(String contributor : contributors) {
            removeContributor(contributor);
        }
    }

    public void removeContributors(Collection<String> contributors) {
        for(String contributor : contributors) {
            removeContributor(contributor);
        }
    }

    @Override
    public ZyndexResource[] getResources() {
        return resources.toArray(new ZyndexResource[0]);
    }

    public ArrayList<ZyndexResource> getResourceList() {
        return resources;
    }

    public void setResources(ZyndexResource... resources) {
        this.resources = new ArrayList<>(Arrays.asList(resources));
    }

    public void setResources(Collection<ZyndexResource> resources) {
        this.resources = new ArrayList<>(resources);
    }

    public void addResource(ZyndexResource resource) {
        if(!resources.contains(resource)) {
            resources.add(resource);
        }
    }

    public void addResources(ZyndexResource... resources) {
        for(ZyndexResource resource : resources) {
            addResource(resource);
        }
    }

    public void addResources(Collection<ZyndexResource> resources) {
        for(ZyndexResource resource : resources) {
            addResource(resource);
        }
    }

    public void removeResource(ZyndexResource resource) {
        resources.remove(resource);
    }

    public void removeResources(ZyndexResource... resources) {
        for(ZyndexResource resource : resources) {
            removeResource(resource);
        }
    }

    public void removeResources(Collection<ZyndexResource> resources) {
        for(ZyndexResource resource : resources) {
            removeResource(resource);
        }
    }
}
