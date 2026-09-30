package com.zyneonstudios.apex.nexapp.integrations.zyndex;

import com.zyneonstudios.apex.nexapp.integrations.zyndex.resource.ZyndexResource;

import java.util.Collection;
import java.util.HashMap;
import java.util.UUID;

public interface EditableZyndex extends Zyndex {

    boolean setTitle(String title);

    boolean setId(String id);

    boolean setId(UUID id);

    boolean setId(String id, boolean overrideSlug);

    boolean setId(UUID id, boolean overrideSlug);

    boolean setSlug(String slug);

    boolean setSlug(UUID slug);

    boolean setSlug(String slug, boolean overrideId);

    boolean setSlug(UUID slug, boolean overrideId);

    boolean setVersion(String version);

    boolean setOwner(String owner);

    boolean setOwner(UUID owner);

    boolean setContributors(String... contributors);

    boolean setContributors(Collection<String> contributors);

    boolean addContributor(String contributor);

    boolean addContributors(String... contributors);

    boolean addContributors(Collection<String> contributors);

    boolean removeContributor(String contributor);

    boolean removeContributors(String... contributors);

    boolean removeContributors(Collection<String> contributors);

    boolean setResources(HashMap<String, ZyndexResource> resources);

    boolean setResources(ZyndexResource... resources);

    boolean setResources(Collection<ZyndexResource> resources);

    boolean addResource(ZyndexResource resource);

    boolean addResources(ZyndexResource... resources);

    boolean addResources(Collection<ZyndexResource> resources);

    boolean removeResource(ZyndexResource resource);

    boolean removeResource(String identifier);

    boolean removeResources(ZyndexResource... resources);

    boolean removeResources(Collection<ZyndexResource> resources);
}