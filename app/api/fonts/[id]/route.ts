import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import fs from "node:fs/promises";
import path from "node:path";

const dataPath = path.join(process.cwd(), "data", "fonts.json");
const publicDir = path.join(process.cwd(), "public");

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const cookieStore = await cookies();
  const cookie = cookieStore.get("font4tat_admin");
  if (!cookie) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const id = params.id;
  let payload: any = {};
  try {
    payload = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  let db: any = { categories: [], fonts: [] };
  try {
    const content = await fs.readFile(dataPath, "utf-8");
    db = JSON.parse(content);
  } catch {
    return NextResponse.json({ error: "Database not found" }, { status: 500 });
  }

  const idx = db.fonts.findIndex((f: any) => f.id === id);
  if (idx === -1) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const current = db.fonts[idx];
  const updated = { ...current } as any;

  if (typeof payload.name === "string") updated.name = payload.name;
  if (typeof payload.category === "string") {
    updated.category = payload.category;
    if (!db.categories.includes(payload.category)) db.categories.push(payload.category);
  }
  if (typeof payload.isPremium === "boolean") updated.isPremium = payload.isPremium;
  if (typeof payload.visible === "boolean") updated.visible = payload.visible;

  if (!updated.supports) updated.supports = {};
  if (typeof payload.supportsBold === "boolean") updated.supports.bold = payload.supportsBold;
  if (typeof payload.supportsItalic === "boolean") updated.supports.italic = payload.supportsItalic;

  db.fonts[idx] = updated;
  await fs.writeFile(dataPath, JSON.stringify(db, null, 2), "utf-8");
  return NextResponse.json({ font: updated }, { status: 200 });
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const cookieStore = await cookies();
  const cookie = cookieStore.get("font4tat_admin");
  if (!cookie) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const id = params.id;

  let db: any = { categories: [], fonts: [] };
  try {
    const content = await fs.readFile(dataPath, "utf-8");
    db = JSON.parse(content);
  } catch {
    return NextResponse.json({ error: "Database not found" }, { status: 500 });
  }

  const idx = db.fonts.findIndex((f: any) => f.id === id);
  if (idx === -1) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const font = db.fonts[idx];
  db.fonts.splice(idx, 1);
  await fs.writeFile(dataPath, JSON.stringify(db, null, 2), "utf-8");

  // Try to delete the file from public
  try {
    const rel = String(font.file || '').replace(/^\/+/, "");
    const fp = path.join(publicDir, rel);
    await fs.unlink(fp);
  } catch {
    // ignore if file missing
  }

  return NextResponse.json({ ok: true }, { status: 200 });
}