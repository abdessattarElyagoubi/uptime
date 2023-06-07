const express = require('express');
const axios = require('axios');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

let status = {};

// Middleware to parse JSON in request body
app.use(express.json());

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

// Function to update the config.json file with new websites
function addWebsite(name, url) {
  // Read the current websites from config.json
  const websites = JSON.parse(fs.readFileSync('config.json'));

  // Add the new website to the list
  websites.push({ name, url });

  // Write the updated list of websites to config.json
  fs.writeFileSync('config.json', JSON.stringify(websites));

  // Update the status object with the new website
  status[name] = 'Unknown';
}

// Function to update the config.json file by removing a website
function deleteWebsite(name) {
  // Read the current websites from config.json
  const websites = JSON.parse(fs.readFileSync('config.json'));

  // Remove the website with the specified name from the list
  const index = websites.findIndex((website) => website.name === name);
  if (index !== -1) {
    websites.splice(index, 1);
  }

  // Write the updated list of websites to config.json
  fs.writeFileSync('config.json', JSON.stringify(websites));

  // Remove the website from the status object
  delete status[name];
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

// API endpoint to add a new website
app.post('/website', (req, res) => {
  const { name, url } = req.body;

  // Add the new website to config.json and update the status object
  addWebsite(name, url);

  res.sendStatus(200);
});

// API endpoint to delete a website
app.delete('/website/:name', (req, res) => {
  const name = req.params.name;

  // Delete the website from config.json and the status object
  deleteWebsite(name);

  res.sendStatus(200);
});

// Start updating the status of the websites
updateStatus();

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
