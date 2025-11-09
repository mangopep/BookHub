import { MongoClient } from 'mongodb';

const uri = process.env.MONGODB_URI!;
const client = new MongoClient(uri);

async function clearOrders() {
  try {
    await client.connect();
    const db = client.db("bookstore");
    const result = await db.collection("orders").deleteMany({});
    console.log(`Deleted ${result.deletedCount} orders`);
  } finally {
    await client.close();
  }
}

clearOrders();
