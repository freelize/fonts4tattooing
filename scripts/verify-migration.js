const { MongoClient } = require('mongodb');

const MONGODB_URI = 'mongodb+srv://niccangiano_db_user:gdAlX5ewSGJM8fbZ@fonts4tattooing.ixpevsz.mongodb.net/?retryWrites=true&w=majority&appName=Fonts4tattooing';
const DB_NAME = 'fonts4tattooing';

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