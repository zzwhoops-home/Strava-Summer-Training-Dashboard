const { MongoClient } = require("mongodb");

if (!process.env.DB_URI) {
    throw new Error('No URI found in .env');
}
const uri = process.env.DB_URI;
let client;
let clientPromise;

if (process.env.NODE_ENV !== 'production') {
    client = new MongoClient(uri);
    global._mongoClientPromise = client.connect();
    clientPromise = global._mongoClientPromise;
} else {
    client = new MongoClient(uri);
    clientPromise = client.connect();
}

export default clientPromise;