import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import fs from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";

export const runtime = "nodejs";

const dataPath = path.join(process.cwd(), "data", "fonts.json");
const fontsDir = path.join(process.cwd(), "public", "fonts");

export async function POST(req: Request) {
  const cookieStore = await cookies();
  const cookie = cookieStore.get("font4tat_admin");
  if (!cookie) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const form = await req.formData();
  const file = form.get("file") as File | null;
  const name = String(form.get("name") || "");
  const category = String(form.get("category") || "");
  const isPremium = String(form.get("isPremium") || "false") === "true";
  const supportsBold = String(form.get("supportsBold") || "true") === "true";
  const supportsItalic = String(form.get("supportsItalic") || "true") === "true";

  if (!file || !name || !category) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  await fs.mkdir(fontsDir, { recursive: true });
  const ext = file.name.split(".").pop()?.toLowerCase() || "ttf";
  const id = randomUUID();
  const fileName = `${id}.${ext}`;
  const filePath = path.join(fontsDir, fileName);

  const arrayBuffer = await file.arrayBuffer();
  await fs.writeFile(filePath, Buffer.from(arrayBuffer));

  // Update JSON database
  let db = { categories: [], fonts: [] as any[] } as any;
  try {
    const content = await fs.readFile(dataPath, "utf-8");
    db = JSON.parse(content);
  } catch {}

  if (!db.categories.includes(category)) db.categories.push(category);
  db.fonts.push({ id, name, category, file: `/fonts/${fileName}`, isPremium, supports: { bold: supportsBold, italic: supportsItalic } });
  await fs.writeFile(dataPath, JSON.stringify(db, null, 2), "utf-8");

  return NextResponse.json({ ok: true });
}