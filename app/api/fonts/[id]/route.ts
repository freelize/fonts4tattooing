import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";

type FontData = {
  id: string;
  name: string;
  category: string;
  file: string;
  isPremium?: boolean;
  visible?: boolean;
  supports?: { bold?: boolean; italic?: boolean };
  rating?: number;
  reviewsCount?: number;
  sortOrder?: number;
};

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const cookieStore = await cookies();
  const cookie = cookieStore.get("font4tat_admin");
  if (!cookie) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = params;
  let payload: Partial<FontData> & { supportsBold?: boolean; supportsItalic?: boolean } = {};
  try {
    payload = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  // Prepare update document
  const setDoc: Partial<FontData> = {};
  
  if (payload.name !== undefined) setDoc.name = payload.name;
  if (payload.category !== undefined) setDoc.category = payload.category;
  if (payload.isPremium !== undefined) setDoc.isPremium = payload.isPremium;
  if (payload.visible !== undefined) setDoc.visible = payload.visible;
  if (payload.rating !== undefined) setDoc.rating = payload.rating;
  if (payload.reviewsCount !== undefined) setDoc.reviewsCount = payload.reviewsCount;
  
  // Handle supports object
  if (payload.supportsBold !== undefined || payload.supportsItalic !== undefined) {
    setDoc.supports = {};
    if (payload.supportsBold !== undefined) setDoc.supports.bold = payload.supportsBold;
    if (payload.supportsItalic !== undefined) setDoc.supports.italic = payload.supportsItalic;
  }

  if (Object.keys(setDoc).length === 0) {
    return NextResponse.json({ error: "No valid fields to update" }, { status: 400 });
  }

  try {
    const { db } = await connectToDatabase();
    const result = await db.collection("fonts").findOneAndUpdate(
      { id },
      { $set: setDoc },
      { returnDocument: "after" }
    );

    if (!result) {
      return NextResponse.json({ error: "Font not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, font: result });
  } catch (error) {
    console.error("Error updating font:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const cookieStore = await cookies();
  const cookie = cookieStore.get("font4tat_admin");
  if (!cookie) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = params;

  try {
    const { db } = await connectToDatabase();
    
    // Find the font first to get file path for cleanup
    const font = await db.collection("fonts").findOne({ id });
    if (!font) {
      return NextResponse.json({ error: "Font not found" }, { status: 404 });
    }

    // Delete from database
    const result = await db.collection("fonts").deleteOne({ id });
    
    if (result.deletedCount === 0) {
      return NextResponse.json({ error: "Font not found" }, { status: 404 });
    }

    // Note: File cleanup in production should be handled differently
    // For now, we'll just delete from database
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting font:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}