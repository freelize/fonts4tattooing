const { MongoClient } = require('mongodb');
const fs = require('fs');
const path = require('path');

// Configura la tua connection string
const MONGODB_URI = 'mongodb+srv://niccangiano_db_user:gdAlX5ewSGJM8fbZ@fonts4tattooing.ixpevsz.mongodb.net/?retryWrites=true&w=majority&appName=Fonts4tattooing';
const DB_NAME = 'fonts4tattooing';

async function migrateFonts() {
  const client = new MongoClient(MONGODB_URI);
  
  try {
    await client.connect();
    console.log('Connesso a MongoDB');
    
    const db = client.db(DB_NAME);
    
    // Leggi il file fonts.json esistente
    const fontsJsonPath = path.join(__dirname, '..', 'data', 'fonts.json');
    const fontsData = JSON.parse(fs.readFileSync(fontsJsonPath, 'utf8'));
    
    // Migra le categorie
    console.log('Migrando categorie...');
    const categories = fontsData.categories.map(cat => ({
      name: cat,
      createdAt: new Date()
    }));
    
    if (categories.length > 0) {
      await db.collection('categories').insertMany(categories);
      console.log(`Migrate ${categories.length} categorie`);
    }
    
    // Migra i font
    console.log('Migrando font...');
    const fonts = fontsData.fonts.map(font => ({
      ...font,
      visible: font.visible !== false, // Default a true se non specificato
      createdAt: new Date()
    }));
    
    if (fonts.length > 0) {
      await db.collection('fonts').insertMany(fonts);
      console.log(`Migrati ${fonts.length} font`);
    }
    
    console.log('Migrazione completata con successo!');
    
  } catch (error) {
    console.error('Errore durante la migrazione:', error);
  } finally {
    await client.close();
  }
}

migrateFonts();