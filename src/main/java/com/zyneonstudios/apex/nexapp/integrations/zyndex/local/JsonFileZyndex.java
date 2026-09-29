package com.zyneonstudios.apex.nexapp.integrations.zyndex.local;

import com.zyneonstudios.apex.nexapp.integrations.zyndex.PersistentZyndex;

public class JsonFileZyndex extends LocalZyndex implements PersistentZyndex {

    @Override @Deprecated
    public boolean load() {
        return reload();
    }

    @Override
    public boolean reload() {
        return false;
    }

    @Override
    public boolean save() {
        return false;
    }
}