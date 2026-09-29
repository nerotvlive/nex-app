package com.zyneonstudios.apex.nexapp.integrations.zyndex;

public interface PersistentZyndex extends EditableZyndex {

    boolean load();
    boolean reload();
    boolean save();
}