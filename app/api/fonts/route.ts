import { NextResponse } from "next/server";
import fs from "node:fs/promises";
import path from "node:path";

const dataPath = path.join(process.cwd(), "data", "fonts.json");

export async function GET() {
  try {
    const content = await fs.readFile(dataPath, "utf-8");
    const json = JSON.parse(content);
    return NextResponse.json(json, { status: 200 });
  } catch {
    return NextResponse.json({ categories: [], fonts: [] }, { status: 200 });
  }
}