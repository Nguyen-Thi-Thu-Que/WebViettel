const mongoose = require('mongoose');
require('dotenv').config();

const uri = process.env.MONGO_URI || process.env.MONGODB_URI;

mongoose.connect(uri, { dbName: 'goicuocviettel' })
  .then(async () => {
    console.log("Connected successfully to database goicuocviettel!");
    const db = mongoose.connection.db;
    
    const collections = await db.listCollections().toArray();
    console.log("Collections:", collections.map(c => c.name));
    
    for (const coll of collections) {
      const count = await db.collection(coll.name).countDocuments();
      console.log(`Collection ${coll.name} has ${count} documents.`);
      const samples = await db.collection(coll.name).find({}).limit(1).toArray();
      console.log(`Sample document from ${coll.name}:`, JSON.stringify(samples, null, 2));
    }
    
    await mongoose.disconnect();
    process.exit(0);
  })
  .catch(err => {
    console.error("Connection error:", err);
    process.exit(1);
  });
