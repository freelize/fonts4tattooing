const { MongoClient } = require('mongodb');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env.local') });

const uri = process.env.MONGODB_URI;
const dbName = process.env.MONGODB_DB_NAME || 'fonts4tattooing';

console.log('Testing connection to:', uri ? uri.replace(/:([^:@]+)@/, ':****@') : 'undefined');

if (!uri) {
  console.error('URI not found in .env.local');
  process.exit(1);
}

async function run() {
  const client = new MongoClient(uri);
  try {
    console.log('Connecting...');
    await client.connect();
    console.log('Connected successfully to server');
    
    const db = client.db(dbName);
    const count = await db.collection('fonts').countDocuments();
    console.log(`Found ${count} fonts in collection 'fonts'`);
    
    if (count > 0) {
      const font = await db.collection('fonts').findOne();
      console.log('Sample font:', font.name);
    } else {
        console.log('No fonts found. Is the database empty?');
    }

  } catch (err) {
    console.error('Connection failed:', err.message);
    console.log('Full error:', err);
  } finally {
    await client.close();
  }
}

run();