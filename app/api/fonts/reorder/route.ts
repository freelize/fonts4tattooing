import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";

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

  if (!Array.isArray(payload.fontIds) || payload.fontIds.length === 0) {
    return NextResponse.json({ error: "fontIds array is required" }, { status: 400 });
  }

  try {
    const { db } = await connectToDatabase();
    
    // Prepare bulk operations
    const bulkOps = payload.fontIds.map((fontId, index) => ({
      updateOne: {
        filter: { id: fontId },
        update: { $set: { sortOrder: index } }
      }
    }));

    // Execute bulk update
    const result = await db.collection("fonts").bulkWrite(bulkOps);
    
    if (result.modifiedCount === 0) {
      return NextResponse.json({ error: "No fonts were updated" }, { status: 404 });
    }

    // If category is provided, also update the categories collection
    if (payload.category) {
      await db.collection("categories").updateOne(
        { name: payload.category },
        { $set: { name: payload.category } },
        { upsert: true }
      );
    }

    return NextResponse.json({ 
      success: true, 
      modifiedCount: result.modifiedCount 
    });
  } catch (error) {
    console.error("Error reordering fonts:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}