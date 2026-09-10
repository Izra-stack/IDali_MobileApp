import { SQLiteProvider, useSQLiteContext } from 'expo-sqlite';
import React from 'react';

export function DatabaseProvider({ children }: { children: React.ReactNode }) {
  return (
    <SQLiteProvider databaseName="idali.db" assetSource={{ assetId: require('../../assets/database/idali.db') }}>
      {children}
    </SQLiteProvider>
  );
}

// Custom hook to use the database
export function useDatabase() {
  return useSQLiteContext();
}
