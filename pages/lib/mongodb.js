const { MongoClient } = require("mongodb");

const uri = process.env.DB_URI;

if (!process.env.DB_URI) {
    throw new Error('No URI found in .env');
}

if (!global._mongoClientPromise) {
    let client = new MongoClient(uri);
    global._mongoClientPromise = client.connect();
}
let clientPromise = global._mongoClientPromise;

/*
const client = new MongoClient(uri);
let clientPromise = client.connect();
*/
export default clientPromise;