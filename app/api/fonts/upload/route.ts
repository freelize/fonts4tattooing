import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import fs from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import clientPromise from '@/lib/mongodb';

export const runtime = "nodejs";

const fontsDir = path.join(process.cwd(), "public", "fonts");

type FontData = {
  id: string;
  name: string;
  category: string;
  file: string;
  isPremium?: boolean;
  visible?: boolean;
  supports?: { bold?: boolean; italic?: boolean };
  sortOrder?: number;
  createdAt: Date;
};

export async function POST(req: Request) {
  const cookieStore = await cookies();
  const cookie = cookieStore.get("font4tat_admin");
  if (!cookie) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
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

    // Crea la directory fonts se non esiste
    await fs.mkdir(fontsDir, { recursive: true });
    
    // Salva il file nel filesystem
    const ext = file.name.split(".").pop()?.toLowerCase() || "ttf";
    const id = randomUUID();
    const fileName = `${id}.${ext}`;
    const filePath = path.join(fontsDir, fileName);

    const arrayBuffer = await file.arrayBuffer();
    await fs.writeFile(filePath, Buffer.from(arrayBuffer));

    // Salva i metadati in MongoDB
    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DB_NAME || 'fonts4tattooing');
    
    // Aggiungi categoria se non esiste
    await db.collection('categories').updateOne(
      { name: category },
      { $setOnInsert: { name: category, createdAt: new Date() } },
      { upsert: true }
    );

    // Aggiungi font
    const fontData: FontData = {
      id,
      name,
      category,
      file: `/fonts/${fileName}`,
      isPremium,
      visible: true,
      supports: { bold: supportsBold, italic: supportsItalic },
      sortOrder: 0,
      createdAt: new Date()
    };

    await db.collection('fonts').insertOne(fontData);

    return NextResponse.json({ ok: true, font: fontData });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
  }
}