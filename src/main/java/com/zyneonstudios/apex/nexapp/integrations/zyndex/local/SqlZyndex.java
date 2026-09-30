package com.zyneonstudios.apex.nexapp.integrations.zyndex.local;

import com.zyneonstudios.apex.nexapp.integrations.zyndex.PersistentZyndex;

import java.sql.Connection;

public class SqlZyndex extends LocalZyndex implements PersistentZyndex {

    private Connection sqlConnection;
    private final String prefix;

    public SqlZyndex(Connection sqlConnection) {
        this.sqlConnection = sqlConnection;
        this.prefix = "zdx_";
    }

    public SqlZyndex(Connection sqlConnection, String prefix) {
        this.sqlConnection = sqlConnection;
        this.prefix = prefix;
    }

    public Connection getSqlConnection() {
        return sqlConnection;
    }

    public void setSqlConnection(Connection sqlConnection) {
        this.sqlConnection = sqlConnection;
    }

    public String getPrefix() {
        return prefix;
    }

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
