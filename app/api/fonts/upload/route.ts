import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import clientPromise from '@/lib/mongodb';
import { Binary } from 'mongodb';

export const runtime = "nodejs";

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

    const ext = file.name.split(".").pop()?.toLowerCase() || "ttf";
    const id = randomUUID();
    const arrayBuffer = await file.arrayBuffer();

    // Salva i metadati e il file in MongoDB
    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DB_NAME || 'fonts4tattooing');
    
    // Aggiungi categoria se non esiste
    await db.collection('categories').updateOne(
      { name: category },
      { $setOnInsert: { name: category, createdAt: new Date() } },
      { upsert: true }
    );

    // Aggiungi font
    const newFontDocument = {
      id,
      name,
      category,
      file: `/api/fonts/file/${id}`, // URL per servire il font
      isPremium,
      visible: true,
      supports: { bold: supportsBold, italic: supportsItalic },
      sortOrder: 0,
      createdAt: new Date(),
      // Dati binari del file
      fileData: new Binary(Buffer.from(arrayBuffer)),
      mimeType: file.type || `font/${ext}`,
      originalFilename: file.name,
      fileExtension: ext,
    };

    await db.collection('fonts').insertOne(newFontDocument);

    // Rimuovi i dati binari dalla risposta per efficienza
    // Usando `_` si comunica a ESLint che la variabile è intenzionalmente non usata
    const { fileData: _, ...fontForResponse } = newFontDocument;

    return NextResponse.json({ ok: true, font: fontForResponse });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
  }
}