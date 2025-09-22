import { NextResponse } from "next/server";
import clientPromise from '@/lib/mongodb';
import type { NextRequest } from "next/server";
import { cookies } from "next/headers";

export async function GET(req: NextRequest) {
  try {
    console.log('🔍 Tentativo di connessione al database...');
    console.log('MONGODB_URI presente:', !!process.env.MONGODB_URI);
    console.log('MONGODB_DB_NAME:', process.env.MONGODB_DB_NAME);
    
    const client = await clientPromise;
    console.log('✅ Connessione al database riuscita');
    
    const db = client.db(process.env.MONGODB_DB_NAME || 'fonts4tattooing');

    // Determina se includere anche i font nascosti
    const c = await cookies();
    const isAdmin = !!c.get("font4tat_admin");
    const url = new URL(req.url);
    const includeAll = isAdmin || url.searchParams.get("all") === "1";
    
    // Ottieni le categorie
    console.log('🔍 Recupero categorie...');
    const categories = await db.collection('categories')
      .find({}, { projection: { name: 1, _id: 0 } })
      .toArray();
    console.log('📊 Categorie trovate:', categories.length);
    
    // Ottieni i font - includi tutti se admin o all=1, altrimenti solo visibili
    console.log('🔍 Recupero font...');
    const query = includeAll ? {} : { visible: { $ne: false } };
    const fonts = await db.collection('fonts')
      .find(
        query,
        { projection: { _id: 0 } }
      )
      .sort({ sortOrder: 1, name: 1 })
      .toArray();
    
    console.log('🎨 Font trovati:', fonts.length);
    console.log('📝 Primo font (esempio):', fonts[0] ? JSON.stringify(fonts[0], null, 2) : 'Nessun font trovato');

    return NextResponse.json({
      categories: categories.map(c => c.name),
      fonts: fonts
    }, { status: 200 });
  } catch (e) {
    console.error('❌ Errore database:', e);
    let message = 'An unknown error occurred';
    if (e instanceof Error) {
        message = e.message;
        console.error('Stack trace:', e.stack);
    }
    return NextResponse.json({ 
      error: 'Database connection failed',
      message: message,
      categories: [], 
      fonts: [] 
    }, { status: 500 });
  }
}