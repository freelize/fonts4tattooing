import { NextResponse } from "next/server";
import clientPromise from '@/lib/mongodb';

// Rimuovi questa interfaccia non utilizzata
// interface Font {
//   id: string;
//   name: string;
//   category: string;
//   file: string;
//   isPremium?: boolean;
//   visible?: boolean;
//   supports?: { bold?: boolean; italic?: boolean };
//   sortOrder?: number;
// }

export async function GET() {
  try {
    const client = await clientPromise;
    const db = client.db(process.env.MONGODB_DB_NAME || 'fonts4tattooing');
    
    // Ottieni le categorie
    const categories = await db.collection('categories')
      .find({}, { projection: { name: 1, _id: 0 } })
      .toArray();
    
    // Ottieni i font (solo quelli visibili per l'API pubblica)
    const fonts = await db.collection('fonts')
      .find(
        { visible: { $ne: false } }, // Include font dove visible è true o undefined
        { projection: { _id: 0 } } // Escludi il campo _id di MongoDB
      )
      .sort({ sortOrder: 1, name: 1 })
      .toArray();

    return NextResponse.json({
      categories: categories.map(c => c.name),
      fonts: fonts
    }, { status: 200 });
  } catch (error) {
    console.error('Database error:', error);
    return NextResponse.json({ categories: [], fonts: [] }, { status: 200 });
  }
}