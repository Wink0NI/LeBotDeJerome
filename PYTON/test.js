// app.js
const express = require('express');
const path = require('path');
const fs = require('fs');
const bodyParser = require('body-parser');
const app = express();

// Load the database JSON file
const databaseFilePath = path.join(__dirname, 'data', 'database.json');
let database = [];
try {
  const jsonData = fs.readFileSync(databaseFilePath, 'utf8');
  database = JSON.parse(jsonData);
} catch (error) {
  console.error('Error loading database:', error.message);
}

// Set up routes and handle HTTP requests
// For example:
app.get('/data', (req, res) => {
  res.json(database);
});

app.post('/data', (req, res) => {
  const newData = req.body; // Assuming you're using body-parser middleware
  database.push(newData);

  // Save the updated data back to the JSON file
  const jsonData = JSON.stringify(database, null, 2);
  fs.writeFileSync(databaseFilePath, jsonData);

  res.json({ message: 'Data added successfully!' });
});

// Route: Get article by ID
app.get('/article/:id', (req, res) => {
  const articleId = parseInt(req.params.id);
  const article = database.find((article) => article.id === articleId);

  if (article) {
    res.json(article);
  } else {
    res.status(404).json({ error: 'Article not found' });
  }
});

// Set the public folder as the static directory
app.use(express.static(path.join(__dirname, 'public')));

// Route: Home page
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});


// Route: About page
app.get('/about', (req, res) => {
  res.send('This is the About page.');
});

// Route: 404 - Page not found
app.use((req, res) => {
  res.status(404).send('Page not found.');
});

// Start the server
const port = 3000;
app.listen(port, () => {
  console.log(`Server started on http://localhost:${port}`);
});
