import { SQLiteProvider, useSQLiteContext } from 'expo-sqlite';
import React from 'react';

export function DatabaseProvider({ children }: { children: React.ReactNode }) {
  // Database initialization: create tables and indexes before screens query them.
  return (
    <SQLiteProvider
      databaseName="idali.db"
      assetSource={{ assetId: require('../../assets/database/idali.db') }}
      onInit={async (db) => {
        await db.execAsync(`
          PRAGMA foreign_keys = ON;
          CREATE TABLE IF NOT EXISTS photos (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id TEXT NOT NULL,
            uri TEXT NOT NULL,
            created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
          );
          CREATE TABLE IF NOT EXISTS layouts (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id TEXT NOT NULL,
            photo_uri TEXT NOT NULL,
            id_size TEXT NOT NULL,
            paper_size TEXT NOT NULL,
            background_color TEXT NOT NULL,
            layout_uri TEXT,
            created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
          );
          CREATE INDEX IF NOT EXISTS layouts_user_created_idx
            ON layouts(user_id, created_at DESC);
        `);
      }}
    >
      {children}
    </SQLiteProvider>
  );
}

// Custom hook to use the database
export function useDatabase() {
  return useSQLiteContext();
}
