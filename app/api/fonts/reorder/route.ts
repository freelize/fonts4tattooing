import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import fs from "node:fs/promises";
import path from "node:path";

const dataPath = path.join(process.cwd(), "data", "fonts.json");

type FontData = {
  id: string;
  name: string;
  category: string;
  file: string;
  isPremium?: boolean;
  visible?: boolean;
  supports?: { bold?: boolean; italic?: boolean };
  sortOrder?: number;
};

type DatabaseSchema = {
  categories: string[];
  fonts: FontData[];
};

export async function POST(req: NextRequest) {
  const cookieStore = await cookies();
  const cookie = cookieStore.get("font4tat_admin");
  if (!cookie) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let payload: { fontIds: string[]; category?: string } = { fontIds: [] };
  try {
    payload = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  let db: DatabaseSchema = { categories: [], fonts: [] };
  try {
    const content = await fs.readFile(dataPath, "utf-8");
    db = JSON.parse(content) as DatabaseSchema;
  } catch {
    return NextResponse.json({ error: "Database not found" }, { status: 500 });
  }

  // Riordina i font secondo l'array ricevuto
  payload.fontIds.forEach((fontId, index) => {
    const fontIndex = db.fonts.findIndex(f => f.id === fontId);
    if (fontIndex !== -1) {
      // Se è specificata una categoria, riordina solo all'interno di quella categoria
      if (payload.category) {
        const categoryFonts = db.fonts.filter(f => f.category === payload.category);
        const baseSortOrder = Math.min(...categoryFonts.map(f => f.sortOrder || 0));
        db.fonts[fontIndex].sortOrder = baseSortOrder + index;
      } else {
        // Riordinamento globale
        db.fonts[fontIndex].sortOrder = index + 1;
      }
    }
  });

  await fs.writeFile(dataPath, JSON.stringify(db, null, 2), "utf-8");
  return NextResponse.json({ success: true });
}