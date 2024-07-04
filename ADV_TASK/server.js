const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const ejs = require('ejs');
require('dotenv').config();
//const registerRouter = require('./register');

const app = express();
const port = process.env.PORT || 3004;

// MongoDB connection
mongoose.connect('mongodb://localhost:27017/employee', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    serverSelectionTimeoutMS: 5000,
}).catch(err => console.error('MongoDB connection error:', err));

const db = mongoose.connection;
db.on('error', console.error.bind(console, 'MongoDB connection error:'));
db.once('open', () => {
    console.log('Connected to MongoDB');
});

// Schema definition
const userSchema = new mongoose.Schema({
    name: String,
    rollno: String,
    gender: String,
    email: { type: String, unique: true, required: true },
    password: String
});

userSchema.index({ email: 1 }, { unique: true });

// Model definition
const User = mongoose.model('User', userSchema);

// Set EJS as the view engine
app.set('view engine', 'ejs');

// Middleware for parsing JSON and URL-encoded data
app.use(express.json());
app.use(express.urlencoded({ extended: true }));



// Middleware for serving static files (if needed)
app.use(express.static('public'));

// Middleware for authentication using JWT
const authenticateToken = async (req, res, next) => {
    const token = req.header('Authorization');
    if (!token) return res.status(401).send('Access denied. No token provided.');

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        next();
    } catch (error) {
        console.error('Authentication error:', error);
        res.status(401).send('Invalid token');
    }
};

// Serve the HTML form
app.get('/', (req, res) => {
    res.render('index');
});

// Handle form submission to create a new user
app.post('/submit', async (req, res) => {
    const { name, rollno, gender, email, password } = req.body;
    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        const user = new User({ name, rollno, gender, email, password: hashedPassword });
        await user.save();
        res.render('result', { name, email });
    } catch (error) {
        console.error('Error saving user:', error);
        res.status(500).send('Failed to save user data.');
    }
});

// User login route
app.post('/login', async (req, res) => {
    const { email, password } = req.body;
    try {
        const user = await User.findOne({ email });
        if (!user) return res.status(400).send('Invalid email or password.');

        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) return res.status(400).send('Invalid email or password.');

        // Generate JWT token
        const token = jwt.sign({ _id: user._id }, process.env.JWT_SECRET);
        res.send(token);
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).send('An error occurred while processing your request.');
    }
});

// CRUD API Endpoints

// Create a new user
app.post('/api/users', authenticateToken, async (req, res) => {
    const { name, rollno, gender, email, password } = req.body;

    try {
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ error: 'Email already exists. Please use a different email.' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const user = new User({ name, rollno, gender, email, password: hashedPassword });
        await user.save();
        res.status(201).json(user);
    } catch (error) {
        console.error('Error saving user:', error);
        res.status(500).json({ error: 'An error occurred while processing your request.' });
    }
});

// Read all users
app.get('/api/users', authenticateToken, async (req, res) => {
    try {
        const users = await User.find();
        res.json(users);
    } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({ error: 'An error occurred while processing your request.' });
    }
});

// Read a single user by ID
app.get('/api/users/:id', authenticateToken, async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) return res.status(404).send('User not found');
        res.json(user);
    } catch (error) {
        console.error('Error fetching user by ID:', error);
        res.status(500).send('An error occurred while processing your request.');
    }
});

// Update a user by ID
app.put('/api/users/:id', authenticateToken, async (req, res) => {
    const { name, rollno, gender, email, password } = req.body;

    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        const user = await User.findByIdAndUpdate(req.params.id, { name, rollno, gender, email, password: hashedPassword }, { new: true });
        if (!user) return res.status(404).send('User not found');
        res.json(user);
    } catch (error) {
        console.error('Error updating user:', error);
        res.status(500).send('An error occurred while processing your request.');
    }
});

// Delete a user by ID
app.delete('/api/users/:id', authenticateToken, async (req, res) => {
    try {
        const user = await User.findByIdAndDelete(req.params.id);
        if (!user) return res.status(404).send('User not found');
        res.json(user);
    } catch (error) {
        console.error('Error deleting user:', error);
        res.status(500).send('An error occurred while processing your request.');
    }
});

// Start the server
app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});
