import { MongoClient } from 'mongodb';

const uri = process.env.MONGODB_URI!;
const client = new MongoClient(uri);

async function clearBooks() {
  try {
    await client.connect();
    const db = client.db("bookstore");
    const result = await db.collection("books").deleteMany({});
    console.log(`Deleted ${result.deletedCount} books`);
  } finally {
    await client.close();
  }
}

clearBooks();
