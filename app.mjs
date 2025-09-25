import express from 'express'
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { MongoClient, ServerApiVersion, ObjectId } from 'mongodb';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

const app = express()
const PORT = process.env.PORT || 3000;
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

app.use(express.static(join(__dirname, 'public')));

app.use(express.json());

// const { MongoClient, ServerApiVersion } = require('mongodb');
const uri = process.env.MONGO_URI;
// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

// Keep the connection open for our CRUD operations
let db;
async function connectDB() {
  try {
    await client.connect();
    db = client.db("school"); // Database name
    console.log("Connected to MongoDB!");
  } catch (error) {
    console.error("Failed to connect to MongoDB:", error);
  }
}
connectDB();

// JWT Secret (in production, this should be in .env file)
const JWT_SECRET = 'super-secret-key-for-demo-only';

// JWT Middleware - Protect routes that require authentication
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired token' });
    }

    req.user = user; // Add user info to request
    next();
  });
}


app.get('/', (req, res) => {
  res.send('Hello Express from Render 😍😍😍. <a href="barry">barry</a><br><a href="student-crud.html">📝 crud time!</a><br><a href="advanced-student-manager.html">🚀 Advanced CRUD!</a><br><a href="auth.html">🔐 JWT Authentication</a>')
})

// endpoints...middlewares...apis? 

// send an html file
app.get('/barry', (req, res) => {

  res.sendFile(join(__dirname, 'public', 'barry.html'))

})

app.get('/api/barry', (req, res) => {
  // res.send('barry. <a href="/">home</a>')
  const myVar = 'Hello from server!';
  res.json({ myVar });
})

app.get('/api/query', (req, res) => {

  //console.log("client request with query param:", req.query.name); 
  const name = req.query.name;
  res.json({ "message": `Hi, ${name}. How are you?` });

  // receivedData.queries.push(req.query.name || 'Guest');
  // const name = req.query.name || 'Guest';
  // res.json({ message: `Hello, ${name} (from query param)` });
});

app.get('/api/url/:iaddasfsd', (req, res) => {

  console.log("client request with URL param:", req.params.iaddasfsd);
  // const name = req.query.name; 
  // res.json({"message": `Hi, ${name}. How are you?`});

});


app.get('/api/body', (req, res) => {

  console.log("client request with POST body:", req.query);
  // const name = req.body.name; 
  // res.json({"message": `Hi, ${name}. How are you?`});

});

// AUTHENTICATION ENDPOINTS FOR TEACHING
// Collection: users (documents with username, password fields)

// Register new user
app.post('/api/auth/register', async (req, res) => {
  try {
    const { username, password } = req.body;

    // Simple validation
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters long' });
    }

    // Check if user already exists
    const existingUser = await db.collection('users').findOne({ username });
    if (existingUser) {
      return res.status(400).json({ error: 'Username already exists' });
    }

    // Hash password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Create user
    const user = { username, password: hashedPassword, createdAt: new Date() };
    const result = await db.collection('users').insertOne(user);

    console.log(`✅ New user registered: ${username}`);

    res.status(201).json({
      message: 'User registered successfully',
      userId: result.insertedId,
      username: username
    });
  } catch (error) {
    console.error('❌ Registration error:', error.message);
    res.status(500).json({ error: 'Failed to register user: ' + error.message });
  }
});

// Login user
app.post('/api/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    /* DESTRUCTURING. 
    The syntax { username, password } = req.body means:
    Pull out the properties named username and password directly into variables with the same names.
    So instead of writing:
       const username = req.body.username;
       const password = req.body.password;
    
       you can write it in one compact line.
    */

    // Simple validation
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }

    // Find user
    const user = await db.collection('users').findOne({ username });
    if (!user) {
      return res.status(400).json({ error: 'Invalid username or password' });
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(400).json({ error: 'Invalid username or password' });
    }

    // Create JWT token
    const tokenPayload = {
      userId: user._id,
      username: user.username
    };
    const token = jwt.sign(tokenPayload, JWT_SECRET, { expiresIn: '24h' });

    console.log(`✅ User logged in: ${username}`);

    res.json({
      message: 'Login successful',
      token: token,
      user: { id: user._id, username: user.username }
    });
  } catch (error) {
    console.error('❌ Login error:', error.message);
    res.status(500).json({ error: 'Failed to login: ' + error.message });
  }
});

// Get current user info (protected route example)
app.get('/api/auth/me', authenticateToken, async (req, res) => {
  try {
    const user = await db.collection('users').findOne(
      { _id: new ObjectId(req.user.userId) },
      { projection: { password: 0 } } // Don't return password
    );

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ user });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get user info: ' + error.message });
  }
});

// CRUD ENDPOINTS FOR TEACHING
// Collection: students (documents with name, age, grade fields)

// CREATE - Add a new student (PROTECTED)
app.post('/api/students', authenticateToken, async (req, res) => {
  try {
    const { name, age, grade } = req.body;

    // Simple validation
    if (!name || !age || !grade) {
      return res.status(400).json({ error: 'Name, age, and grade are required' });
    }

    const student = {
      name,
      age: parseInt(age),
      grade,
      createdBy: req.user.username, // Track who created this student
      createdAt: new Date()
    };
    const result = await db.collection('students').insertOne(student);

    console.log(`✅ Student created by ${req.user.username}: ${name}`);

    res.status(201).json({
      message: 'Student created successfully',
      studentId: result.insertedId,
      student: { ...student, _id: result.insertedId }
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create student: ' + error.message });
  }
});

// READ - Get all students (PROTECTED)
app.get('/api/students', authenticateToken, async (req, res) => {
  try {
    const students = await db.collection('students').find({}).toArray();
    console.log(`📋 ${req.user.username} viewed ${students.length} students`);
    res.json(students); // Return just the array for frontend simplicity
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch students: ' + error.message });
  }
});

// UPDATE - Update a student by ID (PROTECTED)
app.put('/api/students/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, age, grade } = req.body;

    // Validate ObjectId
    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Invalid student ID' });
    }

    const updateData = { updatedBy: req.user.username, updatedAt: new Date() };
    if (name) updateData.name = name;
    if (age) updateData.age = parseInt(age);
    if (grade) updateData.grade = grade;

    const result = await db.collection('students').updateOne(
      { _id: new ObjectId(id) },
      { $set: updateData }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({ error: 'Student not found' });
    }

    console.log(`✏️ Student updated by ${req.user.username}: ${id}`);

    res.json({
      message: 'Student updated successfully',
      modifiedCount: result.modifiedCount
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update student: ' + error.message });
  }
});

// DELETE - Delete a student by ID (PROTECTED)
app.delete('/api/students/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    // Validate ObjectId
    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Invalid student ID' });
    }

    const result = await db.collection('students').deleteOne({ _id: new ObjectId(id) });

    if (result.deletedCount === 0) {
      return res.status(404).json({ error: 'Student not found' });
    }

    console.log(`🗑️ Student deleted by ${req.user.username}: ${id}`);

    res.json({
      message: 'Student deleted successfully',
      deletedCount: result.deletedCount
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete student: ' + error.message });
  }
});

// SEED - Add sample data for teaching (PROTECTED)
app.post('/api/seed', authenticateToken, async (req, res) => {
  try {
    // First, clear existing data
    await db.collection('students').deleteMany({});

    // Sample students for teaching
    const sampleStudents = [
      { name: "Alice Johnson", age: 20, grade: "A", createdBy: req.user.username, createdAt: new Date() },
      { name: "Bob Smith", age: 19, grade: "B+", createdBy: req.user.username, createdAt: new Date() },
      { name: "Charlie Brown", age: 21, grade: "A-", createdBy: req.user.username, createdAt: new Date() },
      { name: "Diana Prince", age: 18, grade: "A+", createdBy: req.user.username, createdAt: new Date() },
      { name: "Edward Norton", age: 22, grade: "B", createdBy: req.user.username, createdAt: new Date() },
      { name: "Fiona Apple", age: 19, grade: "A", createdBy: req.user.username, createdAt: new Date() },
      { name: "George Wilson", age: 20, grade: "C+", createdBy: req.user.username, createdAt: new Date() },
      { name: "Hannah Montana", age: 18, grade: "B-", createdBy: req.user.username, createdAt: new Date() }
    ];

    const result = await db.collection('students').insertMany(sampleStudents);

    console.log(`🌱 Database seeded by ${req.user.username}: ${result.insertedCount} students`);

    res.json({
      message: `Database seeded successfully! Added ${result.insertedCount} sample students.`,
      insertedCount: result.insertedCount
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to seed database: ' + error.message });
  }
});

// CLEANUP - Remove all student data (PROTECTED)
app.delete('/api/cleanup', authenticateToken, async (req, res) => {
  try {
    const result = await db.collection('students').deleteMany({});

    console.log(`🧹 Database cleaned by ${req.user.username}: ${result.deletedCount} students removed`);

    res.json({
      message: `Database cleaned successfully! Removed ${result.deletedCount} students.`,
      deletedCount: result.deletedCount
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to cleanup database: ' + error.message });
  }
});


app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}`)
})
