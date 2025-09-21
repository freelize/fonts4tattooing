import { NextResponse } from "next/server";
import fs from "node:fs/promises";
import path from "node:path";

const dataPath = path.join(process.cwd(), "data", "fonts.json");

export async function GET() {
  try {
    const content = await fs.readFile(dataPath, "utf-8");
    const json = JSON.parse(content);
    
    // Ordina i font per sortOrder, poi per nome se sortOrder non è definito
    if (json.fonts && Array.isArray(json.fonts)) {
      json.fonts.sort((a: any, b: any) => {
        if (a.sortOrder !== undefined && b.sortOrder !== undefined) {
          return a.sortOrder - b.sortOrder;
        }
        if (a.sortOrder !== undefined) return -1;
        if (b.sortOrder !== undefined) return 1;
        return a.name.localeCompare(b.name);
      });
    }
    
    return NextResponse.json(json, { status: 200 });
  } catch {
    return NextResponse.json({ categories: [], fonts: [] }, { status: 200 });
  }
}