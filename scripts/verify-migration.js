const { MongoClient } = require('mongodb');
require('dotenv').config({ path: '../.env.local' });

const MONGODB_URI = process.env.MONGODB_URI;
const DB_NAME = process.env.MONGODB_DB_NAME || 'fonts4tattooing';

if (!MONGODB_URI) {
  console.error('MONGODB_URI non trovato nelle variabili d\'ambiente');
  process.exit(1);
}

async function verifyMigration() {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    const db = client.db(DB_NAME);
    
    const categoriesCount = await db.collection('categories').countDocuments();
    const fontsCount = await db.collection('fonts').countDocuments();
    
    console.log(`Categorie in MongoDB: ${categoriesCount}`);
    console.log(`Font in MongoDB: ${fontsCount}`);
    
    // Mostra alcune categorie
    const categories = await db.collection('categories').find({}).toArray();
    console.log('Categorie:', categories.map(c => c.name));
    
    // Mostra alcuni font
    const sampleFonts = await db.collection('fonts').find({}).limit(5).toArray();
    console.log('Primi 5 font:', sampleFonts.map(f => f.name));
    
  } catch (error) {
    console.error('Errore:', error);
  } finally {
    await client.close();
  }
}

verifyMigration();