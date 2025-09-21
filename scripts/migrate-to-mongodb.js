const { MongoClient } = require('mongodb');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: '../.env.local' });

// Usa le variabili d'ambiente invece di credenziali hardcoded
const MONGODB_URI = process.env.MONGODB_URI;
const DB_NAME = process.env.MONGODB_DB_NAME || 'fonts4tattooing';

if (!MONGODB_URI) {
  console.error('MONGODB_URI non trovato nelle variabili d\'ambiente');
  process.exit(1);
}

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