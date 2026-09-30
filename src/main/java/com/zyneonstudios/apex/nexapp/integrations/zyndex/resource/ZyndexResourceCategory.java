package com.zyneonstudios.apex.nexapp.integrations.zyndex.resource;

public interface ZyndexResourceCategory {

    static ZyndexResourceCategory getFromType(ZyndexResourceCategoryType type) {
        String slug = type.toString().toLowerCase();
        String title;
        if (slug.isBlank()) {
            title = null;
        } else {
            title = slug.substring(0, 1).toUpperCase() + slug.substring(1);
        }

        return new ZyndexResourceCategory() {
            @Override
            public String getTitle() {
                return title;
            }

            @Override @Deprecated
            public String getId() {
                return slug;
            }

            @Override
            public String getSlug() {
                return slug;
            }

            @Override
            public ZyndexResourceCategoryType getType() {
                return type;
            }
        };
    }

    String getTitle();
    String getId();
    String getSlug();
    ZyndexResourceCategoryType getType();

    enum ZyndexResourceCategoryType {

        CUSTOM,
        LIBRARY
    }
}