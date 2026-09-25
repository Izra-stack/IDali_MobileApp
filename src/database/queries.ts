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

// Common ID and passport standards. Dimensions are kept in millimetres.
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
  { name: '2x2 inches', width_mm: 50.8, height_mm: 50.8, description: 'US visa / passport format' },
  { name: '1x1 inch', width_mm: 25.4, height_mm: 25.4, description: 'Square ID photo' },
  { name: '35x45 mm', width_mm: 35, height_mm: 45, description: 'Passport standard format' },
  { name: '2.5x3.5 cm', width_mm: 25, height_mm: 35, description: 'Common Asian ID format' },
  { name: '2x2 cm', width_mm: 20, height_mm: 20, description: 'Compact square ID size' },
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

// ONLY Custom Package and Mixed Package as requested.
export const ID_PACKAGES: IdPackage[] = [
  {
    id: 'custom-package',
    name: 'Custom Package',
    sizeName: 'Custom size',
    paperSize: 'A4',
    copiesLabel: 'Custom photo dimensions',
    description: 'Configure custom ID photo dimensions and auto-fit on your selected paper size',
  },
  {
    id: 'mixed-package',
    name: 'Mixed Package',
    sizeName: 'Mixed sizes',
    paperSize: 'A4',
    copiesLabel: 'Multiple ID sizes on one sheet',
    description: 'Includes a mix of 2×2", 35×45mm, and 1×1" photos together on one sheet',
    mixed: true,
  },
];

const ID_DIMENSIONS: Record<string, [number, number]> = Object.fromEntries(
  ID_PHOTO_SIZES.flatMap(size => [
    [size.name, [size.width_mm, size.height_mm] as [number, number]],
    [size.name.replaceAll(' inches', '').replaceAll(' inch', ''), [size.width_mm, size.height_mm] as [number, number]],
  ]),
);
ID_DIMENSIONS['2x2 cm'] = [20, 20];

export function parseDimensions(idSize: string): [number, number] {
  if (ID_DIMENSIONS[idSize]) return ID_DIMENSIONS[idSize];
  const customMatch = idSize.match(/^(\d+(?:\.\d+)?)\s*[x×,]\s*(\d+(?:\.\d+)?)(?:\s*mm)?$/i);
  if (customMatch) {
    const w = parseFloat(customMatch[1]);
    const h = parseFloat(customMatch[2]);
    if (!isNaN(w) && !isNaN(h) && w > 0 && h > 0) return [w, h];
  }
  return [50.8, 50.8];
}

// Data structure: paper dimensions in millimetres.
const PAPER_DIMENSIONS: Record<string, [number, number]> = {
  A4: [210, 297],
  '4R': [102, 152],
  Letter: [216, 279],
};

// Function: calculate the centered print grid for the selected paper.
export function getLayoutPlan(idSize: string, paperSize: string) {
  const [photoWidth, photoHeight] = parseDimensions(idSize);
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
  if (packageId === 'mixed-package') {
    const [paperWidth, paperHeight] = PAPER_DIMENSIONS[paperSize] || PAPER_DIMENSIONS.A4;
    const marginX = 10;
    const sectionGap = 12;
    const size = (name: string) => {
      const [width, height] = parseDimensions(name);
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
      ...getLayoutPlan('2x2 inches', paperSize),
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
  return getLayoutPlan(idSize, paperSize);
}
