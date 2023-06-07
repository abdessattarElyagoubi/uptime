const express = require('express');
const axios = require('axios');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

// Function to check the availability of a website
async function checkWebsite(website) {
  try {
    await axios.get(website.url);
    return true; // Website is up
  } catch (error) {
    return false; // Website is down
  }
}

app.get('/', async (req, res) => {
  // Read the website configurations from config.json
  const websites = JSON.parse(fs.readFileSync('config.json'));

  const results = await Promise.all(websites.map(checkWebsite));
  const status = websites.map((website, index) => ({
    name: website.name,
    url: website.url,
    status: results[index] ? 'Up' : 'Down',
  }));
  res.json(status);
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
