import { MongoClient } from 'mongodb';

const uri = process.env.DB_URI;
let client;
let clientPromise;

if (!process.env.DB_URI) {
    throw new Error('No URI found in .env');
}

if (process.env.NODE_ENV == 'development') {
    if (!global._mongoClientPromise) {
        client = new MongoClient(uri);
        global._mongoClientPromise = client.connect();
    }
    clientPromise = global._mongoClientPromise;
} else {
    client = new MongoClient(uri);
    clientPromise = client.connect();
}

export default clientPromise;