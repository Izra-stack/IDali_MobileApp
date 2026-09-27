// Web mock for expo-sqlite to bypass experimental Metro web worker chunk errors
import React from 'react';

export function SQLiteProvider({ children }) {
  return <>{children}</>;
}

export function useSQLiteContext() {
  return {
    execAsync: async () => {},
    runAsync: async () => ({ lastInsertRowId: 1, changes: 1 }),
    getFirstAsync: async () => null,
    getAllAsync: async () => [],
    eachAsync: async () => {},
  };
}

export default {
  SQLiteProvider,
  useSQLiteContext,
};
