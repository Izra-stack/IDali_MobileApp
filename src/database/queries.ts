import type { SQLiteDatabase } from 'expo-sqlite';

// Data structure: one locally saved layout record.
export type SavedLayout = {
  id: number;
  user_id: string;
  photo_uri: string;
  id_size: string;
  paper_size: string;
  background_color: string;
  layout_uri: string | null;
  created_at: string;
};

// Function: insert a layout owned by the signed-in user.
export async function saveLayout(
  db: SQLiteDatabase,
  layout: Omit<SavedLayout, 'id' | 'created_at'>,
) {
  const result = await db.runAsync(
    `INSERT INTO layouts
      (user_id, photo_uri, id_size, paper_size, background_color, layout_uri)
     VALUES (?, ?, ?, ?, ?, ?)`,
    layout.user_id,
    layout.photo_uri,
    layout.id_size,
    layout.paper_size,
    layout.background_color,
    layout.layout_uri,
  );
  return result.lastInsertRowId;
}

// Function: retrieve the newest layouts for one user.
export function getLayouts(db: SQLiteDatabase, userId: string) {
  return db.getAllAsync<SavedLayout>(
    'SELECT * FROM layouts WHERE user_id = ? ORDER BY datetime(created_at) DESC',
    userId,
  );
}

// Function: delete only the requested user's layout.
export function deleteLayout(db: SQLiteDatabase, id: number, userId: string) {
  return db.runAsync('DELETE FROM layouts WHERE id = ? AND user_id = ?', id, userId);
}

// Data structure: print dimensions in millimetres for supported ID formats.
const ID_DIMENSIONS: Record<string, [number, number]> = {
  '1x1': [25.4, 25.4],
  '2x2': [50.8, 50.8],
  Passport: [35, 45],
  'Passport Size': [35, 45],
};

// Data structure: paper dimensions in millimetres.
const PAPER_DIMENSIONS: Record<string, [number, number]> = {
  A4: [210, 297],
  '4R': [102, 152],
  Letter: [216, 279],
};

// Function: calculate the centered print grid for the selected paper.
export function getLayoutPlan(idSize: string, paperSize: string) {
  const [photoWidth, photoHeight] = ID_DIMENSIONS[idSize] || ID_DIMENSIONS['2x2'];
  const [paperWidth, paperHeight] = PAPER_DIMENSIONS[paperSize] || PAPER_DIMENSIONS.A4;
  const margin = 10;
  const gap = 3;
  const columns = Math.max(1, Math.floor((paperWidth - margin * 2 + gap) / (photoWidth + gap)));
  const rows = Math.max(1, Math.floor((paperHeight - margin * 2 + gap) / (photoHeight + gap)));

  return {
    photoWidth,
    photoHeight,
    paperWidth,
    paperHeight,
    columns,
    rows,
    copies: columns * rows,
  };
}
