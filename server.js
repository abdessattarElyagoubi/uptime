const express = require('express');
const axios = require('axios');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

let status = {};

// Function to check the availability of a website
async function checkWebsite(website) {
  try {
    await axios.head(website.url);
    status[website.name] = 'Up'; // Website is up
    console.log(`${website.name} is up`);
  } catch (error) {
    status[website.name] = 'Down'; // Website is down
    console.log(`${website.name} is down`);
  }
}

// Function to periodically update the status of the websites
async function updateStatus() {
  // Read the website configurations from config.json
  const websites = JSON.parse(fs.readFileSync('config.json'));

  await Promise.all(websites.map(checkWebsite));

  // Wait for 5 seconds before updating the status again
  setTimeout(updateStatus, 5000);
}

// API endpoint to get the status of the websites
app.get('/status', async (req, res) => {
  // Read the website configurations from config.json
  const websites = JSON.parse(fs.readFileSync('config.json'));

  // Check the status of each website
  const currentStatus = websites.map((website) => ({
    name: website.name,
    url: website.url,
    status: status[website.name] || 'Unknown',
  }));

  res.json(currentStatus);
});

// Start updating the status of the websites
updateStatus();

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
