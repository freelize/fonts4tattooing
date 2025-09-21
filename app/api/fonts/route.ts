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
    console.log('🔍 Tentativo di connessione al database...');
    console.log('MONGODB_URI presente:', !!process.env.MONGODB_URI);
    console.log('MONGODB_DB_NAME:', process.env.MONGODB_DB_NAME);
    
    const client = await clientPromise;
    console.log('✅ Connessione al database riuscita');
    
    const db = client.db(process.env.MONGODB_DB_NAME || 'fonts4tattooing');
    
    // Ottieni le categorie
    console.log('🔍 Recupero categorie...');
    const categories = await db.collection('categories')
      .find({}, { projection: { name: 1, _id: 0 } })
      .toArray();
    console.log('📊 Categorie trovate:', categories.length);
    
    // Ottieni i font (solo quelli visibili per l'API pubblica)
    console.log('🔍 Recupero font...');
    const fonts = await db.collection('fonts')
      .find(
        { visible: { $ne: false } }, // Include font dove visible è true o undefined
        { projection: { _id: 0 } } // Escludi il campo _id di MongoDB
      )
      .sort({ sortOrder: 1, name: 1 })
      .toArray();
    
    console.log('🎨 Font trovati:', fonts.length);
    console.log('📝 Primo font (esempio):', fonts[0] ? JSON.stringify(fonts[0], null, 2) : 'Nessun font trovato');

    return NextResponse.json({
      categories: categories.map(c => c.name),
      fonts: fonts
    }, { status: 200 });
  } catch (error) {
    console.error('❌ Errore database:', error);
    // @ts-ignore
    console.error('Stack trace:', error.stack);
    return NextResponse.json({ 
      // @ts-ignore
      error: 'Database connection failed',
      // @ts-ignore
      message: error.message,
      categories: [], 
      fonts: [] 
    }, { status: 500 });
  }
}