import { MongoClient, type Db } from "mongodb";

const uri = process.env.MONGODB_URI;
const dbName = process.env.MONGODB_DB ?? "carpool";

if (!uri) {
  throw new Error("Missing MONGODB_URI. Add it to your environment variables.");
}

type MongoGlobal = {
  mongoClient?: MongoClient;
  mongoClientPromise?: Promise<MongoClient>;
};

const globalForMongo = globalThis as typeof globalThis & MongoGlobal;

const client = globalForMongo.mongoClient ?? new MongoClient(uri);

if (process.env.NODE_ENV !== "production") {
  globalForMongo.mongoClient = client;
}

const mongoClientPromise = globalForMongo.mongoClientPromise ?? client.connect();

if (process.env.NODE_ENV !== "production") {
  globalForMongo.mongoClientPromise = mongoClientPromise;
}

export const db = client.db(dbName);

export async function getDb(): Promise<Db> {
  const connectedClient = await mongoClientPromise;
  return connectedClient.db(dbName);
}
