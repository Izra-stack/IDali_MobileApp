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
  package_id: string | null;
  created_at: string;
};

// Function: insert a layout owned by the signed-in user.
export async function saveLayout(
  db: SQLiteDatabase,
  layout: Omit<SavedLayout, 'id' | 'created_at'>,
) {
  const result = await db.runAsync(
    `INSERT INTO layouts
      (user_id, photo_uri, id_size, paper_size, background_color, layout_uri, package_id)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    layout.user_id,
    layout.photo_uri,
    layout.id_size,
    layout.paper_size,
    layout.background_color,
    layout.layout_uri,
    layout.package_id,
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

// Common ID and passport standards. Dimensions are kept in millimetres so the
// same catalog drives the selector, preview, saved layouts, and PDF export.
export type IdPhotoSize = {
  name: string;
  width_mm: number;
  height_mm: number;
  description: string;
};

export type LayoutSlot = {
  photoWidth: number;
  photoHeight: number;
  left: number;
  top: number;
};

export type PackagePlan = ReturnType<typeof getLayoutPlan>;

export const ID_PHOTO_SIZES: IdPhotoSize[] = [
  { name: '1x1 inch', width_mm: 25.4, height_mm: 25.4, description: 'Square photo' },
  { name: '2x2 inches', width_mm: 50.8, height_mm: 50.8, description: 'US visa / passport' },
  { name: '2x2 cm', width_mm: 20, height_mm: 20, description: 'Compact square ID size' },
  { name: '35x45 mm', width_mm: 35, height_mm: 45, description: 'Passport standard' },
  { name: '2.5x3.5 cm', width_mm: 25, height_mm: 35, description: 'Common Asian ID size' },
  { name: '30x40 mm', width_mm: 30, height_mm: 40, description: 'European ID standard' },
  { name: '40x50 mm', width_mm: 40, height_mm: 50, description: 'Large passport photo' },
  { name: '45x35 mm', width_mm: 45, height_mm: 35, description: 'Landscape passport photo' },
];

export type IdPackage = {
  id: string;
  name: string;
  sizeName: string;
  paperSize: string;
  copiesLabel: string;
  description: string;
  mixed?: boolean;
};

export const ID_PACKAGES: IdPackage[] = [
  { id: '1x1-package', name: '1×1 ID Package', sizeName: '1x1 inch', paperSize: 'A4', copiesLabel: '60 copies on A4', description: 'Small square photos for cards and forms' },
  { id: '2x2-package', name: '2×2 ID Package', sizeName: '2x2 inches', paperSize: 'A4', copiesLabel: '12 copies on A4', description: 'US visa and passport format' },
  { id: '2x2-cm-package', name: '2×2 cm Package', sizeName: '2x2 cm', paperSize: 'A4', copiesLabel: '63 copies on A4', description: 'Compact square ID photos' },
  { id: '2.5x3.5-package', name: '2.5×3.5 cm Package', sizeName: '2.5x3.5 cm', paperSize: 'A4', copiesLabel: '40 copies on A4', description: 'Common Asian ID format' },
  { id: '35x45-package', name: '35×45 mm Package', sizeName: '35x45 mm', paperSize: 'A4', copiesLabel: '32 copies on A4', description: 'Passport and European ID format' },
  { id: 'mixed-package', name: 'Mixed Package', sizeName: 'Mixed sizes', paperSize: 'A4', copiesLabel: '11 photos on A4', description: 'A practical mix of common ID sizes', mixed: true },
  { id: 'a4-package', name: 'A4 ID Package', sizeName: 'Selected size', paperSize: 'A4', copiesLabel: 'Auto-fit on A4', description: 'Automatically fill an A4 sheet' },
];

const ID_DIMENSIONS: Record<string, [number, number]> = Object.fromEntries(
  ID_PHOTO_SIZES.flatMap(size => [
    [size.name, [size.width_mm, size.height_mm] as [number, number]],
    [size.name.replaceAll(' inches', '').replaceAll(' inch', ''), [size.width_mm, size.height_mm] as [number, number]],
  ]),
);
ID_DIMENSIONS['2x2 cm'] = [20, 20];

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
  const marginX = (paperWidth - columns * photoWidth - (columns - 1) * gap) / 2;
  const marginY = (paperHeight - rows * photoHeight - (rows - 1) * gap) / 2;
  const slots: LayoutSlot[] = Array.from({ length: columns * rows }, (_, index) => ({
    photoWidth,
    photoHeight,
    left: marginX + (index % columns) * (photoWidth + gap),
    top: marginY + Math.floor(index / columns) * (photoHeight + gap),
  }));

  return {
    photoWidth,
    photoHeight,
    paperWidth,
    paperHeight,
    columns,
    rows,
    copies: columns * rows,
    marginX,
    marginY,
    gap,
    slots,
  };
}

// Build a printable package plan. Mixed packages use fixed, measured slots;
// all other packages use the normal automatic fit calculation.
export function getPackagePlan(packageId: string | undefined, idSize: string, paperSize = 'A4') {
  if (packageId !== 'mixed-package') return getLayoutPlan(idSize, paperSize);
  const [paperWidth, paperHeight] = PAPER_DIMENSIONS.A4;
  const marginX = 10;
  const sectionGap = 12;
  const size = (name: string) => {
    const [width, height] = ID_DIMENSIONS[name] || ID_DIMENSIONS['2x2'];
    return { width, height };
  };
  const slots: LayoutSlot[] = [];
  const addRow = (name: string, count: number, top: number, gap: number) => {
    const { width, height } = size(name);
    for (let index = 0; index < count; index += 1) {
      slots.push({ photoWidth: width, photoHeight: height, left: marginX + index * (width + gap), top });
    }
    return height;
  };
  const row1 = addRow('2x2 inches', 2, 18, 6);
  const row2Top = 18 + row1 + sectionGap;
  const row2 = addRow('35x45 mm', 4, row2Top, 6);
  const row3Top = row2Top + row2 + sectionGap;
  addRow('1x1 inch', 5, row3Top, 6);
  return {
    ...getLayoutPlan('2x2 inches', 'A4'),
    paperWidth,
    paperHeight,
    columns: 0,
    rows: 0,
    copies: slots.length,
    marginX,
    marginY: 18,
    slots,
  };
}
