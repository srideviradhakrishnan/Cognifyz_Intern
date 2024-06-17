const express = require('express');
const app = express();
const port = 3004; // You can choose any port you prefer

// Set EJS as the view engine
app.set('view engine', 'ejs');

// Middleware to parse incoming request bodies
app.use(express.urlencoded({ extended: true }));

// Serve static files (e.g., CSS, images)
app.use(express.static('public'));

// Route to serve the HTML form
app.get('/', (req, res) => {
    res.render('index');
});

// Route to handle form submission
app.post('/submit', (req, res) => {
    const { name, rollno ,gender,email } = req.body;
    // For demonstration, just console log the submitted data
    
    res.render('result', { name, email });
});

// Start the server
app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});
