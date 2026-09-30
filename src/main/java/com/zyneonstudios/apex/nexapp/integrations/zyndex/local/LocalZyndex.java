package com.zyneonstudios.apex.nexapp.integrations.zyndex.local;

import com.zyneonstudios.apex.nexapp.integrations.zyndex.EditableZyndex;
import com.zyneonstudios.apex.nexapp.integrations.zyndex.resource.ZyndexResource;
import tools.jackson.databind.ObjectMapper;
import tools.jackson.databind.node.ArrayNode;
import tools.jackson.databind.node.ObjectNode;

import java.util.*;

public class LocalZyndex implements EditableZyndex {

    private String title = "New Zyndex";
    private String version = "0.0.1";

    private String id = UUID.randomUUID().toString();
    private String slug = "unknown-zyndex";

    private String owner = "Unknown";
    private ArrayList<String> contributors = new ArrayList<>();
    private HashMap<String, ZyndexResource> resources = new HashMap<>();

    @Override
    public String getTitle() {
        return title;
    }

    @Override
    public boolean setTitle(String title) {
        if (Objects.equals(title, this.title)) {
            return false;
        }
        this.title = title;
        return true;
    }

    @Override
    public String getId() {
        return id;
    }

    @Override
    public boolean setId(String id) {
        return setId(id,false);
    }

    @Override
    public boolean setId(UUID id) {
        return setId(id,false);
    }

    @Override
    public boolean setId(String id, boolean overrideSlug) {
        if (Objects.equals(id, this.id)) {
            return false;
        }
        this.id = id;
        if(overrideSlug) {
            setSlug(id);
        }
        return true;
    }

    @Override
    public boolean setId(UUID id, boolean overrideSlug) {
        return setId(id.toString(),overrideSlug);
    }

    @Override
    public String getSlug() {
        return slug;
    }

    @Override
    public boolean setSlug(String slug) {
        return setSlug(slug,false);
    }

    @Override
    public boolean setSlug(UUID slug) {
        return setSlug(slug.toString(),false);
    }

    @Override
    public boolean setSlug(String slug, boolean overrideId) {
        if (Objects.equals(slug, this.slug)) {
            return false;
        }
        this.slug = slug;
        if(overrideId) {
            setId(slug);
        }
        return true;
    }

    @Override
    public boolean setSlug(UUID slug, boolean overrideId) {
        return setSlug(slug.toString(),overrideId);
    }

    @Override
    public String getVersion() {
        return version;
    }

    @Override
    public boolean setVersion(String version) {
        if (Objects.equals(version, this.version)) {
            return false;
        }
        this.version = version;
        return true;
    }

    @Override
    public String getOwner() {
        return owner;
    }

    @Override
    public boolean setOwner(String owner) {
        if (Objects.equals(owner, this.owner)) {
            return false;
        }
        this.owner = owner;
        return true;
    }

    @Override
    public boolean setOwner(UUID owner) {
        return setOwner(owner.toString());
    }

    @Override
    public String[] getContributors() {
        return contributors.toArray(new String[0]);
    }

    @Override
    public Collection<String> getContributorList() {
        return contributors;
    }

    @Override
    public boolean setContributors(String... contributors) {
        return setContributors(new ArrayList<>(Arrays.asList(contributors)));
    }

    @Override
    public boolean setContributors(Collection<String> contributors) {
        try {
            this.contributors = new ArrayList<>(contributors);
            return true;
        } catch (Exception e) {
            System.err.println("Failed to set contributors for Zyndex "+title+" ("+slug+"/"+id+"): " + e.getMessage());
            return false;
        }
    }

    @Override
    public boolean addContributor(String contributor) {
        if(!contributors.contains(contributor)) {
            contributors.add(contributor);
            return true;
        } else {
            System.err.println("Failed to add contributor "+contributor+" for Zyndex "+title+" ("+slug+"/"+id+"): Contributor already exists");
        }
        return false;
    }

    @Override
    public boolean addContributors(String... contributors) {
        return addContributors(new ArrayList<>(Arrays.asList(contributors)));
    }

    @Override
    public boolean addContributors(Collection<String> contributors) {
        boolean failed = false;
        try {
            for (String contributor : contributors) {
                if (!addContributor(contributor)) {
                    failed = true;
                }
            }
        } catch (Exception e) {
            System.err.println("Failed to add contributors for Zyndex "+title+" ("+slug+"/"+id+"): " + e.getMessage());
            failed = true;
        }
        return !failed;
    }

    @Override
    public boolean removeContributor(String contributor) {
        if(contributors.contains(contributor)) {
            contributors.remove(contributor);
            return true;
        } else {
            System.err.println("Failed to remove contributor "+contributor+" for Zyndex "+title+" ("+slug+"/"+id+"): Contributor does not exist");
        }
        return false;
    }

    @Override
    public boolean removeContributors(String... contributors) {
        return removeContributors(Arrays.asList(contributors));
    }

    @Override
    public boolean removeContributors(Collection<String> contributors) {
        boolean failed = false;
        try {
            for (String contributor : contributors) {
                if (!removeContributor(contributor)) {
                    failed = true;
                }
            }
        } catch (Exception e) {
            System.err.println("Failed to remove contributors for Zyndex "+title+" ("+slug+"/"+id+"): "+e.getMessage());
            failed = true;
        }
        return !failed;
    }

    @Override
    public ZyndexResource getResource(String identifier) {
        return resources.get(identifier);
    }

    @Override
    public Collection<ZyndexResource> getResourceList() {
        return new HashSet<>(resources.values()); // Entfernt die Duplikate
    }

    @Override
    public ZyndexResource[] getResources() {
        return new HashSet<>(resources.values()).toArray(new ZyndexResource[0]);
    }

    @Override
    public boolean setResources(ZyndexResource... resources) {
        return setResources(Arrays.asList(resources));
    }

    @Override
    public boolean setResources(Collection<ZyndexResource> resources) {
        this.resources = new HashMap<>();
        boolean failed = false;
        try {
            for(ZyndexResource resource : resources) {
                if(!addResource(resource)) {
                    failed = true;
                }
            }
        } catch (Exception e) {
            System.err.println("Failed to set resources for Zyndex "+title+" ("+slug+"/"+id+"): " + e.getMessage());
            failed = true;
        }
        return !failed;
    }

    @Override
    public boolean setResources(HashMap<String, ZyndexResource> resources) {
        return setResources(new HashSet<>(resources.values()));
    }

    @Override
    public boolean addResource(ZyndexResource resource) {
        if (resource == null) return false;
        String id = resource.getId();
        String slug = resource.getSlug();
        if(resources.containsKey(id)) {
            System.err.println("Could not add resource " + resource.getTitle() + "(" + slug + "/" + id + "). The ID \"" + id + "\" does already exist in Zyndex " + title + " (" + this.slug + "/" + this.id + ")");
            return false;
        }
        if(resources.containsKey(slug)) {
            System.err.println("Could not add resource " + resource.getTitle() + "(" + slug + "/" + id + "). The Slug \"" + slug + "\" does already exist in Zyndex " + title + " (" + this.slug + "/" + this.id + ")");
            return false;
        }
        resources.put(id, resource);
        resources.put(slug, resource);
        return true;
    }

    @Override
    public boolean addResources(ZyndexResource... resources) {
        return addResources(Arrays.asList(resources));
    }

    @Override
    public boolean addResources(Collection<ZyndexResource> resources) {
        boolean failed = false;
        for(ZyndexResource resource : resources) {
            if(!addResource(resource)) {
                failed = true;
            }
        }
        if(failed) {
            System.err.println("Failed to add resources for Zyndex "+title+" ("+slug+"/"+id+")");
        }
        return !failed;
    }

    @Override
    public boolean removeResource(String identifier) {
        if(resources.containsKey(identifier)) {
            return removeResource(resources.get(identifier));
        }
        System.err.println("Could not remove resource resource with id "+identifier+". It does not exist in Zyndex "+title+" ("+this.slug+"/"+this.id+")");
        return false;
    }

    public boolean removeResource(ZyndexResource resource) {
        if (resource == null) return false;
        return removeResource(resource.getId(), resource);
    }

    private boolean removeResource(String identifier, ZyndexResource resource) {
        if(resources.containsKey(identifier) && resources.get(identifier).equals(resource)) {
            resources.remove(identifier);
            resources.remove(resource.getId());
            resources.remove(resource.getSlug());
            return true;
        }
        System.err.println("Could not remove resource with id "+resource.getTitle()+"("+resource.getSlug()+"/"+identifier+"). It does not exist or matches the given resource in Zyndex "+title+" ("+this.slug+"/"+this.id+")");
        return false;
    }

    @Override
    public boolean removeResources(ZyndexResource... resources) {
        return removeResources(Arrays.asList(resources));
    }

    @Override
    public boolean removeResources(Collection<ZyndexResource> resources) {
        boolean failed = false;
        for(ZyndexResource resource : resources) {
            if(!removeResource(resource)) {
                failed = true;
            }
        }
        if(failed) {
            System.err.println("Failed to remove resources for Zyndex "+title+" ("+slug+"/"+id+")");
        }
        return !failed;
    }

    @Override
    public ObjectNode getJson() {
        ObjectMapper objectMapper = new ObjectMapper();
        ObjectNode json = objectMapper.createObjectNode();
        json.put("title", title);
        json.put("version",version);
        json.put("slug", slug);
        json.put("id", id);
        json.put("owner",owner);

        ArrayNode contributors = objectMapper.valueToTree(this.contributors);
        json.set("contributors", contributors);

        ArrayNode resources = objectMapper.valueToTree(getResourceList());
        json.set("resources", resources);

        return json;
    }
}
