import 'dotenv/config'
import { MongoClient, ServerApiVersion } from 'mongodb';

const uri = process.env.MONGO_URI;

// Create a MongoClient
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

// Sample student data
const sampleStudents = [
  { name: "Alice Johnson", age: 20, grade: "A" },
  { name: "Bob Smith", age: 19, grade: "B+" },
  { name: "Charlie Brown", age: 21, grade: "A-" },
  { name: "Diana Prince", age: 18, grade: "A+" },
  { name: "Ethan Hunt", age: 22, grade: "B" },
  { name: "Fiona Gallagher", age: 19, grade: "B-" },
  { name: "George Washington", age: 20, grade: "A" },
  { name: "Hannah Montana", age: 18, grade: "C+" }
];

async function seedDatabase() {
  try {
    // Connect to MongoDB
    await client.connect();
    console.log("Connected to MongoDB Atlas!");

    const db = client.db("school");
    const collection = db.collection("students");

    // Check if students already exist
    const existingCount = await collection.countDocuments();
    console.log(`Found ${existingCount} existing students`);

    if (existingCount > 0) {
      console.log("🗑️  Clearing existing students before seeding...");
      await collection.deleteMany({});
      console.log("✅ Existing data cleared");
    }

    // Insert sample students
    const result = await collection.insertMany(sampleStudents);
    console.log(`✅ Successfully seeded ${result.insertedCount} students!`);
    
    // Display inserted students
    console.log("\n📚 Sample students added:");
    sampleStudents.forEach((student, index) => {
      console.log(`${index + 1}. ${student.name} (Age: ${student.age}, Grade: ${student.grade})`);
    });

  } catch (error) {
    console.error("❌ Error seeding database:", error);
  } finally {
    // Close the connection
    await client.close();
    console.log("\n🔌 Database connection closed");
  }
}

// Run the seed function
seedDatabase().catch(console.dir);
